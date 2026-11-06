const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const WalletTransaction = require('../models/WalletTransaction');
const {
  supportsTransactions,
  normalizeBusinessDate,
  calculateDailyRoiPaise,
  processDailyROI
} = require('../services/roiService');
const { generateToken } = require('../utils/jwt');
const { INVESTMENT_PLANS } = require('../config/plans');

jest.setTimeout(180000);

describe('Daily ROI Processing Engine & APIs', () => {
  let replSet;
  let testUser;
  let testUser2;
  let adminUser;
  let userToken;
  let user2Token;
  let adminToken;

  beforeAll(async () => {
    // Start an in-memory MongoDB Replica Set to verify multi-document transactions
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = replSet.getUri();
    await connectDB(uri);

    // Ensure all model indexes are built on the replica set
    await Promise.all([
      User.init(),
      Investment.init(),
      ROIHistory.init(),
      WalletTransaction.init()
    ]);

    // Create primary test user
    testUser = await User.create({
      name: 'ROI User One',
      email: 'roione@example.com',
      password: 'Password123!',
      referralCode: 'ROI001',
      role: 'user',
      walletBalancePaise: 0
    });
    userToken = generateToken(testUser);

    // Create second test user for data isolation tests
    testUser2 = await User.create({
      name: 'ROI User Two',
      email: 'roitwo@example.com',
      password: 'Password123!',
      referralCode: 'ROI002',
      role: 'user',
      walletBalancePaise: 50000
    });
    user2Token = generateToken(testUser2);

    // Create admin user for trigger endpoint testing
    adminUser = await User.create({
      name: 'ROI Admin User',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      referralCode: 'ADMIN01',
      role: 'admin',
      walletBalancePaise: 0
    });
    adminToken = generateToken(adminUser);
  });

  afterAll(async () => {
    await disconnectDB();
    if (replSet) {
      await replSet.stop();
    }
  });

  beforeEach(async () => {
    // Clean up investment and financial ledger collections between test cases
    await Investment.deleteMany({});
    await ROIHistory.deleteMany({});
    await WalletTransaction.deleteMany({});
    await User.updateOne({ _id: testUser._id }, { walletBalancePaise: 0 });
    await User.updateOne({ _id: testUser2._id }, { walletBalancePaise: 50000 });
  });

  describe('1. Configuration & Mathematical Calculations', () => {
    test('calculateDailyRoiPaise computes accurate integer paise using FLOOR mode', () => {
      // 100000 paise (₹1,000.00) @ 1.5% = 1500 paise (₹15.00)
      const roi1 = calculateDailyRoiPaise(100000, 1.5, 'FLOOR');
      expect(roi1).toBe(1500);

      // 75 paise @ 1.0% = 0.75 paise -> FLOOR = 0 paise
      const roi2 = calculateDailyRoiPaise(75, 1.0, 'FLOOR');
      expect(roi2).toBe(0);

      // 75 paise @ 1.0% -> ROUND = 1 paise
      const roi3 = calculateDailyRoiPaise(75, 1.0, 'ROUND');
      expect(roi3).toBe(1);

      // 75 paise @ 1.0% -> CEIL = 1 paise
      const roi4 = calculateDailyRoiPaise(75, 1.0, 'CEIL');
      expect(roi4).toBe(1);
    });

    test('calculateDailyRoiPaise rejects negative values and invalid inputs', () => {
      expect(() => calculateDailyRoiPaise(-1000, 1.0)).toThrow('Invalid principal amount');
      expect(() => calculateDailyRoiPaise(1000, -1.0)).toThrow('Invalid ROI percentage');
      expect(() => calculateDailyRoiPaise('invalid', 1.0)).toThrow('Invalid principal amount');
    });

    test('normalizeBusinessDate normalizes to business timezone (Asia/Kolkata)', () => {
      const res = normalizeBusinessDate('2026-11-03', 'Asia/Kolkata');
      expect(res.dateKey).toBe('2026-11-03');
      expect(res.normalizedUtcMidnight.toISOString()).toBe('2026-11-03T00:00:00.000Z');
      expect(res.startOfBusinessDay).toBeInstanceOf(Date);
      expect(res.endOfBusinessDay).toBeInstanceOf(Date);
    });

    test('processDailyROI fails clearly when required business rules are missing or invalid', async () => {
      await expect(
        processDailyROI('2026-11-03', { customRules: { TIMEZONE: '' } })
      ).rejects.toThrow('ROI Configuration Error: "TIMEZONE"');

      await expect(
        processDailyROI('2026-11-03', { customRules: { ROUNDING_MODE: 'INVALID' } })
      ).rejects.toThrow('ROI Configuration Error: "ROUNDING_MODE"');

      await expect(
        processDailyROI('2026-11-03', { customRules: { PLANS: null } })
      ).rejects.toThrow('ROI Configuration Error: Authorized investment plans registry');
    });

    test('supportsTransactions returns true on the replica set deployment', async () => {
      const supported = await supportsTransactions();
      expect(supported).toBe(true);
    });
  });

  describe('2. Investment Eligibility & Status Boundaries', () => {
    test('Excludes pending, completed, and cancelled investments', async () => {
      const businessDate = '2026-11-03';

      // Pending
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: INVESTMENT_PLANS.GROWTH.roiPercentage,
        status: 'pending',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Completed
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 200000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: INVESTMENT_PLANS.GROWTH.roiPercentage,
        status: 'completed',
        startDate: new Date('2026-10-01T00:00:00.000Z')
      });

      // Cancelled
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 300000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: INVESTMENT_PLANS.GROWTH.roiPercentage,
        status: 'cancelled',
        startDate: new Date('2026-10-01T00:00:00.000Z')
      });

      const summary = await processDailyROI(businessDate);
      expect(summary.eligibleInvestments).toBe(0);
      expect(summary.processedInvestments).toBe(0);
      expect(summary.totalRoiGeneratedPaise).toBe(0);

      const roiRecords = await ROIHistory.find({});
      expect(roiRecords.length).toBe(0);
    });

    test('Excludes investments with future start-date boundary', async () => {
      const businessDate = '2026-11-03';

      // Start date is in the future relative to 2026-11-03
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: INVESTMENT_PLANS.GROWTH.roiPercentage,
        status: 'active',
        startDate: new Date('2026-11-05T00:00:00.000Z')
      });

      const summary = await processDailyROI(businessDate);
      expect(summary.eligibleInvestments).toBe(0);
      expect(summary.processedInvestments).toBe(0);
    });

    test('Excludes investments with elapsed end-date boundary', async () => {
      const businessDate = '2026-11-03';

      // End date was 2026-11-01, which has already elapsed
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: INVESTMENT_PLANS.GROWTH.roiPercentage,
        status: 'active',
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-11-01T00:00:00.000Z')
      });

      const summary = await processDailyROI(businessDate);
      expect(summary.eligibleInvestments).toBe(0);
      expect(summary.processedInvestments).toBe(0);
    });
  });

  describe('3. Financial Ledger Consistency & Transaction Rollback', () => {
    test('Accurately processes active investment, updates cumulative ROI, credits wallet and creates ledger entry', async () => {
      const businessDate = '2026-11-03';

      const investment = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000, // ₹1,000.00
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5, // 1.5% daily = 1500 paise
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      const summary = await processDailyROI(businessDate);
      expect(summary.eligibleInvestments).toBe(1);
      expect(summary.processedInvestments).toBe(1);
      expect(summary.skippedInvestments).toBe(0);
      expect(summary.failedInvestments).toBe(0);
      expect(summary.totalRoiGeneratedPaise).toBe(1500);

      // Verify ROIHistory record
      const roiRecord = await ROIHistory.findOne({ investment: investment._id });
      expect(roiRecord).toBeTruthy();
      expect(roiRecord.amountPaise).toBe(1500);
      expect(roiRecord.roiPercentageApplied).toBe(1.5);
      expect(roiRecord.status).toBe('processed');
      expect(roiRecord.transactionKey).toBe(`roi_${investment._id}_2026-11-03`);

      // Verify cumulative ROI update on Investment
      const updatedInvestment = await Investment.findById(investment._id);
      expect(updatedInvestment.totalRoiEarnedPaise).toBe(1500);

      // Verify User wallet update
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.walletBalancePaise).toBe(1500);

      // Verify WalletTransaction ledger entry
      const walletTx = await WalletTransaction.findOne({ user: testUser._id, sourceType: 'roi' });
      expect(walletTx).toBeTruthy();
      expect(walletTx.type).toBe('credit');
      expect(walletTx.amountPaise).toBe(1500);
      expect(walletTx.sourceId.toString()).toBe(roiRecord._id.toString());
      expect(walletTx.transactionKey).toBe(`wallet_roi_${investment._id}_2026-11-03`);
    });

    test('Ensures complete rollback if a transaction operation fails', async () => {
      const businessDate = '2026-11-03';

      // Create an investment referencing a plan whose rate was forged or unapproved
      const forgedInvestment = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 99.0, // Forged rate mismatch with GROWTH plan (1.5%)
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      const summary = await processDailyROI(businessDate);
      expect(summary.eligibleInvestments).toBe(1);
      expect(summary.processedInvestments).toBe(0);
      expect(summary.failedInvestments).toBe(1);
      expect(summary.failures[0].reason).toContain('rate mismatch');

      // Verify nothing was persisted
      const roiRecord = await ROIHistory.findOne({ investment: forgedInvestment._id });
      expect(roiRecord).toBeNull();

      const user = await User.findById(testUser._id);
      expect(user.walletBalancePaise).toBe(0);

      const walletTx = await WalletTransaction.findOne({ user: testUser._id });
      expect(walletTx).toBeNull();
    });
  });

  describe('4. Idempotency & Concurrency', () => {
    test('Duplicate processing for the same business date is safely skipped without double crediting', async () => {
      const businessDate = '2026-11-03';

      const investment = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 200000, // ₹2,000.00 @ 1.5% = 3000 paise
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // First run: processes investment
      const summary1 = await processDailyROI(businessDate);
      expect(summary1.processedInvestments).toBe(1);
      expect(summary1.totalRoiGeneratedPaise).toBe(3000);

      // Second run on the same business date: must skip safely
      const summary2 = await processDailyROI(businessDate);
      expect(summary2.processedInvestments).toBe(0);
      expect(summary2.skippedInvestments).toBe(1);
      expect(summary2.totalRoiGeneratedPaise).toBe(0);

      // Wallet must not be double credited
      const user = await User.findById(testUser._id);
      expect(user.walletBalancePaise).toBe(3000);

      // Exactly 1 ROI record and 1 WalletTransaction must exist
      const roiCount = await ROIHistory.countDocuments({ investment: investment._id });
      expect(roiCount).toBe(1);

      const walletTxCount = await WalletTransaction.countDocuments({ user: testUser._id });
      expect(walletTxCount).toBe(1);
    });

    test('Concurrent duplicate execution handles race conditions without duplicate payouts', async () => {
      const businessDate = '2026-11-03';

      const investment = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 1.0,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Fire 2 concurrent process runs simultaneously for the exact same date
      const [run1, run2] = await Promise.all([
        processDailyROI(businessDate),
        processDailyROI(businessDate)
      ]);

      const totalProcessed = run1.processedInvestments + run2.processedInvestments;
      const totalSkipped = run1.skippedInvestments + run2.skippedInvestments;

      expect(totalProcessed).toBe(1);
      expect(totalSkipped).toBe(1);

      const roiCount = await ROIHistory.countDocuments({ investment: investment._id });
      expect(roiCount).toBe(1);

      const user = await User.findById(testUser._id);
      expect(user.walletBalancePaise).toBe(1000); // 100000 * 1.0% = 1000 paise
    });
  });

  describe('5. Batch Processing & Partial Failure Resilience', () => {
    test('Iterates through multiple batches and processes individual failures without halting valid items', async () => {
      const businessDate = '2026-11-03';

      // Investment 1: Valid Starter (1.0% of 100000 = 1000 paise)
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 1.0,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Investment 2: Invalid Plan Name
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 200000,
        planName: 'UNAUTHORIZED_SCHEME',
        roiPercentage: 5.0,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Investment 3: Valid Growth (1.5% of 200000 = 3000 paise)
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 200000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Process with batchSize = 2 to enforce batch iteration
      const summary = await processDailyROI(businessDate, { batchSize: 2 });
      expect(summary.eligibleInvestments).toBe(3);
      expect(summary.processedInvestments).toBe(2);
      expect(summary.failedInvestments).toBe(1);
      expect(summary.totalRoiGeneratedPaise).toBe(4000); // 1000 + 3000
      expect(summary.failures[0].reason).toContain('references unknown or unapproved plan');

      const user = await User.findById(testUser._id);
      expect(user.walletBalancePaise).toBe(4000);
    });
  });

  describe('6. ROI History & Summary APIs', () => {
    let inv1;

    beforeEach(async () => {
      inv1 = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Create historical ROI records for user 1
      await ROIHistory.create([
        {
          user: testUser._id,
          investment: inv1._id,
          amountPaise: 1500,
          roiPercentageApplied: 1.5,
          businessDate: new Date('2026-11-01T00:00:00.000Z'),
          status: 'processed',
          transactionKey: `roi_${inv1._id}_2026-11-01`
        },
        {
          user: testUser._id,
          investment: inv1._id,
          amountPaise: 1500,
          roiPercentageApplied: 1.5,
          businessDate: new Date('2026-11-02T00:00:00.000Z'),
          status: 'processed',
          transactionKey: `roi_${inv1._id}_2026-11-02`
        },
        {
          user: testUser._id,
          investment: inv1._id,
          amountPaise: 1500,
          roiPercentageApplied: 1.5,
          businessDate: new Date('2026-11-03T00:00:00.000Z'),
          status: 'pending',
          transactionKey: `roi_${inv1._id}_2026-11-03`
        }
      ]);
    });

    test('GET /api/roi/history rejects unauthenticated requests with HTTP 401', async () => {
      const res = await request(app).get('/api/roi/history');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/roi/history returns paginated records for authenticated user and isolates user data', async () => {
      // User 1 query
      const res1 = await request(app)
        .get('/api/roi/history?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.roiRecords.length).toBe(2);
      expect(res1.body.data.pagination.totalRecords).toBe(3);
      expect(res1.body.data.pagination.totalPages).toBe(2);
      expect(res1.body.data.pagination.hasNextPage).toBe(true);

      // Verify safe populated investment fields
      const record = res1.body.data.roiRecords[0];
      expect(record.investment).toHaveProperty('planName', INVESTMENT_PLANS.GROWTH.name);

      // User 2 query (must be empty - strict user isolation)
      const res2 = await request(app)
        .get('/api/roi/history')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.roiRecords.length).toBe(0);
      expect(res2.body.data.pagination.totalRecords).toBe(0);
    });

    test('GET /api/roi/history supports status and date range filtering', async () => {
      const resStatus = await request(app)
        .get('/api/roi/history?status=pending')
        .set('Authorization', `Bearer ${userToken}`);

      expect(resStatus.status).toBe(200);
      expect(resStatus.body.data.roiRecords.length).toBe(1);
      expect(resStatus.body.data.roiRecords[0].status).toBe('pending');

      const resDate = await request(app)
        .get('/api/roi/history?startDate=2026-11-01&endDate=2026-11-02')
        .set('Authorization', `Bearer ${userToken}`);

      expect(resDate.status).toBe(200);
      expect(resDate.body.data.roiRecords.length).toBe(2);
    });

    test('GET /api/roi/history rejects invalid query parameters with HTTP 400', async () => {
      // 1. Invalid non-integer page
      const resPageAlpha = await request(app)
        .get('/api/roi/history?page=abc')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resPageAlpha.status).toBe(400);
      expect(resPageAlpha.body.success).toBe(false);

      // 2. Negative page
      const resPageNeg = await request(app)
        .get('/api/roi/history?page=-1')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resPageNeg.status).toBe(400);
      expect(resPageNeg.body.success).toBe(false);

      // 3. Zero page
      const resPageZero = await request(app)
        .get('/api/roi/history?page=0')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resPageZero.status).toBe(400);
      expect(resPageZero.body.success).toBe(false);

      // 4. Invalid limit (exceeds max 100)
      const resLimitOver = await request(app)
        .get('/api/roi/history?limit=150')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resLimitOver.status).toBe(400);
      expect(resLimitOver.body.success).toBe(false);

      // 5. Zero limit
      const resLimitZero = await request(app)
        .get('/api/roi/history?limit=0')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resLimitZero.status).toBe(400);
      expect(resLimitZero.body.success).toBe(false);

      // 6. Invalid status
      const resStatusInvalid = await request(app)
        .get('/api/roi/history?status=unrecognized_status')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resStatusInvalid.status).toBe(400);
      expect(resStatusInvalid.body.success).toBe(false);

      // 7. Invalid date range (startDate > endDate)
      const resDateInverted = await request(app)
        .get('/api/roi/history?startDate=2026-12-01&endDate=2026-11-01')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resDateInverted.status).toBe(400);
      expect(resDateInverted.body.success).toBe(false);

      // 8. Malformed date string
      const resDateMalformed = await request(app)
        .get('/api/roi/history?startDate=not-a-date')
        .set('Authorization', `Bearer ${userToken}`);
      expect(resDateMalformed.status).toBe(400);
      expect(resDateMalformed.body.success).toBe(false);
    });

    test('GET /api/roi/summary returns aggregated processed ROI statistics and excludes pending/failed from total', async () => {
      const res = await request(app)
        .get('/api/roi/summary')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalProcessedRoiPaise).toBe(3000); // 2 processed * 1500 paise
      expect(res.body.data.summary.processedCount).toBe(2);
      expect(res.body.data.summary.pendingCount).toBe(1);
      expect(res.body.data.summary.failedCount).toBe(0);
      expect(res.body.data.summary.totalRecords).toBe(3);
      expect(res.body.data.summary.latestPayout).toHaveProperty('amountPaise', 1500);
    });

    test('POST /api/roi/process enforces admin authorization', async () => {
      // Normal user: HTTP 403 Forbidden
      const resUser = await request(app)
        .post('/api/roi/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ businessDate: '2026-11-04' });

      expect(resUser.status).toBe(403);
      expect(resUser.body.success).toBe(false);

      // Admin user: HTTP 200 OK
      const resAdmin = await request(app)
        .post('/api/roi/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ businessDate: '2026-11-04' });

      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.success).toBe(true);
      expect(resAdmin.body.data).toHaveProperty('eligibleInvestments');
    });
  });

  describe('7. Contract Maturity Lifecycle & Ordering Tests', () => {
    test('Final eligible business day receives ROI exactly once and contract transitions to completed', async () => {
      // 2-day contract: starts Nov 1, ends Nov 2
      const contract = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000, // ₹1,000.00
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5, // 1500 paise per day
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z'),
        endDate: new Date('2026-11-02T23:59:59.999Z')
      });

      // Day 1 (2026-11-01): Not the final day yet
      const summaryDay1 = await processDailyROI('2026-11-01');
      expect(summaryDay1.processedInvestments).toBe(1);

      const contractAfterDay1 = await Investment.findById(contract._id);
      expect(contractAfterDay1.status).toBe('active'); // Must NOT be completed before final day
      expect(contractAfterDay1.totalRoiEarnedPaise).toBe(1500);

      // Day 2 (2026-11-02): Final eligible business day
      const summaryDay2 = await processDailyROI('2026-11-02');
      expect(summaryDay2.processedInvestments).toBe(1);

      const contractAfterDay2 = await Investment.findById(contract._id);
      expect(contractAfterDay2.status).toBe('completed'); // Transitioned to completed atomically
      expect(contractAfterDay2.totalRoiEarnedPaise).toBe(3000); // 1500 + 1500 = 3000 paise

      // Verify exact ROIHistory count for this contract is 2
      const roiCount = await ROIHistory.countDocuments({ investment: contract._id });
      expect(roiCount).toBe(2);
    });

    test('Completed investments cannot receive subsequent ROI on subsequent business days', async () => {
      // Completed contract whose end date was yesterday
      const completedContract = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'completed',
        startDate: new Date('2026-11-01T00:00:00.000Z'),
        endDate: new Date('2026-11-02T23:59:59.999Z'),
        totalRoiEarnedPaise: 3000
      });

      // Attempt to process for Nov 3
      const summaryDay3 = await processDailyROI('2026-11-03');
      expect(summaryDay3.eligibleInvestments).toBe(0);
      expect(summaryDay3.processedInvestments).toBe(0);

      const checkContract = await Investment.findById(completedContract._id);
      expect(checkContract.status).toBe('completed');
      expect(checkContract.totalRoiEarnedPaise).toBe(3000); // Unchanged

      const roiRecords = await ROIHistory.find({ investment: completedContract._id });
      expect(roiRecords.length).toBe(0);
    });

    test('A cron retry cannot duplicate ROI or completion effects (idempotency)', async () => {
      // 1-day contract for Nov 4
      const contract = await Investment.create({
        user: testUser._id,
        principalAmountPaise: 200000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 1.0, // 2000 paise
        status: 'active',
        startDate: new Date('2026-11-04T00:00:00.000Z'),
        endDate: new Date('2026-11-04T23:59:59.999Z')
      });

      // First run for Nov 4
      const firstRun = await processDailyROI('2026-11-04');
      expect(firstRun.processedInvestments).toBe(1);

      const contractAfterFirst = await Investment.findById(contract._id);
      expect(contractAfterFirst.status).toBe('completed');
      expect(contractAfterFirst.totalRoiEarnedPaise).toBe(2000);

      // Re-run (retry) for same date Nov 4
      const retryRun = await processDailyROI('2026-11-04');
      expect(retryRun.processedInvestments).toBe(0);

      const contractAfterRetry = await Investment.findById(contract._id);
      expect(contractAfterRetry.status).toBe('completed');
      expect(contractAfterRetry.totalRoiEarnedPaise).toBe(2000); // Must remain exactly 2000 paise

      const totalRoiHistoryRows = await ROIHistory.countDocuments({ investment: contract._id });
      expect(totalRoiHistoryRows).toBe(1);
    });

    test('Asia/Kolkata date boundaries normalize calendar day correctly', () => {
      const { normalizeBusinessDate } = require('../services/roiService');

      // Test IST Date normalizer
      const dateContext = normalizeBusinessDate('2026-11-06T18:30:00.000Z', 'Asia/Kolkata');
      // 18:30 UTC on Nov 6 is 00:00 IST on Nov 7
      expect(dateContext.dateKey).toBe('2026-11-07');
      expect(dateContext.normalizedUtcMidnight.toISOString()).toBe('2026-11-07T00:00:00.000Z');
      expect(dateContext.startOfBusinessDay.toISOString()).toBe('2026-11-07T00:00:00.000Z');
      expect(dateContext.endOfBusinessDay.toISOString()).toBe('2026-11-07T23:59:59.999Z');
    });
  });
});
