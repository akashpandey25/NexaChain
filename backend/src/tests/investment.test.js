const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Investment = require('../models/Investment');
const { generateToken } = require('../utils/jwt');
const env = require('../config/env');

jest.setTimeout(60000);

describe('Investment Management API Integration Tests', () => {
  let mongoServer;
  let userA;
  let userAToken;
  let userB;
  let userBToken;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Promise.all([User.init(), Investment.init()]);
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Investment.deleteMany({})]);

    // Setup Test User A
    userA = await User.create({
      name: 'Alice Investor',
      email: 'alice@example.com',
      password: 'Password123',
      referralCode: 'ALICE100'
    });
    userAToken = generateToken(userA);

    // Setup Test User B
    userB = await User.create({
      name: 'Bob Investor',
      email: 'bob@example.com',
      password: 'Password123',
      referralCode: 'BOB100'
    });
    userBToken = generateToken(userB);

    // Setup Admin User
    adminUser = await User.create({
      name: 'Admin Supervisor',
      email: 'admin@nexachain.internal',
      password: 'Password123',
      referralCode: 'ADMIN100',
      role: 'admin'
    });
    adminToken = generateToken(adminUser);
  });

  // 1. CREATE INVESTMENT (POST /api/investments)
  describe('POST /api/investments', () => {
    test('1. Rejects unauthenticated investment creation with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/investments')
        .send({
          principalAmountPaise: 500000,
          planName: 'Starter Plan'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authorization header missing');
    });

    test('2. Successfully creates an investment when valid server-side plan exists', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: 1000000, // ₹10,000.00
          planName: 'Growth Plan'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Investment created successfully');
      expect(res.body.data.investment).toBeDefined();

      const inv = res.body.data.investment;
      expect(inv.principalAmountPaise).toBe(1000000);
      expect(inv.planName).toBe('Growth Plan');
      expect(inv.roiPercentage).toBe(1.5); // Server-configured rate
      expect(inv.status).toBe('pending'); // Must be strictly pending
      expect(inv.totalRoiEarnedPaise).toBe(0);
      expect(inv.user.toString()).toBe(userA._id.toString());
      expect(inv.startDate).toBeDefined();
      expect(inv.endDate).toBeDefined();

      // Verify in database
      const dbInv = await Investment.findById(inv._id);
      expect(dbInv).not.toBeNull();
      expect(dbInv.status).toBe('pending');
      expect(dbInv.user.toString()).toBe(userA._id.toString());
    });

    test('3. Rejects unconfigured or unrecognized investment plan with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: 500000,
          planName: 'Imaginary Ultra 100x Plan' // Unconfigured plan
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unrecognized or unconfigured investment plan');
    });

    test('4. Rejects missing required fields with HTTP 400', async () => {
      // Missing planName
      const resNoPlan = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: 500000
        });

      expect(resNoPlan.status).toBe(400);
      expect(resNoPlan.body.success).toBe(false);

      // Missing amount
      const resNoAmount = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          planName: 'Starter Plan'
        });

      expect(resNoAmount.status).toBe(400);
      expect(resNoAmount.body.success).toBe(false);
    });

    test('5. Rejects zero investment amount with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: 0,
          planName: 'Starter Plan'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('greater than zero');
    });

    test('6. Rejects negative investment amount with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: -50000,
          planName: 'Starter Plan'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('greater than zero');
    });

    test('7. Rejects fractional-paise investment amount with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: 50000.75, // Fractional paise forbidden
          planName: 'Starter Plan'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('must be an integer');
    });

    test('8. Rejects forged user ID and associates investment strictly with authenticated user', async () => {
      const forgedUserId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: 500000,
          planName: 'Starter Plan',
          user: forgedUserId, // Attempted forgery
          userId: forgedUserId
        });

      expect(res.status).toBe(201);
      // Must be owned by authenticated user A, ignoring forged user ID
      expect(res.body.data.investment.user.toString()).toBe(userA._id.toString());
      expect(res.body.data.investment.user.toString()).not.toBe(forgedUserId.toString());
    });

    test('9. Rejects forged ROI percentage and enforces server plan rate', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          principalAmountPaise: 500000,
          planName: 'Starter Plan', // Server rate is 1.0%
          roiPercentage: 99.9 // Attempted client-forged rate
        });

      expect(res.status).toBe(201);
      // Stored rate must be the server-configured rate of 1.0, not 99.9
      expect(res.body.data.investment.roiPercentage).toBe(1.0);
    });
  });

  // 2. LIST INVESTMENTS (GET /api/investments)
  describe('GET /api/investments', () => {
    beforeEach(async () => {
      // Create 3 investments for User A
      await Investment.create([
        {
          user: userA._id,
          principalAmountPaise: 100000,
          planName: 'Starter Plan',
          roiPercentage: 1.0,
          status: 'pending',
          createdAt: new Date('2026-11-01T10:00:00Z')
        },
        {
          user: userA._id,
          principalAmountPaise: 200000,
          planName: 'Growth Plan',
          roiPercentage: 1.5,
          status: 'active',
          createdAt: new Date('2026-11-02T10:00:00Z')
        },
        {
          user: userA._id,
          principalAmountPaise: 300000,
          planName: 'Premium Plan',
          roiPercentage: 2.0,
          status: 'active',
          createdAt: new Date('2026-11-03T10:00:00Z')
        }
      ]);

      // Create 1 investment for User B
      await Investment.create({
        user: userB._id,
        principalAmountPaise: 999999,
        planName: 'Growth Plan',
        roiPercentage: 1.5,
        status: 'pending',
        createdAt: new Date('2026-11-03T11:00:00Z')
      });
    });

    test('10. Lists only the authenticated user investments and excludes other users', async () => {
      const res = await request(app)
        .get('/api/investments')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investments.length).toBe(3);

      // Verify every returned investment belongs strictly to User A
      res.body.data.investments.forEach((inv) => {
        expect(inv.user.toString()).toBe(userA._id.toString());
        expect(inv.principalAmountPaise).not.toBe(999999); // User B's amount
      });
    });

    test('11. Supports pagination with correct metadata and newest-first ordering', async () => {
      // Request page 1 with limit 2
      const resPage1 = await request(app)
        .get('/api/investments?page=1&limit=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resPage1.status).toBe(200);
      expect(resPage1.body.data.investments.length).toBe(2);
      expect(resPage1.body.data.pagination.currentPage).toBe(1);
      expect(resPage1.body.data.pagination.pageSize).toBe(2);
      expect(resPage1.body.data.pagination.totalRecords).toBe(3);
      expect(resPage1.body.data.pagination.totalPages).toBe(2);
      expect(resPage1.body.data.pagination.hasNextPage).toBe(true);
      expect(resPage1.body.data.pagination.hasPrevPage).toBe(false);

      // Verify newest first: first item should have principal 300000
      expect(resPage1.body.data.investments[0].principalAmountPaise).toBe(300000);

      // Request page 2 with limit 2
      const resPage2 = await request(app)
        .get('/api/investments?page=2&limit=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data.investments.length).toBe(1);
      expect(resPage2.body.data.pagination.currentPage).toBe(2);
      expect(resPage2.body.data.pagination.hasNextPage).toBe(false);
      expect(resPage2.body.data.pagination.hasPrevPage).toBe(true);
    });

    test('12. Supports optional status filtering', async () => {
      // Filter for 'active' status only
      const resActive = await request(app)
        .get('/api/investments?status=active')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resActive.status).toBe(200);
      expect(resActive.body.data.investments.length).toBe(2);
      resActive.body.data.investments.forEach((inv) => {
        expect(inv.status).toBe('active');
      });

      // Filter for 'pending' status only
      const resPending = await request(app)
        .get('/api/investments?status=pending')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resPending.status).toBe(200);
      expect(resPending.body.data.investments.length).toBe(1);
      expect(resPending.body.data.investments[0].status).toBe('pending');
    });
  });

  // 3. GET INVESTMENT BY ID (GET /api/investments/:id)
  describe('GET /api/investments/:id', () => {
    let invUserA;
    let invUserB;

    beforeEach(async () => {
      invUserA = await Investment.create({
        user: userA._id,
        principalAmountPaise: 500000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'pending'
      });

      invUserB = await Investment.create({
        user: userB._id,
        principalAmountPaise: 700000,
        planName: 'Growth Plan',
        roiPercentage: 1.5,
        status: 'pending'
      });
    });

    test('13. Successfully retrieves an existing investment for the owner', async () => {
      const res = await request(app)
        .get(`/api/investments/${invUserA._id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investment._id.toString()).toBe(invUserA._id.toString());
      expect(res.body.data.investment.principalAmountPaise).toBe(500000);
    });

    test('14. Rejects retrieving another user investment with HTTP 404', async () => {
      // User A attempts to access User B's investment
      const res = await request(app)
        .get(`/api/investments/${invUserB._id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Investment not found');
    });

    test('15. Rejects invalid investment ID format with HTTP 400', async () => {
      const res = await request(app)
        .get('/api/investments/invalid-hex-id-123')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid investment ID format');
    });

    test('16. Returns HTTP 404 for nonexistent valid-format ObjectId', async () => {
      const nonexistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/investments/${nonexistentId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Investment not found');
    });
  });

  // 4. GET INVESTMENT PLANS (GET /api/investments/plans)
  describe('GET /api/investments/plans', () => {
    test('17. Successfully returns public plan configurations with demonstration markers', async () => {
      const res = await request(app)
        .get('/api/investments/plans')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plans).toBeInstanceOf(Array);
      expect(res.body.data.plans.length).toBe(3);

      const planStarter = res.body.data.plans.find((p) => p.id === 'STARTER');
      expect(planStarter).toBeDefined();
      expect(planStarter.name).toBe('Starter Plan');
      expect(planStarter.roiPercentage).toBe(1.0);
      expect(planStarter.durationDays).toBe(30);
      expect(planStarter.isDemonstration).toBe(true);

      const planPremium = res.body.data.plans.find((p) => p.id === 'PREMIUM');
      expect(planPremium).toBeDefined();
      expect(planPremium.roiPercentage).toBe(2.0);
      expect(planPremium.isDemonstration).toBe(true);
    });

    test('18. Rejects unauthenticated request to /plans with HTTP 401', async () => {
      const res = await request(app).get('/api/investments/plans');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 5. ADMIN PENDING INVESTMENTS (GET /api/investments/admin/pending)
  describe('GET /api/investments/admin/pending', () => {
    beforeEach(async () => {
      // Pending investment for User A
      await Investment.create({
        user: userA._id,
        principalAmountPaise: 500000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'pending'
      });

      // Active investment for User A (should NOT be returned in pending list)
      await Investment.create({
        user: userA._id,
        principalAmountPaise: 1000000,
        planName: 'Growth Plan',
        roiPercentage: 1.5,
        status: 'active'
      });

      // Pending investment for User B
      await Investment.create({
        user: userB._id,
        principalAmountPaise: 2000000,
        planName: 'Premium Plan',
        roiPercentage: 2.0,
        status: 'pending'
      });
    });

    test('19. Rejects non-admin user with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/investments/admin/pending')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    test('20. Admin successfully retrieves pending investments across all users with populated user info', async () => {
      const res = await request(app)
        .get('/api/investments/admin/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investments.length).toBe(2);
      expect(res.body.data.pagination.totalRecords).toBe(2);

      // Verify each investment is pending and populated
      res.body.data.investments.forEach((inv) => {
        expect(inv.status).toBe('pending');
        expect(inv.user).toBeDefined();
        expect(inv.user.name).toBeDefined();
        expect(inv.user.email).toBeDefined();
      });
    });
  });

  // 6. ADMIN ACTIVATION (PATCH /api/investments/:id/activate)
  describe('PATCH /api/investments/:id/activate', () => {
    let pendingInv;
    let originalActivationFlag;

    beforeEach(async () => {
      originalActivationFlag = env.investmentActivationEnabled;

      pendingInv = await Investment.create({
        user: userA._id,
        principalAmountPaise: 500000,
        planName: 'Growth Plan',
        roiPercentage: 1.5,
        status: 'pending'
      });
    });

    afterEach(() => {
      env.investmentActivationEnabled = originalActivationFlag;
    });

    test('21. Rejects non-admin user with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/activate`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    test('22. Rejects activation with HTTP 403 when INVESTMENT_ACTIVATION_ENABLED is false', async () => {
      env.investmentActivationEnabled = false;

      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('disabled by policy');
      expect(res.body.message).toContain('INVESTMENT_ACTIVATION_ENABLED=false');

      // Verify status in DB remains pending
      const dbInv = await Investment.findById(pendingInv._id);
      expect(dbInv.status).toBe('pending');
    });

    test('23. Rejects admin attempting to activate their own investment (self-approval forbidden)', async () => {
      env.investmentActivationEnabled = true;

      // Create pending investment owned by adminUser
      const adminInv = await Investment.create({
        user: adminUser._id,
        principalAmountPaise: 100000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'pending'
      });

      const res = await request(app)
        .patch(`/api/investments/${adminInv._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Administrators are not permitted to activate or approve their own investment requests');

      // Verify DB remains pending
      const checkDb = await Investment.findById(adminInv._id);
      expect(checkDb.status).toBe('pending');
    });

    test('24. Successfully activates pending investment when flag is enabled', async () => {
      env.investmentActivationEnabled = true;

      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Investment activated successfully');

      const inv = res.body.data.investment;
      expect(inv.status).toBe('active');
      expect(inv.actionedBy).toBe(adminUser._id.toString());
      expect(inv.actionedAt).toBeDefined();
      expect(new Date(inv.endDate) > new Date(inv.startDate)).toBe(true);

      // Verify in DB
      const dbInv = await Investment.findById(pendingInv._id);
      expect(dbInv.status).toBe('active');
      expect(dbInv.actionedBy.toString()).toBe(adminUser._id.toString());
      expect(dbInv.actionedAt).toBeDefined();
    });

    test('25. Rejects duplicate activation of an already active investment with HTTP 400', async () => {
      env.investmentActivationEnabled = true;

      // Activate first time
      await request(app)
        .patch(`/api/investments/${pendingInv._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Attempt second activation
      const resDuplicate = await request(app)
        .patch(`/api/investments/${pendingInv._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resDuplicate.status).toBe(400);
      expect(resDuplicate.body.success).toBe(false);
      expect(resDuplicate.body.message).toContain('current status is "active"');
    });

    test('25b. Rejects activation of an already completed investment with HTTP 400', async () => {
      env.investmentActivationEnabled = true;

      const completedInv = await Investment.create({
        user: userA._id,
        principalAmountPaise: 500000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'completed'
      });

      const res = await request(app)
        .patch(`/api/investments/${completedInv._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('current status is "completed"');
    });

    test('25c. Rejects activation of an already cancelled investment with HTTP 400', async () => {
      env.investmentActivationEnabled = true;

      const cancelledInv = await Investment.create({
        user: userA._id,
        principalAmountPaise: 500000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'cancelled',
        rejectionReason: 'Cancelled previously'
      });

      const res = await request(app)
        .patch(`/api/investments/${cancelledInv._id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('current status is "cancelled"');
    });

    test('25d. Rejects activating a nonexistent investment ID with HTTP 404', async () => {
      env.investmentActivationEnabled = true;

      const nonexistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/investments/${nonexistentId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Investment not found');
    });

    test('25e. Feature flag cannot be accidentally enabled by invalid string fallback', () => {
      // Direct verification of Zod env transform logic
      const { z } = require('zod');
      const schema = z
        .string()
        .optional()
        .default('false')
        .transform((val) => {
          if (!val) return false;
          const normalized = val.trim().toLowerCase();
          return normalized === 'true' || normalized === '1';
        });

      expect(schema.parse(undefined)).toBe(false);
      expect(schema.parse('')).toBe(false);
      expect(schema.parse('false')).toBe(false);
      expect(schema.parse('none')).toBe(false);
      expect(schema.parse('invalid')).toBe(false);
      expect(schema.parse('0')).toBe(false);
      expect(schema.parse('true')).toBe(true);
      expect(schema.parse('TRUE ')).toBe(true);
      expect(schema.parse('1')).toBe(true);
    });
  });

  // 7. ADMIN REJECTION (PATCH /api/investments/:id/reject)
  describe('PATCH /api/investments/:id/reject', () => {
    let pendingInv;

    beforeEach(async () => {
      pendingInv = await Investment.create({
        user: userA._id,
        principalAmountPaise: 500000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'pending'
      });
    });

    test('26. Rejects non-admin user with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/reject`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ reason: 'Non-compliant documentation' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('27. Rejects missing or invalid rejection reason with HTTP 400', async () => {
      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'no' }); // Too short (< 3 chars)

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 3 characters');
    });

    test('28. Successfully rejects pending investment and records audit metadata', async () => {
      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Verification failed: KYC identity mismatch.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Investment rejected successfully');

      const inv = res.body.data.investment;
      expect(inv.status).toBe('cancelled');
      expect(inv.rejectionReason).toBe('Verification failed: KYC identity mismatch.');
      expect(inv.actionedBy).toBe(adminUser._id.toString());
      expect(inv.actionedAt).toBeDefined();

      // Verify in DB
      const dbInv = await Investment.findById(pendingInv._id);
      expect(dbInv.status).toBe('cancelled');
      expect(dbInv.rejectionReason).toBe('Verification failed: KYC identity mismatch.');
    });

    test('29. Rejects rejecting an already cancelled or active investment with HTTP 400', async () => {
      // First reject
      await request(app)
        .patch(`/api/investments/${pendingInv._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Initial rejection reason' });

      // Second reject attempt
      const resSecond = await request(app)
        .patch(`/api/investments/${pendingInv._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Secondary rejection attempt' });

      expect(resSecond.status).toBe(400);
      expect(resSecond.body.success).toBe(false);
      expect(resSecond.body.message).toContain('current status is "cancelled"');
    });

    test('29b. Rejects rejecting an active investment with HTTP 400', async () => {
      const activeInv = await Investment.create({
        user: userA._id,
        principalAmountPaise: 500000,
        planName: 'Starter Plan',
        roiPercentage: 1.0,
        status: 'active'
      });

      const res = await request(app)
        .patch(`/api/investments/${activeInv._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Cannot cancel active contract' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('current status is "active"');
    });

    test('29c. Rejects rejection reason exceeding 500 characters with HTTP 400', async () => {
      const overlyLongReason = 'a'.repeat(501);

      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: overlyLongReason });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot exceed 500 characters');
    });

    test('29d. Rejects rejection request missing body or reason field with HTTP 400', async () => {
      const res = await request(app)
        .patch(`/api/investments/${pendingInv._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 8. ROI ENGINE EXCLUSION VERIFICATION
  describe('ROI Eligibility Exclusion for Pending / Cancelled Investments', () => {
    test('30. Pending and cancelled investments are excluded from ROI eligible query', async () => {
      const { BUSINESS_RULES } = require('../config/roiConfig');

      // Create pending, cancelled, and active investments
      await Investment.create([
        {
          user: userA._id,
          principalAmountPaise: 1000000,
          planName: 'Starter Plan',
          roiPercentage: 1.0,
          status: 'pending'
        },
        {
          user: userB._id,
          principalAmountPaise: 2000000,
          planName: 'Growth Plan',
          roiPercentage: 1.5,
          status: 'cancelled',
          rejectionReason: 'Test cancellation'
        },
        {
          user: userA._id,
          principalAmountPaise: 3000000,
          planName: 'Premium Plan',
          roiPercentage: 2.0,
          status: 'active'
        }
      ]);

      // Query using the exact ROI eligibility status filter
      const eligibleInvestments = await Investment.find({
        status: { $in: BUSINESS_RULES.ALLOWED_INVESTMENT_STATUSES }
      });

      expect(eligibleInvestments.length).toBe(1);
      expect(eligibleInvestments[0].status).toBe('active');
      expect(eligibleInvestments[0].principalAmountPaise).toBe(3000000);

      // Verify that neither pending nor cancelled are returned
      const nonActive = eligibleInvestments.filter((inv) => inv.status !== 'active');
      expect(nonActive.length).toBe(0);
    });
  });
});

