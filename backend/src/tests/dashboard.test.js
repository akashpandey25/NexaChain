const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const ReferralIncome = require('../models/ReferralIncome');
const { generateToken } = require('../utils/jwt');
const { normalizeBusinessDate } = require('../services/roiService');

jest.setTimeout(60000);

describe('Dashboard API & Statistics Integration Tests', () => {
  let mongoServer;
  let userA;
  let userAToken;
  let userB;
  let userBToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Promise.all([
      User.init(),
      Investment.init(),
      ROIHistory.init(),
      ReferralIncome.init()
    ]);
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Investment.deleteMany({}),
      ROIHistory.deleteMany({}),
      ReferralIncome.deleteMany({})
    ]);

    // Create User A
    userA = await User.create({
      name: 'User A',
      email: 'usera@example.com',
      password: 'Password123',
      referralCode: 'USERA100',
      walletBalancePaise: 450000 // ₹4,500.00
    });
    userAToken = generateToken(userA);

    // Create User B
    userB = await User.create({
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123',
      referralCode: 'USERB100',
      walletBalancePaise: 9999999
    });
    userBToken = generateToken(userB);
  });

  test('1. Rejects unauthenticated dashboard request with HTTP 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Authorization header missing');
  });

  test('2. Returns zeroed metrics gracefully for an empty dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalInvestmentPaise).toBe(0);
    expect(res.body.data.summary.activeInvestmentPaise).toBe(0);
    expect(res.body.data.summary.totalRoiPaise).toBe(0);
    expect(res.body.data.summary.walletBalancePaise).toBe(450000);
    expect(res.body.data.summary.totalDirectReferrals).toBe(0);
    expect(res.body.data.summary.activeDirectReferrals).toBe(0);
    expect(res.body.data.summary.processedReferralIncomePaise).toBe(0);

    expect(res.body.data.investments.totalCount).toBe(0);
    expect(res.body.data.investments.activeCount).toBe(0);
    expect(res.body.data.investments.pendingCount).toBe(0);
    expect(res.body.data.investments.completedCount).toBe(0);
    expect(res.body.data.investments.cancelledCount).toBe(0);
    expect(res.body.data.investments.amountByStatus).toHaveLength(4);

    expect(res.body.data.roi.chartData).toHaveLength(0);
    expect(res.body.data.roi.totalProcessedRoiPaise).toBe(0);
  });

  test('3. Accurately calculates investment totals and counts grouped by status', async () => {
    // Populate User A's investments
    await Investment.create([
      {
        user: userA._id,
        principalAmountPaise: 100000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'pending'
      },
      {
        user: userA._id,
        principalAmountPaise: 200000,
        planName: 'Growth Plan',
        roiPercentage: 1.5,
        status: 'active'
      },
      {
        user: userA._id,
        principalAmountPaise: 300000,
        planName: 'Premium Plan',
        roiPercentage: 2.0,
        status: 'active'
      },
      {
        user: userA._id,
        principalAmountPaise: 150000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'completed'
      }
    ]);

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalInvestmentPaise).toBe(750000);
    expect(res.body.data.summary.activeInvestmentPaise).toBe(500000); // 200000 + 300000
    expect(res.body.data.investments.totalCount).toBe(4);
    expect(res.body.data.investments.activeCount).toBe(2);
    expect(res.body.data.investments.pendingCount).toBe(1);
    expect(res.body.data.investments.completedCount).toBe(1);
    expect(res.body.data.investments.cancelledCount).toBe(0);
  });

  test('4. Aggregates processed ROI and strictly excludes pending and failed records', async () => {
    const inv = await Investment.create({
      user: userA._id,
      principalAmountPaise: 500000,
      planName: 'Growth Plan',
      roiPercentage: 1.5,
      status: 'active'
    });

    await ROIHistory.create([
      {
        user: userA._id,
        investment: inv._id,
        amountPaise: 5000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-11-01T00:00:00Z'),
        status: 'processed',
        transactionKey: 'roi_test_1'
      },
      {
        user: userA._id,
        investment: inv._id,
        amountPaise: 7000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-11-02T00:00:00Z'),
        status: 'processed',
        transactionKey: 'roi_test_2'
      },
      {
        user: userA._id,
        investment: inv._id,
        amountPaise: 10000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-11-03T00:00:00Z'),
        status: 'pending', // MUST BE EXCLUDED
        transactionKey: 'roi_test_pending'
      },
      {
        user: userA._id,
        investment: inv._id,
        amountPaise: 8000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-11-04T00:00:00Z'),
        status: 'failed', // MUST BE EXCLUDED
        transactionKey: 'roi_test_failed'
      }
    ]);

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    // 5000 + 7000 = 12000 (pending and failed excluded)
    expect(res.body.data.summary.totalRoiPaise).toBe(12000);
    expect(res.body.data.roi.processedRecordCount).toBe(2);
    expect(res.body.data.roi.chartData).toHaveLength(2);
    expect(res.body.data.roi.chartData[0].amountPaise).toBe(5000);
    expect(res.body.data.roi.chartData[1].amountPaise).toBe(7000);
  });

  test('5. Counts direct referrals accurately and strictly excludes indirect referrals', async () => {
    // User C is directly referred by User A (Active)
    const userC = await User.create({
      name: 'User C',
      email: 'userc@example.com',
      password: 'Password123',
      referralCode: 'USERC100',
      referredBy: userA._id,
      isActive: true
    });

    // User D is directly referred by User A (Inactive)
    await User.create({
      name: 'User D',
      email: 'userd@example.com',
      password: 'Password123',
      referralCode: 'USERD100',
      referredBy: userA._id,
      isActive: false
    });

    // User E is an indirect referral (referred by User C, NOT User A)
    await User.create({
      name: 'User E',
      email: 'usere@example.com',
      password: 'Password123',
      referralCode: 'USERE100',
      referredBy: userC._id,
      isActive: true
    });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalDirectReferrals).toBe(2); // C and D
    expect(res.body.data.summary.activeDirectReferrals).toBe(1); // Only C
    expect(res.body.data.referrals.totalDirectReferrals).toBe(2);
    expect(res.body.data.referrals.activeDirectReferrals).toBe(1);
  });

  test('6. Aggregates processed referral income and excludes pending income', async () => {
    const inv = await Investment.create({
      user: userB._id,
      principalAmountPaise: 1000000,
      planName: 'Starter Plan',
      roiPercentage: 1.0
    });

    await ReferralIncome.create([
      {
        beneficiary: userA._id,
        sourceUser: userB._id,
        sourceInvestment: inv._id,
        level: 1,
        percentageApplied: 5.0,
        amountPaise: 25000,
        status: 'processed',
        transactionKey: 'ref_processed_1'
      },
      {
        beneficiary: userA._id,
        sourceUser: userB._id,
        sourceInvestment: inv._id,
        level: 1,
        percentageApplied: 5.0,
        amountPaise: 50000,
        status: 'pending', // MUST BE EXCLUDED
        transactionKey: 'ref_pending_1'
      }
    ]);

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.processedReferralIncomePaise).toBe(25000);
    expect(res.body.data.referrals.processedReferralIncomePaise).toBe(25000);
  });

  test('7. Enforces strict data isolation: User A cannot see User B statistics', async () => {
    // Populate huge numbers for User B
    const invB = await Investment.create({
      user: userB._id,
      principalAmountPaise: 99000000, // ₹990,000.00
      planName: 'Premium Plan',
      roiPercentage: 2.0,
      status: 'active'
    });

    await ROIHistory.create({
      user: userB._id,
      investment: invB._id,
      amountPaise: 5000000,
      roiPercentageApplied: 2.0,
      businessDate: new Date('2026-11-01T00:00:00Z'),
      status: 'processed',
      transactionKey: 'roi_userb'
    });

    // Request dashboard as User A
    const resA = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.summary.totalInvestmentPaise).toBe(0);
    expect(resA.body.data.summary.activeInvestmentPaise).toBe(0);
    expect(resA.body.data.summary.totalRoiPaise).toBe(0);
    expect(resA.body.data.summary.walletBalancePaise).toBe(450000);

    // Request dashboard as User B
    const resB = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.summary.totalInvestmentPaise).toBe(99000000);
    expect(resB.body.data.summary.activeInvestmentPaise).toBe(99000000);
    expect(resB.body.data.summary.totalRoiPaise).toBe(5000000);
  });

  test('8. Supports date range filtering on ROI history chart series', async () => {
    const inv = await Investment.create({
      user: userA._id,
      principalAmountPaise: 500000,
      planName: 'Growth Plan',
      roiPercentage: 1.5,
      status: 'active'
    });

    await ROIHistory.create([
      {
        user: userA._id,
        investment: inv._id,
        amountPaise: 1000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-10-15T00:00:00Z'),
        status: 'processed',
        transactionKey: 'roi_oct15'
      },
      {
        user: userA._id,
        investment: inv._id,
        amountPaise: 2000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-11-01T00:00:00Z'),
        status: 'processed',
        transactionKey: 'roi_nov01'
      },
      {
        user: userA._id,
        investment: inv._id,
        amountPaise: 3000,
        roiPercentageApplied: 1.0,
        businessDate: new Date('2026-11-15T00:00:00Z'),
        status: 'processed',
        transactionKey: 'roi_nov15'
      }
    ]);

    // Filter range: Nov 1 to Nov 10
    const res = await request(app)
      .get('/api/dashboard?startDate=2026-11-01&endDate=2026-11-10')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.roi.chartData).toHaveLength(1);
    expect(res.body.data.roi.chartData[0].amountPaise).toBe(2000);
  });

  test('9. Rejects invalid date query parameters with HTTP 400', async () => {
    // Malformed date
    const resBadDate = await request(app)
      .get('/api/dashboard?startDate=not-a-valid-date')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resBadDate.status).toBe(400);
    expect(resBadDate.body.success).toBe(false);

    // startDate later than endDate
    const resInverted = await request(app)
      .get('/api/dashboard?startDate=2026-12-01&endDate=2026-11-01')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resInverted.status).toBe(400);
    expect(resInverted.body.success).toBe(false);
    expect(resInverted.body.message).toContain('startDate cannot be later than endDate');
  });

  describe('Daily ROI current-day metrics', () => {
    test('10. Accurately calculates daily ROI for current business date and strictly excludes previous dates, zero states, and non-processed records', async () => {
      const today = normalizeBusinessDate(new Date(), 'Asia/Kolkata');
      const yesterday = normalizeBusinessDate(new Date(Date.now() - 86400000), 'Asia/Kolkata');

      // 1. Zero ROI when no records exist
      const resEmpty = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(resEmpty.status).toBe(200);
      expect(resEmpty.body.data.summary.dailyRoiPaise).toBe(0);
      expect(resEmpty.body.data.roi.dailyRoiPaise).toBe(0);
      expect(resEmpty.body.data.roi.dailyRoiRecordCount).toBe(0);

      const [inv1, inv2, inv3, inv4] = await Promise.all([
        Investment.create({
          user: userA._id,
          principalAmountPaise: 300000,
          planName: 'Growth Plan',
          roiPercentage: 1.5,
          status: 'active'
        }),
        Investment.create({
          user: userA._id,
          principalAmountPaise: 250000,
          planName: 'Growth Plan',
          roiPercentage: 1.5,
          status: 'active'
        }),
        Investment.create({
          user: userA._id,
          principalAmountPaise: 100000,
          planName: 'Starter Plan',
          roiPercentage: 1.0,
          status: 'active'
        }),
        Investment.create({
          user: userA._id,
          principalAmountPaise: 150000,
          planName: 'Starter Plan',
          roiPercentage: 1.0,
          status: 'active'
        })
      ]);

      await ROIHistory.create([
        // 2. Current business date - processed (MUST BE INCLUDED in daily ROI)
        {
          user: userA._id,
          investment: inv1._id,
          amountPaise: 4500,
          roiPercentageApplied: 1.5,
          businessDate: today.normalizedUtcMidnight,
          status: 'processed',
          transactionKey: 'roi_today_processed'
        },
        // 3. Previous business date - processed (MUST BE EXCLUDED from daily ROI)
        {
          user: userA._id,
          investment: inv2._id,
          amountPaise: 3500,
          roiPercentageApplied: 1.5,
          businessDate: yesterday.normalizedUtcMidnight,
          status: 'processed',
          transactionKey: 'roi_yesterday_processed'
        },
        // 4. Current business date - pending (MUST BE EXCLUDED from daily ROI)
        {
          user: userA._id,
          investment: inv3._id,
          amountPaise: 1500,
          roiPercentageApplied: 1.5,
          businessDate: today.normalizedUtcMidnight,
          status: 'pending',
          transactionKey: 'roi_today_pending'
        },
        // 5. Current business date - failed (MUST BE EXCLUDED from daily ROI)
        {
          user: userA._id,
          investment: inv4._id,
          amountPaise: 2000,
          roiPercentageApplied: 1.5,
          businessDate: today.normalizedUtcMidnight,
          status: 'failed',
          transactionKey: 'roi_today_failed'
        }
      ]);

      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      // Daily ROI strictly equals 4500 paise (today's processed record only)
      expect(res.body.data.summary.dailyRoiPaise).toBe(4500);
      expect(res.body.data.roi.dailyRoiPaise).toBe(4500);
      expect(res.body.data.roi.dailyRoiRecordCount).toBe(1);

      // Lifetime total ROI still includes yesterday's processed: 4500 + 3500 = 8000
      expect(res.body.data.summary.totalRoiPaise).toBe(8000);
      expect(res.body.data.roi.totalProcessedRoiPaise).toBe(8000);
      expect(res.body.data.roi.processedRecordCount).toBe(2);
    });
  });
});

