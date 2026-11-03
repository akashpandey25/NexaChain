const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const WalletTransaction = require('../models/WalletTransaction');
const ROIHistory = require('../models/ROIHistory');
const {
  calculateCommissionPaise,
  processReferralCommissions
} = require('../services/referralCommissionService');
const { processDailyROI } = require('../services/roiService');
const { generateToken } = require('../utils/jwt');
const { INVESTMENT_PLANS } = require('../config/plans');

jest.setTimeout(180000);

describe('Multi-Level Referral Commission Engine & Financial Consistency', () => {
  let replSet;
  let adminUser;
  let adminToken;

  // 4-Tier Referral Chain: Root (L3) -> Parent2 (L2) -> Parent1 (L1) -> Investor (Source)
  let rootUser;
  let parent2User;
  let parent1User;
  let investorUser;
  let inactiveParentUser;

  let investorToken;
  let parent1Token;

  // Test-specific illustrative commission rules (NOT assumed company defaults)
  const testActivationRules = {
    IS_ENABLED: true,
    TRIGGER_EVENT: 'INVESTMENT_ACTIVATION',
    CALCULATION_BASIS: 'INVESTMENT_PRINCIPAL',
    MAX_ELIGIBLE_LEVELS: 3,
    LEVEL_RATES_BPS: { 1: 500, 2: 300, 3: 100 }, // Level 1: 5%, Level 2: 3%, Level 3: 1%
    ROUNDING_MODE: 'FLOOR',
    CREDIT_WALLET_IMMEDIATELY: true,
    REQUIRE_ACTIVE_BENEFICIARY: true,
    ELIGIBLE_SOURCE_STATUSES: ['active', 'completed']
  };

  const testRoiRules = {
    IS_ENABLED: true,
    TRIGGER_EVENT: 'ROI_PAYOUT',
    CALCULATION_BASIS: 'ROI_AMOUNT',
    MAX_ELIGIBLE_LEVELS: 2,
    LEVEL_RATES_BPS: { 1: 1000, 2: 500 }, // Level 1: 10%, Level 2: 5% of ROI
    ROUNDING_MODE: 'FLOOR',
    CREDIT_WALLET_IMMEDIATELY: true,
    REQUIRE_ACTIVE_BENEFICIARY: true,
    ELIGIBLE_SOURCE_STATUSES: ['processed']
  };

  beforeAll(async () => {
    // Start an in-memory MongoDB Replica Set to verify multi-document transactions
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = replSet.getUri();
    await connectDB(uri);

    // Build model indexes
    await Promise.all([
      User.init(),
      Investment.init(),
      ReferralIncome.init(),
      WalletTransaction.init(),
      ROIHistory.init()
    ]);

    // Admin user
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin_ref@example.com',
      password: 'AdminPassword123!',
      referralCode: 'ADMREF01',
      role: 'admin',
      walletBalancePaise: 0
    });
    adminToken = generateToken(adminUser);

    // Root user (Level 3 upline)
    rootUser = await User.create({
      name: 'Root Member',
      email: 'root@example.com',
      password: 'Password123!',
      referralCode: 'REFROOT',
      referredBy: null,
      walletBalancePaise: 0
    });

    // Parent 2 user (Level 2 upline)
    parent2User = await User.create({
      name: 'Parent Two',
      email: 'parent2@example.com',
      password: 'Password123!',
      referralCode: 'REFPAR2',
      referredBy: rootUser._id,
      walletBalancePaise: 0
    });

    // Parent 1 user (Level 1 direct sponsor)
    parent1User = await User.create({
      name: 'Parent One',
      email: 'parent1@example.com',
      password: 'Password123!',
      referralCode: 'REFPAR1',
      referredBy: parent2User._id,
      walletBalancePaise: 0
    });
    parent1Token = generateToken(parent1User);

    // Investor user (Downline source)
    investorUser = await User.create({
      name: 'Active Investor',
      email: 'investor@example.com',
      password: 'Password123!',
      referralCode: 'REFINV01',
      referredBy: parent1User._id,
      walletBalancePaise: 0
    });
    investorToken = generateToken(investorUser);

    // Inactive parent for eligibility filtering tests
    inactiveParentUser = await User.create({
      name: 'Suspended Member',
      email: 'suspended@example.com',
      password: 'Password123!',
      referralCode: 'REFSUSP',
      referredBy: null,
      isActive: false,
      walletBalancePaise: 0
    });
  });

  afterAll(async () => {
    await disconnectDB();
    if (replSet) {
      await replSet.stop();
    }
  });

  beforeEach(async () => {
    // Reset database collections before each test case
    await Investment.deleteMany({});
    await ReferralIncome.deleteMany({});
    await WalletTransaction.deleteMany({});
    await ROIHistory.deleteMany({});

    // Reset wallet balances
    await User.updateMany({}, { walletBalancePaise: 0 });
  });

  describe('1. Configuration Validation & Fail-Safe Guards', () => {
    test('Throws explicit error when commission processing is disabled or unapproved', async () => {
      // By default IS_ENABLED is false
      await expect(
        processReferralCommissions({ type: 'INVESTMENT_ACTIVATION', investmentId: new mongoose.Types.ObjectId() }, {
          customRules: { IS_ENABLED: false }
        })
      ).rejects.toThrow('Commission processing is currently DISABLED');
    });

    test('Rejects invalid trigger events and unapproved calculation bases', async () => {
      await expect(
        processReferralCommissions({ type: 'UNKNOWN_TRIGGER' }, {
          customRules: { IS_ENABLED: true, TRIGGER_EVENT: 'UNKNOWN_TRIGGER' }
        })
      ).rejects.toThrow('TRIGGER_EVENT');

      await expect(
        processReferralCommissions({ type: 'INVESTMENT_ACTIVATION' }, {
          customRules: {
            IS_ENABLED: true,
            TRIGGER_EVENT: 'INVESTMENT_ACTIVATION',
            CALCULATION_BASIS: 'INVALID_BASIS'
          }
        })
      ).rejects.toThrow('CALCULATION_BASIS');
    });

    test('Rejects invalid level rates or out-of-bounds percentage basis points', async () => {
      await expect(
        processReferralCommissions({ type: 'INVESTMENT_ACTIVATION' }, {
          customRules: {
            ...testActivationRules,
            LEVEL_RATES_BPS: { 1: -50 } // Negative rate
          }
        })
      ).rejects.toThrow('must be an integer between 0 and 10000 basis points');

      await expect(
        processReferralCommissions({ type: 'INVESTMENT_ACTIVATION' }, {
          customRules: {
            ...testActivationRules,
            LEVEL_RATES_BPS: { 1: 15000 } // Exceeds 100% (10000 bps)
          }
        })
      ).rejects.toThrow('must be an integer between 0 and 10000 basis points');
    });

    test('Rejects invalid maximum eligible levels', async () => {
      await expect(
        processReferralCommissions({ type: 'INVESTMENT_ACTIVATION' }, {
          customRules: {
            ...testActivationRules,
            MAX_ELIGIBLE_LEVELS: 0
          }
        })
      ).rejects.toThrow('MAX_ELIGIBLE_LEVELS');
    });
  });

  describe('2. Mathematical Precision & Rounding Policy', () => {
    test('Calculates exact integer paise via BigInt and basis points using FLOOR mode', () => {
      // 100000 paise (₹1,000.00) @ 5% (500 bps) = 5000 paise (₹50.00)
      const commission1 = calculateCommissionPaise(100000, 500, 'FLOOR');
      expect(commission1).toBe(5000);

      // 75 paise @ 1% (100 bps) = 0.75 paise -> FLOOR = 0 paise
      const commission2 = calculateCommissionPaise(75, 100, 'FLOOR');
      expect(commission2).toBe(0);

      // 75 paise @ 1% -> ROUND (0.75 >= 0.5) = 1 paise
      const commission3 = calculateCommissionPaise(75, 100, 'ROUND');
      expect(commission3).toBe(1);

      // 75 paise @ 1% -> CEIL = 1 paise
      const commission4 = calculateCommissionPaise(75, 100, 'CEIL');
      expect(commission4).toBe(1);
    });

    test('Handles zero commission, non-negative validation, and large numbers without precision loss', () => {
      expect(calculateCommissionPaise(0, 500)).toBe(0);
      expect(calculateCommissionPaise(100000, 0)).toBe(0);

      expect(() => calculateCommissionPaise(-100, 500)).toThrow('Invalid basis amount');
      expect(() => calculateCommissionPaise(100, -50)).toThrow('Invalid rate in basis points');

      // Large monetary volume: ₹100,000,000.00 (10,000,000,000 paise) @ 7.5% (750 bps)
      const largePaise = 10000000000;
      const expectedCommission = 750000000; // ₹7,500,000.00 (750,000,000 paise)
      expect(calculateCommissionPaise(largePaise, 750, 'FLOOR')).toBe(expectedCommission);
    });
  });

  describe('3. Multi-Level Referral Traversal & Beneficiary Eligibility', () => {
    test('Traverses multi-tier upline, applies tier percentages, and skips inactive beneficiaries', async () => {
      // Create user sponsored by inactive user
      const downlineOfInactive = await User.create({
        name: 'Downline User',
        email: 'downline@example.com',
        password: 'Password123!',
        referralCode: 'REFDWN01',
        referredBy: inactiveParentUser._id,
        walletBalancePaise: 0
      });

      const investment = await Investment.create({
        user: downlineOfInactive._id,
        principalAmountPaise: 100000, // ₹1,000.00
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active'
      });

      const summary = await processReferralCommissions(
        { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
        { customRules: testActivationRules }
      );

      // Inactive parent should be evaluated but skipped
      expect(summary.ancestorsEvaluated).toBe(1);
      expect(summary.commissionsGenerated).toBe(0);
      expect(summary.commissionsSkipped).toBe(1);

      const inactiveUserCheck = await User.findById(inactiveParentUser._id);
      expect(inactiveUserCheck.walletBalancePaise).toBe(0);
    });

    test('Breaks potential referral cycles without infinite loops or memory leaks', async () => {
      // Create cyclic relationship: CycleUserA <-> CycleUserB
      const userA = await User.create({
        name: 'Cycle User A',
        email: 'cyclea@example.com',
        password: 'Password123!',
        referralCode: 'REFCYCA',
        referredBy: null
      });

      const userB = await User.create({
        name: 'Cycle User B',
        email: 'cycleb@example.com',
        password: 'Password123!',
        referralCode: 'REFCYCB',
        referredBy: userA._id
      });

      // Close cycle: A referred by B
      await User.updateOne({ _id: userA._id }, { referredBy: userB._id });

      const investment = await Investment.create({
        user: userB._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 1.0,
        status: 'active'
      });

      const summary = await processReferralCommissions(
        { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
        { customRules: testActivationRules }
      );

      // Traversal halts at cycle detection; only userA receives Level 1 commission
      expect(summary.commissionsGenerated).toBe(1);
      expect(summary.commissions[0].beneficiaryId).toBe(userA._id.toString());
      expect(summary.commissions[0].level).toBe(1);
    });
  });

  describe('4. Financial Ledger Consistency & Multi-Tier Wallet Crediting', () => {
    test('Accurately credits all 3 levels of upline beneficiaries atomically on investment activation', async () => {
      // Investment of ₹10,000.00 (1,000,000 paise)
      const investment = await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 1000000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active'
      });

      const summary = await processReferralCommissions(
        { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
        { customRules: testActivationRules }
      );

      // Level 1: 5% of 1000000 = 50000 paise (₹500.00) -> parent1User
      // Level 2: 3% of 1000000 = 30000 paise (₹300.00) -> parent2User
      // Level 3: 1% of 1000000 = 10000 paise (₹100.00) -> rootUser
      expect(summary.commissionsGenerated).toBe(3);
      expect(summary.totalCommissionPaise).toBe(90000); // ₹900.00 total

      // Verify Parent 1 balance and ledger
      const updatedParent1 = await User.findById(parent1User._id);
      expect(updatedParent1.walletBalancePaise).toBe(50000);

      const walletTx1 = await WalletTransaction.findOne({ user: parent1User._id });
      expect(walletTx1).toBeTruthy();
      expect(walletTx1.type).toBe('credit');
      expect(walletTx1.amountPaise).toBe(50000);
      expect(walletTx1.sourceType).toBe('referral');

      // Verify Parent 2 balance
      const updatedParent2 = await User.findById(parent2User._id);
      expect(updatedParent2.walletBalancePaise).toBe(30000);

      // Verify Root balance
      const updatedRoot = await User.findById(rootUser._id);
      expect(updatedRoot.walletBalancePaise).toBe(10000);

      // Verify Investor balance (source user) remains unchanged
      const updatedInvestor = await User.findById(investorUser._id);
      expect(updatedInvestor.walletBalancePaise).toBe(0);

      // Verify ReferralIncome records
      const refIncomes = await ReferralIncome.find({ sourceInvestment: investment._id }).sort({ level: 1 });
      expect(refIncomes.length).toBe(3);
      expect(refIncomes[0].beneficiary.toString()).toBe(parent1User._id.toString());
      expect(refIncomes[0].amountPaise).toBe(50000);
      expect(refIncomes[0].status).toBe('processed');

      expect(refIncomes[1].beneficiary.toString()).toBe(parent2User._id.toString());
      expect(refIncomes[1].amountPaise).toBe(30000);

      expect(refIncomes[2].beneficiary.toString()).toBe(rootUser._id.toString());
      expect(refIncomes[2].amountPaise).toBe(10000);
    });

    test('Creates commission records with status pending and does not modify wallets when CREDIT_WALLET_IMMEDIATELY is false', async () => {
      const investment = await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 1.0,
        status: 'active'
      });

      const summary = await processReferralCommissions(
        { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
        {
          customRules: {
            ...testActivationRules,
            CREDIT_WALLET_IMMEDIATELY: false
          }
        }
      );

      expect(summary.commissionsGenerated).toBe(3);

      // Verify status is pending
      const records = await ReferralIncome.find({ sourceInvestment: investment._id });
      expect(records.every((r) => r.status === 'pending')).toBe(true);

      // Wallets must remain untouched (0 paise)
      const p1 = await User.findById(parent1User._id);
      expect(p1.walletBalancePaise).toBe(0);

      const walletTxs = await WalletTransaction.find({});
      expect(walletTxs.length).toBe(0);
    });
  });

  describe('5. Idempotency, Concurrency & Duplicate Prevention', () => {
    test('Repeated processing of the same source event safely skips already credited levels', async () => {
      const investment = await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 200000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active'
      });

      // First run: processes commissions
      const summary1 = await processReferralCommissions(
        { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
        { customRules: testActivationRules }
      );
      expect(summary1.commissionsGenerated).toBe(3);

      // Second run: must skip all already credited levels
      const summary2 = await processReferralCommissions(
        { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
        { customRules: testActivationRules }
      );
      expect(summary2.commissionsGenerated).toBe(0);
      expect(summary2.commissionsSkipped).toBe(3);

      // Balances must not be double credited
      // Level 1: 5% of 200000 = 10000 paise (₹100.00)
      const p1 = await User.findById(parent1User._id);
      expect(p1.walletBalancePaise).toBe(10000);

      const refIncomeCount = await ReferralIncome.countDocuments({ sourceInvestment: investment._id });
      expect(refIncomeCount).toBe(3);
    });

    test('Concurrent duplicate processing handles race conditions without double payouts', async () => {
      const investment = await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 1.0,
        status: 'active'
      });

      // Execute 2 concurrent process runs simultaneously for the exact same event
      const [run1, run2] = await Promise.all([
        processReferralCommissions(
          { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
          { customRules: testActivationRules }
        ),
        processReferralCommissions(
          { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
          { customRules: testActivationRules }
        )
      ]);

      const totalGenerated = run1.commissionsGenerated + run2.commissionsGenerated;
      const totalSkipped = run1.commissionsSkipped + run2.commissionsSkipped;

      expect(totalGenerated).toBe(3);
      expect(totalSkipped).toBe(3);

      // Parent 1 must only receive 5% once (5000 paise)
      const p1 = await User.findById(parent1User._id);
      expect(p1.walletBalancePaise).toBe(5000);
    });
  });

  describe('6. ROI_PAYOUT Trigger Integration', () => {
    test('Generates referral commissions atomically during daily ROI processing when configured for ROI_PAYOUT', async () => {
      const investment = await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 100000, // ₹1,000.00 @ 1.5% daily = 1500 paise
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Run daily ROI with referralCustomRules enabling ROI_PAYOUT trigger
      const roiSummary = await processDailyROI('2026-11-03', {
        referralCustomRules: testRoiRules
      });

      expect(roiSummary.processedInvestments).toBe(1);
      expect(roiSummary.totalRoiGeneratedPaise).toBe(1500);

      // Investor wallet receives 1500 paise ROI
      const investor = await User.findById(investorUser._id);
      expect(investor.walletBalancePaise).toBe(1500);

      // Level 1: 10% of 1500 = 150 paise -> parent1User
      const p1 = await User.findById(parent1User._id);
      expect(p1.walletBalancePaise).toBe(150);

      // Level 2: 5% of 1500 = 75 paise -> parent2User
      const p2 = await User.findById(parent2User._id);
      expect(p2.walletBalancePaise).toBe(75);

      // Root is Level 3; testRoiRules only has 2 levels -> Root receives 0
      const root = await User.findById(rootUser._id);
      expect(root.walletBalancePaise).toBe(0);

      // Verify ReferralIncome records created with status processed
      const refIncomes = await ReferralIncome.find({ sourceInvestment: investment._id }).sort({ level: 1 });
      expect(refIncomes.length).toBe(2);
      expect(refIncomes[0].amountPaise).toBe(150);
      expect(refIncomes[1].amountPaise).toBe(75);
    });

    test('Does NOT generate commissions during daily ROI when TRIGGER_EVENT is INVESTMENT_ACTIVATION', async () => {
      await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Run daily ROI with INVESTMENT_ACTIVATION trigger (must not trigger during ROI)
      await processDailyROI('2026-11-03', {
        referralCustomRules: testActivationRules
      });

      // No referral incomes should be created
      const refIncomes = await ReferralIncome.find({});
      expect(refIncomes.length).toBe(0);

      const p1 = await User.findById(parent1User._id);
      expect(p1.walletBalancePaise).toBe(0);
    });
  });

  describe('7. Administrative Commission Trigger API & Compatibility', () => {
    test('POST /api/referrals/process enforces admin authorization', async () => {
      const investment = await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active'
      });

      // Normal user: HTTP 403 Forbidden
      const resUser = await request(app)
        .post('/api/referrals/process')
        .set('Authorization', `Bearer ${investorToken}`)
        .send({
          sourceType: 'investment',
          sourceId: investment._id.toString()
        });

      expect(resUser.status).toBe(403);
      expect(resUser.body.success).toBe(false);

      // Admin user with unapproved rules: fails safely with guidance
      const resAdmin = await request(app)
        .post('/api/referrals/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceType: 'investment',
          sourceId: investment._id.toString()
        });

      // Because production environment has IS_ENABLED = false, it safely rejects with 500/configuration error
      expect(resAdmin.status).toBe(500);
      expect(resAdmin.body.message).toContain('Commission processing is currently DISABLED');
    });

    test('GET /api/referrals/income seamlessly returns generated commissions with data isolation', async () => {
      const investment = await Investment.create({
        user: investorUser._id,
        principalAmountPaise: 1000000, // ₹10,000.00
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active'
      });

      // Generate commissions using test rules
      await processReferralCommissions(
        { type: 'INVESTMENT_ACTIVATION', investmentId: investment._id },
        { customRules: testActivationRules }
      );

      // Query as Parent 1 (Level 1 beneficiary)
      const resP1 = await request(app)
        .get('/api/referrals/income')
        .set('Authorization', `Bearer ${parent1Token}`);

      expect(resP1.status).toBe(200);
      expect(resP1.body.success).toBe(true);
      expect(resP1.body.data.summary.processedIncomePaise).toBe(50000);
      expect(resP1.body.data.incomeRecords.length).toBe(1);
      expect(resP1.body.data.incomeRecords[0].level).toBe(1);
      expect(resP1.body.data.incomeRecords[0].amountPaise).toBe(50000);
      expect(resP1.body.data.incomeRecords[0].sourceUser).toHaveProperty('name', investorUser.name);

      // Query as Investor (has no referral income) -> strict user isolation
      const resInv = await request(app)
        .get('/api/referrals/income')
        .set('Authorization', `Bearer ${investorToken}`);

      expect(resInv.status).toBe(200);
      expect(resInv.body.data.summary.totalIncomePaise).toBe(0);
      expect(resInv.body.data.incomeRecords.length).toBe(0);
    });
  });
});
