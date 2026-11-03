const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const { generateToken } = require('../utils/jwt');

jest.setTimeout(60000);

describe('Referral APIs & Referral Tree Integration Tests', () => {
  let mongoServer;
  let rootUser;
  let rootToken;
  let userB;
  let userBToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Promise.all([
      User.init(),
      Investment.init(),
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
      ReferralIncome.deleteMany({})
    ]);

    // Setup Root User
    rootUser = await User.create({
      name: 'Root Sponsor',
      email: 'root@example.com',
      password: 'Password123',
      referralCode: 'ROOT100'
    });
    rootToken = generateToken(rootUser);

    // Setup Independent User B
    userB = await User.create({
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123',
      referralCode: 'USERB100'
    });
    userBToken = generateToken(userB);
  });

  // 1. DIRECT REFERRALS (GET /api/referrals/direct)
  describe('GET /api/referrals/direct', () => {
    test('1. Rejects unauthenticated request with HTTP 401', async () => {
      const res = await request(app).get('/api/referrals/direct');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authorization header missing');
    });

    test('2. Returns empty referral list gracefully for user with no referrals', async () => {
      const res = await request(app)
        .get('/api/referrals/direct')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referrals).toHaveLength(0);
      expect(res.body.data.pagination.totalRecords).toBe(0);
      expect(res.body.data.pagination.totalPages).toBe(1);
    });

    test('3. Returns direct referrals, excludes indirect referrals, and omits sensitive fields', async () => {
      // Direct referral 1
      const child1 = await User.create({
        name: 'Direct Child 1',
        email: 'child1@example.com',
        password: 'SecretPassword1',
        referralCode: 'CHILD101',
        referredBy: rootUser._id,
        walletBalancePaise: 500000
      });

      // Direct referral 2
      await User.create({
        name: 'Direct Child 2',
        email: 'child2@example.com',
        password: 'SecretPassword2',
        referralCode: 'CHILD102',
        referredBy: rootUser._id,
        walletBalancePaise: 250000
      });

      // Indirect referral (referred by child1, NOT rootUser)
      await User.create({
        name: 'Grandchild (Indirect)',
        email: 'grandchild@example.com',
        password: 'SecretPassword3',
        referralCode: 'GRAND103',
        referredBy: child1._id
      });

      const res = await request(app)
        .get('/api/referrals/direct')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.referrals).toHaveLength(2); // Only direct referrals
      expect(res.body.data.pagination.totalRecords).toBe(2);

      // Verify safe fields only (no password, no walletBalance)
      res.body.data.referrals.forEach((ref) => {
        expect(ref.id).toBeDefined();
        expect(ref.name).toBeDefined();
        expect(ref.referralCode).toBeDefined();
        expect(ref.isActive).toBe(true);
        expect(ref.createdAt).toBeDefined();
        expect(ref.password).toBeUndefined();
        expect(ref.walletBalancePaise).toBeUndefined();
        expect(ref.email).toBeUndefined();
      });
    });

    test('4. Supports pagination for direct referrals list', async () => {
      for (let i = 1; i <= 3; i++) {
        await User.create({
          name: `Direct Referral ${i}`,
          email: `dir${i}@example.com`,
          password: 'Password123',
          referralCode: `DIR10${i}`,
          referredBy: rootUser._id
        });
      }

      const res = await request(app)
        .get('/api/referrals/direct?page=1&limit=2')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.referrals).toHaveLength(2);
      expect(res.body.data.pagination.totalRecords).toBe(3);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.hasNextPage).toBe(true);
    });
  });

  // 2. REFERRAL TREE (GET /api/referrals/tree)
  describe('GET /api/referrals/tree', () => {
    test('5. Returns valid empty tree for user with no downline', async () => {
      const res = await request(app)
        .get('/api/referrals/tree')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tree.userId).toBe(rootUser._id.toString());
      expect(res.body.data.tree.level).toBe(0);
      expect(res.body.data.tree.children).toHaveLength(0);
      expect(res.body.data.metadata.totalMembers).toBe(0);
      expect(res.body.data.metadata.hasMoreLevels).toBe(false);
    });

    test('6. Accurately constructs multi-level referral tree with correct parent-child hierarchy and depth values', async () => {
      // Level 1: Child A and Child B
      const childA = await User.create({
        name: 'Child A',
        email: 'childa@example.com',
        password: 'Password123',
        referralCode: 'CHILDA',
        referredBy: rootUser._id
      });

      const childB = await User.create({
        name: 'Child B',
        email: 'childb@example.com',
        password: 'Password123',
        referralCode: 'CHILDB',
        referredBy: rootUser._id
      });

      // Level 2: Grandchild under Child A
      const grandChild = await User.create({
        name: 'Grandchild A1',
        email: 'grandchilda1@example.com',
        password: 'Password123',
        referralCode: 'GRANDA1',
        referredBy: childA._id
      });

      // Level 3: Great-Grandchild under Grandchild A1
      await User.create({
        name: 'Great-Grandchild A1-1',
        email: 'greatgrand@example.com',
        password: 'Password123',
        referralCode: 'GREATG1',
        referredBy: grandChild._id
      });

      const res = await request(app)
        .get('/api/referrals/tree')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      const tree = res.body.data.tree;
      expect(tree.level).toBe(0);
      expect(tree.children).toHaveLength(2); // Child A and Child B

      // Verify Level 1 children
      const nodeA = tree.children.find((c) => c.userId === childA._id.toString());
      const nodeB = tree.children.find((c) => c.userId === childB._id.toString());
      expect(nodeA).toBeDefined();
      expect(nodeB).toBeDefined();
      expect(nodeA.level).toBe(1);
      expect(nodeB.level).toBe(1);

      // Verify Level 2 under Node A
      expect(nodeA.children).toHaveLength(1);
      const nodeGrand = nodeA.children[0];
      expect(nodeGrand.userId === grandChild._id.toString()).toBe(true);
      expect(nodeGrand.level).toBe(2);

      // Verify Level 3 under Grandchild
      expect(nodeGrand.children).toHaveLength(1);
      expect(nodeGrand.children[0].level).toBe(3);

      expect(res.body.data.metadata.totalMembers).toBe(4);
      expect(res.body.data.metadata.traversalDepth).toBe(3);
    });

    test('7. Enforces maximum traversal depth and alerts consumer with hasMoreLevels', async () => {
      // Build a 4-level deep chain: Root -> L1 -> L2 -> L3 -> L4
      const l1 = await User.create({
        name: 'L1',
        email: 'l1@example.com',
        password: 'Password123',
        referralCode: 'REFL1',
        referredBy: rootUser._id
      });

      const l2 = await User.create({
        name: 'L2',
        email: 'l2@example.com',
        password: 'Password123',
        referralCode: 'REFL2',
        referredBy: l1._id
      });

      const l3 = await User.create({
        name: 'L3',
        email: 'l3@example.com',
        password: 'Password123',
        referralCode: 'REFL3',
        referredBy: l2._id
      });

      await User.create({
        name: 'L4',
        email: 'l4@example.com',
        password: 'Password123',
        referralCode: 'REFL4',
        referredBy: l3._id
      });

      // Query with safety limit maxDepth = 2
      const res = await request(app)
        .get('/api/referrals/tree?maxDepth=2')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metadata.maxTraversalDepth).toBe(2);
      expect(res.body.data.metadata.traversalDepth).toBe(2);
      expect(res.body.data.metadata.hasMoreLevels).toBe(true); // Deeper levels exist!

      // Level 2 should not have Level 3 children populated due to maxDepth limit
      const nodeL1 = res.body.data.tree.children[0];
      const nodeL2 = nodeL1.children[0];
      expect(nodeL2.children).toHaveLength(0);
    });

    test('8. Cycle protection prevents infinite loops on corrupt or cyclic relationships', async () => {
      const userCycle = await User.create({
        name: 'Cycle User',
        email: 'cycle@example.com',
        password: 'Password123',
        referralCode: 'CYCLE1',
        referredBy: rootUser._id
      });

      // Artificially inject cyclic reference using raw update (bypassing model hook)
      await User.collection.updateOne(
        { _id: rootUser._id },
        { $set: { referredBy: userCycle._id } }
      );

      const res = await request(app)
        .get('/api/referrals/tree')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Traversal must complete safely without hanging or throwing maximum call stack size exceeded
      expect(res.body.data.metadata.totalMembers).toBe(1);
    });

    test('9. Isolates trees between different users completely', async () => {
      // User B has a referral
      await User.create({
        name: 'User B Referral',
        email: 'userb_ref@example.com',
        password: 'Password123',
        referralCode: 'BREF1',
        referredBy: userB._id
      });

      const res = await request(app)
        .get('/api/referrals/tree')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      // User B's referral must not appear in Root User's tree
      expect(res.body.data.tree.children).toHaveLength(0);
      expect(res.body.data.metadata.totalMembers).toBe(0);
    });
  });

  // 3. REFERRAL INCOME (GET /api/referrals/income)
  describe('GET /api/referrals/income', () => {
    let sourceUser;
    let inv;

    beforeEach(async () => {
      sourceUser = await User.create({
        name: 'Source Downline',
        email: 'source@example.com',
        password: 'Password123',
        referralCode: 'SOURCE1',
        referredBy: rootUser._id
      });

      inv = await Investment.create({
        user: sourceUser._id,
        principalAmountPaise: 1000000,
        planName: 'Growth Plan',
        roiPercentage: 1.5
      });
    });

    test('10. Returns empty income history and zeroed summaries for user with no earnings', async () => {
      const res = await request(app)
        .get('/api/referrals/income')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incomeRecords).toHaveLength(0);
      expect(res.body.data.summary.totalIncomePaise).toBe(0);
      expect(res.body.data.summary.processedIncomePaise).toBe(0);
      expect(res.body.data.summary.pendingIncomePaise).toBe(0);
      expect(res.body.data.summary.failedIncomePaise).toBe(0);
      expect(res.body.data.pagination.totalRecords).toBe(0);
    });

    test('11. Accurately segregates processed, pending, and failed income totals', async () => {
      await ReferralIncome.create([
        {
          beneficiary: rootUser._id,
          sourceUser: sourceUser._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 50000, // ₹500.00
          status: 'processed',
          transactionKey: 'ref_tx_processed'
        },
        {
          beneficiary: rootUser._id,
          sourceUser: sourceUser._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 30000,
          status: 'pending',
          transactionKey: 'ref_tx_pending'
        },
        {
          beneficiary: rootUser._id,
          sourceUser: sourceUser._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 20000,
          status: 'failed',
          transactionKey: 'ref_tx_failed'
        }
      ]);

      const res = await request(app)
        .get('/api/referrals/income')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incomeRecords).toHaveLength(3);
      expect(res.body.data.summary.processedIncomePaise).toBe(50000);
      expect(res.body.data.summary.pendingIncomePaise).toBe(30000);
      expect(res.body.data.summary.failedIncomePaise).toBe(20000);
      expect(res.body.data.summary.totalIncomePaise).toBe(100000);

      // Verify safe source user details
      const rec = res.body.data.incomeRecords[0];
      expect(rec.sourceUser).toBeDefined();
      expect(rec.sourceUser.name).toBe('Source Downline');
      expect(rec.sourceUser.email).toBe('source@example.com');
      expect(rec.sourceUser.referralCode).toBe('SOURCE1');
      expect(rec.sourceUser.password).toBeUndefined();
    });

    test('12. Supports status filtering for referral income', async () => {
      await ReferralIncome.create([
        {
          beneficiary: rootUser._id,
          sourceUser: sourceUser._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 50000,
          status: 'processed',
          transactionKey: 'tx_p1'
        },
        {
          beneficiary: rootUser._id,
          sourceUser: sourceUser._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 30000,
          status: 'pending',
          transactionKey: 'tx_p2'
        }
      ]);

      const res = await request(app)
        .get('/api/referrals/income?status=processed')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incomeRecords).toHaveLength(1);
      expect(res.body.data.incomeRecords[0].status).toBe('processed');
    });

    test('13. Enforces data isolation: User A cannot access User B referral income', async () => {
      // Create income belonging to User B
      await ReferralIncome.create({
        beneficiary: userB._id,
        sourceUser: sourceUser._id,
        sourceInvestment: inv._id,
        level: 1,
        percentageApplied: 5.0,
        amountPaise: 999000,
        status: 'processed',
        transactionKey: 'tx_userb_inc'
      });

      const res = await request(app)
        .get('/api/referrals/income')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incomeRecords).toHaveLength(0);
      expect(res.body.data.summary.totalIncomePaise).toBe(0);
    });

    test('14. Supports date range filtering on referral income', async () => {
      await ReferralIncome.create([
        {
          beneficiary: rootUser._id,
          sourceUser: sourceUser._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 10000,
          status: 'processed',
          transactionKey: 'tx_oct',
          createdAt: new Date('2026-10-15T00:00:00Z')
        },
        {
          beneficiary: rootUser._id,
          sourceUser: sourceUser._id,
          sourceInvestment: inv._id,
          level: 1,
          percentageApplied: 5.0,
          amountPaise: 20000,
          status: 'processed',
          transactionKey: 'tx_nov',
          createdAt: new Date('2026-11-02T00:00:00Z')
        }
      ]);

      const res = await request(app)
        .get('/api/referrals/income?startDate=2026-11-01&endDate=2026-11-10')
        .set('Authorization', `Bearer ${rootToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.incomeRecords).toHaveLength(1);
      expect(res.body.data.incomeRecords[0].amountPaise).toBe(20000);
    });
  });
});

