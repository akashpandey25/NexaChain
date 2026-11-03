const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Investment = require('../models/Investment');
const { generateToken } = require('../utils/jwt');

jest.setTimeout(60000);

describe('Investment Management API Integration Tests', () => {
  let mongoServer;
  let userA;
  let userAToken;
  let userB;
  let userBToken;

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
});

