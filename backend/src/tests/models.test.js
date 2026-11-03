const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  User,
  Investment,
  ROIHistory,
  ReferralIncome,
  WalletTransaction
} = require('../models');

jest.setTimeout(60000);

describe('Mongoose Models Verification & Validation Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    // Ensure all indexes (including compound unique indexes) are built
    await Promise.all([
      User.init(),
      Investment.init(),
      ROIHistory.init(),
      ReferralIncome.init(),
      WalletTransaction.init()
    ]);
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  beforeEach(async () => {
    // Clean collections between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  // 1. USER MODEL TESTS
  describe('User Model', () => {
    test('1.1 Successfully creates a valid user with default values', async () => {
      const user = await User.create({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'securePassword123!',
        referralCode: 'ALICE100'
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe('Alice Johnson');
      expect(user.email).toBe('alice@example.com');
      expect(user.mobileNumber).toBeNull();
      expect(user.referralCode).toBe('ALICE100');
      expect(user.role).toBe('user');
      expect(user.walletBalancePaise).toBe(0);
      expect(user.totalRoiEarnedPaise).toBe(0);
      expect(user.totalLevelIncomeEarnedPaise).toBe(0);
      expect(user.isActive).toBe(true);
      expect(user.referredBy).toBeNull();
      expect(user.createdAt).toBeDefined();
    });

    test('1.2 Excludes password from queries by default (select: false)', async () => {
      await User.create({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'secretPassword',
        referralCode: 'BOB100'
      });

      const foundUser = await User.findOne({ email: 'bob@example.com' });
      expect(foundUser.password).toBeUndefined();
    });

    test('1.3 Rejects duplicate email', async () => {
      await User.create({
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'pass',
        referralCode: 'USER1'
      });

      await expect(
        User.create({
          name: 'User Two',
          email: 'duplicate@example.com',
          password: 'pass',
          referralCode: 'USER2'
        })
      ).rejects.toThrow(/duplicate key/i);
    });

    test('1.4 Rejects duplicate referralCode', async () => {
      await User.create({
        name: 'User One',
        email: 'user1@example.com',
        password: 'pass',
        referralCode: 'SAMECODE'
      });

      await expect(
        User.create({
          name: 'User Two',
          email: 'user2@example.com',
          password: 'pass',
          referralCode: 'SAMECODE'
        })
      ).rejects.toThrow(/duplicate key/i);
    });

    test('1.5 Rejects self-referral (referredBy === _id)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const user = new User({
        _id: userId,
        name: 'Self Referrer',
        email: 'self@example.com',
        password: 'pass',
        referralCode: 'SELF100',
        referredBy: userId
      });

      await expect(user.save()).rejects.toThrow(/self-referral is forbidden/i);
    });

    test('1.6 Rejects non-integer or negative walletBalancePaise', async () => {
      // Floating-point paise
      await expect(
        User.create({
          name: 'Float Balance',
          email: 'float@example.com',
          password: 'pass',
          referralCode: 'FLOAT100',
          walletBalancePaise: 100.5
        })
      ).rejects.toThrow(/non-negative integer/i);

      // Negative paise
      await expect(
        User.create({
          name: 'Negative Balance',
          email: 'negative@example.com',
          password: 'pass',
          referralCode: 'NEG100',
          walletBalancePaise: -500
        })
      ).rejects.toThrow(/non-negative integer/i);
    });

    test('1.7 Successfully stores optional mobileNumber and verifies earnings totals schema', async () => {
      const user = await User.create({
        name: 'Mobile User',
        email: 'mobile@example.com',
        mobileNumber: '+919876543210',
        password: 'pass',
        referralCode: 'MOB100',
        totalRoiEarnedPaise: 25000,
        totalLevelIncomeEarnedPaise: 15000
      });

      expect(user.mobileNumber).toBe('+919876543210');
      expect(user.totalRoiEarnedPaise).toBe(25000);
      expect(user.totalLevelIncomeEarnedPaise).toBe(15000);

      const safe = user.toSafeObject();
      expect(safe.mobileNumber).toBe('+919876543210');
      expect(safe.totalRoiEarnedPaise).toBe(25000);
      expect(safe.totalLevelIncomeEarnedPaise).toBe(15000);
    });
  });

  // 2. INVESTMENT MODEL TESTS
  describe('Investment Model', () => {
    test('2.1 Successfully creates a valid Investment linked to a User', async () => {
      const user = await User.create({
        name: 'Investor',
        email: 'investor@example.com',
        password: 'pass',
        referralCode: 'INV100'
      });

      const investment = await Investment.create({
        user: user._id,
        principalAmountPaise: 5000000, // ₹50,000.00
        planName: 'Growth Alpha',
        roiPercentage: 1.5,
        status: 'active'
      });

      expect(investment._id).toBeDefined();
      expect(investment.user.toString()).toBe(user._id.toString());
      expect(investment.principalAmountPaise).toBe(5000000);
      expect(investment.planName).toBe('Growth Alpha');
      expect(investment.roiPercentage).toBe(1.5);
      expect(investment.status).toBe('active');
      expect(investment.totalRoiEarnedPaise).toBe(0);
      expect(investment.startDate).toBeDefined();
    });

    test('2.2 Rejects missing required user reference', async () => {
      await expect(
        Investment.create({
          principalAmountPaise: 100000,
          planName: 'Starter',
          roiPercentage: 1.0
        })
      ).rejects.toThrow(/User reference is required/i);
    });

    test('2.3 Rejects non-integer, negative, or invalid monetary/percentage values', async () => {
      const user = await User.create({
        name: 'User',
        email: 'user_inv@example.com',
        password: 'pass',
        referralCode: 'UINV1'
      });

      // Float principal paise
      await expect(
        Investment.create({
          user: user._id,
          principalAmountPaise: 1000.75,
          planName: 'Plan',
          roiPercentage: 2.0
        })
      ).rejects.toThrow(/non-negative integer/i);

      // Negative principal paise
      await expect(
        Investment.create({
          user: user._id,
          principalAmountPaise: -10000,
          planName: 'Plan',
          roiPercentage: 2.0
        })
      ).rejects.toThrow(/non-negative integer/i);

      // Negative ROI percentage
      await expect(
        Investment.create({
          user: user._id,
          principalAmountPaise: 50000,
          planName: 'Plan',
          roiPercentage: -0.5
        })
      ).rejects.toThrow(/ROI percentage must be a non-negative number/i);
    });
  });

  // 3. ROI HISTORY MODEL TESTS
  describe('ROIHistory Model', () => {
    test('3.1 Successfully creates a valid ROIHistory record', async () => {
      const user = await User.create({
        name: 'ROI User',
        email: 'roi_user@example.com',
        password: 'pass',
        referralCode: 'ROI100'
      });

      const investment = await Investment.create({
        user: user._id,
        principalAmountPaise: 1000000,
        planName: 'Daily Plan',
        roiPercentage: 1.0
      });

      const roiRecord = await ROIHistory.create({
        user: user._id,
        investment: investment._id,
        amountPaise: 10000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-11-03T10:30:00Z'),
        status: 'processed',
        transactionKey: `roi_${investment._id}_2026-11-03`
      });

      expect(roiRecord._id).toBeDefined();
      expect(roiRecord.amountPaise).toBe(10000);
      expect(roiRecord.status).toBe('processed');
      // Verify businessDate normalization to UTC midnight
      expect(roiRecord.businessDate.getUTCHours()).toBe(0);
      expect(roiRecord.businessDate.getUTCMinutes()).toBe(0);
    });

    test('3.2 Rejects duplicate daily ROI for same investment on same businessDate', async () => {
      const user = await User.create({
        name: 'ROI Dup User',
        email: 'roidup@example.com',
        password: 'pass',
        referralCode: 'ROIDUP'
      });

      const investment = await Investment.create({
        user: user._id,
        principalAmountPaise: 1000000,
        planName: 'Daily Plan',
        roiPercentage: 1.0
      });

      const businessDate = new Date('2026-11-03T00:00:00Z');

      // First daily ROI record succeeds
      await ROIHistory.create({
        user: user._id,
        investment: investment._id,
        amountPaise: 10000,
        roiPercentageApplied: 1.0,
        businessDate,
        transactionKey: `roi_${investment._id}_2026-11-03_A`
      });

      // Second daily ROI record for same investment and date must be rejected by compound unique index
      await expect(
        ROIHistory.create({
          user: user._id,
          investment: investment._id,
          amountPaise: 10000,
          roiPercentageApplied: 1.0,
          businessDate,
          transactionKey: `roi_${investment._id}_2026-11-03_B`
        })
      ).rejects.toThrow(/duplicate key/i);
    });
  });

  // 4. REFERRAL INCOME MODEL TESTS
  describe('ReferralIncome Model', () => {
    test('4.1 Successfully creates a valid ReferralIncome record', async () => {
      const sponsor = await User.create({
        name: 'Sponsor',
        email: 'sponsor@example.com',
        password: 'pass',
        referralCode: 'SPONSOR'
      });

      const invitee = await User.create({
        name: 'Invitee',
        email: 'invitee@example.com',
        password: 'pass',
        referralCode: 'INVITEE',
        referredBy: sponsor._id
      });

      const investment = await Investment.create({
        user: invitee._id,
        principalAmountPaise: 1000000,
        planName: 'Tier 1 Plan',
        roiPercentage: 1.2
      });

      const refIncome = await ReferralIncome.create({
        beneficiary: sponsor._id,
        sourceUser: invitee._id,
        sourceInvestment: investment._id,
        level: 1,
        percentageApplied: 5.0,
        amountPaise: 50000, // ₹500.00
        status: 'processed',
        transactionKey: `ref_${sponsor._id}_${investment._id}_lvl1`
      });

      expect(refIncome._id).toBeDefined();
      expect(refIncome.level).toBe(1);
      expect(refIncome.percentageApplied).toBe(5.0);
      expect(refIncome.amountPaise).toBe(50000);
    });

    test('4.2 Rejects duplicate referral transactionKey', async () => {
      const u1 = await User.create({
        name: 'U1',
        email: 'u1@example.com',
        password: 'pass',
        referralCode: 'REFU1'
      });
      const u2 = await User.create({
        name: 'U2',
        email: 'u2@example.com',
        password: 'pass',
        referralCode: 'REFU2'
      });
      const inv = await Investment.create({
        user: u2._id,
        principalAmountPaise: 500000,
        planName: 'Plan',
        roiPercentage: 1.0
      });

      const transactionKey = 'unique_referral_key_123';

      await ReferralIncome.create({
        beneficiary: u1._id,
        sourceUser: u2._id,
        sourceInvestment: inv._id,
        level: 1,
        percentageApplied: 5.0,
        amountPaise: 25000,
        transactionKey
      });

      await expect(
        ReferralIncome.create({
          beneficiary: u1._id,
          sourceUser: u2._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 25000,
          transactionKey // duplicate key
        })
      ).rejects.toThrow(/duplicate key/i);
    });

    test('4.3 Rejects invalid level (< 1 or float)', async () => {
      const u1 = await User.create({
        name: 'User A',
        email: 'ua@example.com',
        password: 'pass',
        referralCode: 'REFUA'
      });
      const inv = await Investment.create({
        user: u1._id,
        principalAmountPaise: 100000,
        planName: 'Plan',
        roiPercentage: 1.0
      });

      await expect(
        ReferralIncome.create({
          beneficiary: u1._id,
          sourceUser: u1._id,
          sourceInvestment: inv._id,
          level: 0, // invalid level
          percentageApplied: 2.0,
          amountPaise: 2000,
          transactionKey: 'tx_inv_lvl0'
        })
      ).rejects.toThrow(/Referral level must be a positive integer/i);
    });
  });

  // 5. WALLET TRANSACTION MODEL TESTS
  describe('WalletTransaction Model', () => {
    test('5.1 Successfully creates a valid credit WalletTransaction', async () => {
      const user = await User.create({
        name: 'Wallet User',
        email: 'wallet@example.com',
        password: 'pass',
        referralCode: 'WALL100'
      });

      const tx = await WalletTransaction.create({
        user: user._id,
        type: 'credit',
        amountPaise: 75000, // ₹750.00
        sourceType: 'roi',
        transactionKey: `wallet_credit_${Date.now()}`,
        description: 'Daily ROI distribution'
      });

      expect(tx._id).toBeDefined();
      expect(tx.type).toBe('credit');
      expect(tx.amountPaise).toBe(75000);
      expect(tx.sourceType).toBe('roi');
      expect(tx.description).toBe('Daily ROI distribution');
    });

    test('5.2 Rejects duplicate wallet transactionKey', async () => {
      const user = await User.create({
        name: 'Dup Tx User',
        email: 'duptx@example.com',
        password: 'pass',
        referralCode: 'DUPTX'
      });

      const key = 'tx_idempotent_key_abc';

      await WalletTransaction.create({
        user: user._id,
        type: 'credit',
        amountPaise: 1000,
        sourceType: 'referral',
        transactionKey: key
      });

      await expect(
        WalletTransaction.create({
          user: user._id,
          type: 'credit',
          amountPaise: 1000,
          sourceType: 'referral',
          transactionKey: key // duplicate key
        })
      ).rejects.toThrow(/duplicate key/i);
    });

    test('5.3 Rejects non-positive or float amountPaise in wallet transaction', async () => {
      const user = await User.create({
        name: 'Invalid Amount User',
        email: 'inv_amount@example.com',
        password: 'pass',
        referralCode: 'INVAMT'
      });

      // Zero amount
      await expect(
        WalletTransaction.create({
          user: user._id,
          type: 'credit',
          amountPaise: 0,
          sourceType: 'adjustment',
          transactionKey: 'tx_zero'
        })
      ).rejects.toThrow(/positive integer greater than zero/i);

      // Float amount
      await expect(
        WalletTransaction.create({
          user: user._id,
          type: 'credit',
          amountPaise: 125.5,
          sourceType: 'adjustment',
          transactionKey: 'tx_float'
        })
      ).rejects.toThrow(/positive integer greater than zero/i);
    });
  });
});
