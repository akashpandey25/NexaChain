const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { migrateMobileNumbers } = require('../../scripts/migrateMobileNumber');

jest.setTimeout(60000);

describe('Authentication & Authorization Integration Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await User.init();
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 60000);

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // 1. REGISTRATION TESTS
  describe('POST /api/auth/register', () => {
    test('1. Successful registration returns 201 with safe user and JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          mobileNumber: '+919876543210',
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('registered successfully');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.name).toBe('Jane Doe');
      expect(res.body.data.user.email).toBe('jane.doe@example.com');
      expect(res.body.data.user.mobileNumber).toBe('+919876543210');
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.walletBalancePaise).toBe(0);
      expect(res.body.data.user.referralCode).toMatch(/^NEXA/);
      expect(res.body.data.user.password).toBeUndefined();

      // Verify in database that password was hashed
      const dbUser = await User.findOne({ email: 'jane.doe@example.com' }).select('+password');
      expect(dbUser.password).not.toBe('Password123');
      expect(dbUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    test('1b. Registers a new user with optional mobileNumber', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mobile User',
          email: 'mobile.user@example.com',
          mobileNumber: '+919876543210',
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.mobileNumber).toBe('+919876543210');
      expect(res.body.data.user.totalRoiEarnedPaise).toBe(0);
      expect(res.body.data.user.totalLevelIncomeEarnedPaise).toBe(0);

      const dbUser = await User.findOne({ email: 'mobile.user@example.com' });
      expect(dbUser.mobileNumber).toBe('+919876543210');
      expect(dbUser.totalRoiEarnedPaise).toBe(0);
      expect(dbUser.totalLevelIncomeEarnedPaise).toBe(0);
    });

    test('2. Rejects duplicate email registration with HTTP 409', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing User',
          email: 'duplicate@example.com',
          mobileNumber: '+919876500001',
          password: 'Password123'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
          mobileNumber: '+919876500002',
          password: 'Password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    test('3. Rejects invalid email format with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email',
          email: 'invalid-email-format',
          mobileNumber: '+919876543210',
          password: 'Password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].field).toBe('email');
    });

    test('4. Rejects weak password with HTTP 400', async () => {
      // Too short (< 8 chars)
      const resShort = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@example.com',
          mobileNumber: '+919876500003',
          password: 'Pass1'
        });

      expect(resShort.status).toBe(400);
      expect(resShort.body.success).toBe(false);

      // Missing digits (no complexity)
      const resNoDigits = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'No Digits',
          email: 'nodigits@example.com',
          mobileNumber: '+919876500004',
          password: 'OnlyLettersPass'
        });

      expect(resNoDigits.status).toBe(400);
      expect(resNoDigits.body.success).toBe(false);
    });

    test('5. Registers successfully with a valid referral code and links referredBy', async () => {
      // Step A: Register the sponsor
      const sponsorRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sponsor User',
          email: 'sponsor@example.com',
          mobileNumber: '+919876500005',
          password: 'Password123'
        });

      const sponsorRefCode = sponsorRes.body.data.user.referralCode;
      const sponsorId = sponsorRes.body.data.user.id;

      // Step B: Register invitee using sponsor's referralCode
      const inviteeRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invited User',
          email: 'invited@example.com',
          mobileNumber: '+919876500006',
          password: 'Password123',
          referralCode: sponsorRefCode
        });

      expect(inviteeRes.status).toBe(201);
      expect(inviteeRes.body.success).toBe(true);
      expect(inviteeRes.body.data.user.referredBy.toString()).toBe(sponsorId.toString());
    });

    test('6. Rejects registration with an invalid or nonexistent referral code with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Code User',
          email: 'badcode@example.com',
          mobileNumber: '+919876500007',
          password: 'Password123',
          referralCode: 'NONEXISTENT999'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('referral code is invalid');
    });

    test('7. Prevents role escalation during registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: 'hacker@example.com',
          mobileNumber: '+919876500008',
          password: 'Password123',
          role: 'admin' // Attempting privilege escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('user'); // Must remain 'user'

      const dbUser = await User.findOne({ email: 'hacker@example.com' });
      expect(dbUser.role).toBe('user');
    });
  });

  // 2. LOGIN TESTS
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login User',
          email: 'login@example.com',
          mobileNumber: '+919876500009',
          password: 'CorrectPassword123'
        });
    });

    test('8. Successful login returns 200 with safe user details and JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Login successful');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    test('9. Rejects incorrect password with generic HTTP 401 error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    test('10. Rejects nonexistent email with generic HTTP 401 error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    test('11. Rejects login for inactive user account with HTTP 401', async () => {
      // Deactivate the user
      await User.updateOne({ email: 'login@example.com' }, { isActive: false });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'CorrectPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Account is deactivated');
    });
  });

  // 3. AUTHENTICATED PROFILE & MIDDLEWARE TESTS
  describe('GET /api/auth/me', () => {
    let activeToken;
    let registeredUser;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile User',
          email: 'profile@example.com',
          mobileNumber: '+919876500010',
          password: 'Password123'
        });

      activeToken = res.body.data.token;
      registeredUser = res.body.data.user;
    });

    test('12. Successfully returns current user profile for valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(registeredUser.id);
      expect(res.body.data.user.email).toBe('profile@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    test('13. Rejects request without Authorization header with HTTP 401', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authorization header missing or malformed');
    });

    test('14. Rejects request with invalid or tampered JWT with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid authentication token');
    });

    test('15. Rejects request with expired JWT with HTTP 401', async () => {
      const dbUser = await User.findOne({ email: 'profile@example.com' });
      // Generate a token that expires in 1ms
      const expiredToken = generateToken(dbUser, { expiresIn: '1ms' });

      // Small sleep to ensure token is past expiration
      await new Promise((resolve) => setTimeout(resolve, 50));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('token has expired');
    });

    test('16. Rejects authenticated request if user is deactivated in database', async () => {
      await User.updateOne({ email: 'profile@example.com' }, { isActive: false });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Account is deactivated');
    });
  });

  // 4. ROLE-BASED AUTHORIZATION TESTS
  describe('GET /api/auth/admin-check (Role Authorization)', () => {
    test('17. Allows access for user with admin role', async () => {
      // Create user and explicitly set role to admin
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Password123',
        referralCode: 'ADMIN999',
        role: 'admin'
      });

      const adminToken = generateToken(adminUser);

      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Admin authorization verified');
      expect(res.body.data.adminUser.role).toBe('admin');
    });

    test('18. Rejects access with HTTP 403 when user has regular "user" role', async () => {
      const regUser = await User.create({
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'Password123',
        referralCode: 'REGULAR1',
        role: 'user'
      });

      const userToken = generateToken(regUser);

      const res = await request(app)
        .get('/api/auth/admin-check')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  // 5. MOBILE NUMBER REGISTRATION & BACKWARD COMPATIBILITY TESTS
  describe('Mobile Number Registration & Backward Compatibility Tests', () => {
    test('19. Registers with valid 10-digit Indian mobile number and normalizes to +91 format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          mobileNumber: '9876543210',
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.mobileNumber).toBe('+919876543210');

      const userInDb = await User.findOne({ email: 'priya.sharma@example.com' });
      expect(userInDb.mobileNumber).toBe('+919876543210');
    });

    test('20. Registers with +91 prefixed mobile number successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Rohit Verma',
          email: 'rohit.verma@example.com',
          mobileNumber: '+918765432109',
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.mobileNumber).toBe('+918765432109');
    });

    test('21. Rejects registration when mobileNumber is omitted with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'No Mobile',
          email: 'nomobile@example.com',
          password: 'Password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'mobileNumber')).toBe(true);
    });

    test('22. Rejects registration when mobileNumber is empty string with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Empty Mobile',
          email: 'empty.mobile@example.com',
          mobileNumber: '',
          password: 'Password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'mobileNumber')).toBe(true);
    });

    test('23. Rejects invalid Indian mobile numbers with HTTP 400', async () => {
      // Starting with invalid digit 5
      const resInvalidStart = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Start',
          email: 'invalid.start@example.com',
          mobileNumber: '5876543210',
          password: 'Password123'
        });
      expect(resInvalidStart.status).toBe(400);
      expect(resInvalidStart.body.success).toBe(false);

      // Short (5 digits)
      const resShort = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Mobile',
          email: 'short.mobile@example.com',
          mobileNumber: '98765',
          password: 'Password123'
        });
      expect(resShort.status).toBe(400);
      expect(resShort.body.success).toBe(false);

      // Alphabetic characters
      const resAlpha = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alpha Mobile',
          email: 'alpha.mobile@example.com',
          mobileNumber: '98765abcde',
          password: 'Password123'
        });
      expect(resAlpha.status).toBe(400);
      expect(resAlpha.body.success).toBe(false);
    });

    test('24. Rejects duplicate mobile number registration with HTTP 409', async () => {
      // First user with +919876543210
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User One',
          email: 'user.one@example.com',
          mobileNumber: '9876543210',
          password: 'Password123'
        });

      // Second user attempting registration with the same number (in +91 format)
      const resDup = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User Two',
          email: 'user.two@example.com',
          mobileNumber: '+919876543210',
          password: 'Password123'
        });

      expect(resDup.status).toBe(409);
      expect(resDup.body.success).toBe(false);
      expect(resDup.body.message).toContain('mobile number already exists');
      expect(resDup.body.errors[0].field).toBe('mobileNumber');
    });

    test('25. Existing legacy user without mobileNumber (Akash) can log in and receives safe user object', async () => {
      // Simulate Akash created before mobileNumber existed (using native collection insert)
      const rawUser = {
        name: 'Akash',
        email: 'akash@nexachain.io',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyzA1B2C3D4E5F6G7H8I9J0K', // bcrypt hash placeholder
        referralCode: 'AKASH999',
        referredBy: null,
        role: 'user',
        walletBalancePaise: 50000,
        totalRoiEarnedPaise: 12000,
        totalLevelIncomeEarnedPaise: 8000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
        // mobileNumber field is completely omitted ($exists: false)
      };
      await mongoose.connection.collection('users').insertOne(rawUser);

      // Verify field is missing in raw MongoDB
      const rawDoc = await mongoose.connection.collection('users').findOne({ email: 'akash@nexachain.io' });
      expect(rawDoc.mobileNumber).toBeUndefined();

      // Mongoose retrieval via findOne correctly outputs null via toSafeObject()
      const mUser = await User.findOne({ email: 'akash@nexachain.io' });
      const safe = mUser.toSafeObject();
      expect(safe.mobileNumber).toBeNull();
      expect(safe.walletBalancePaise).toBe(50000);
    });

    test('26. Existing user with mobileNumber: null (Shan) can log in successfully', async () => {
      // Create Shan with mobileNumber: null
      const shan = await User.create({
        name: 'Shan',
        email: 'shan@nexachain.io',
        mobileNumber: null,
        password: 'Password123',
        referralCode: 'SHAN888'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'shan@nexachain.io',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('shan@nexachain.io');
      expect(res.body.data.user.mobileNumber).toBeNull();
    });

    test('27. Existing user without mobileNumber can update profile and password via user.save() without schema errors', async () => {
      const legacyUser = await User.create({
        name: 'Legacy Akash',
        email: 'legacy.akash@nexachain.io',
        mobileNumber: null,
        password: 'Password123',
        referralCode: 'LEGACY1'
      });

      // Update name (profile update)
      legacyUser.name = 'Akash Pandey';
      await expect(legacyUser.save()).resolves.toBeDefined();

      const updated = await User.findOne({ email: 'legacy.akash@nexachain.io' });
      expect(updated.name).toBe('Akash Pandey');
      expect(updated.mobileNumber).toBeNull();

      // Update password
      updated.password = 'NewPassword999';
      await expect(updated.save()).resolves.toBeDefined();

      // Can log in with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'legacy.akash@nexachain.io',
          password: 'NewPassword999'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    test('28. Referral registration with mobileNumber links correctly to legacy sponsor who has no mobileNumber', async () => {
      // Legacy sponsor with no mobile number
      const sponsor = await User.create({
        name: 'Old Sponsor',
        email: 'oldsponsor@example.com',
        mobileNumber: null,
        password: 'Password123',
        referralCode: 'SPONSOR99'
      });

      // New user registering with mobile number and sponsor's code
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Invitee',
          email: 'invitee.with.mobile@example.com',
          mobileNumber: '9123456789',
          password: 'Password123',
          referralCode: 'SPONSOR99'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.referredBy.toString()).toBe(sponsor._id.toString());
      expect(res.body.data.user.mobileNumber).toBe('+919123456789');
    });

    test('29. Existing referral relationships between legacy users without mobile numbers remain intact', async () => {
      const rootUser = await User.create({
        name: 'Root Legacy',
        email: 'root@example.com',
        mobileNumber: null,
        password: 'Password123',
        referralCode: 'ROOT999'
      });

      const childUser = await User.create({
        name: 'Child Legacy',
        email: 'child@example.com',
        mobileNumber: null,
        password: 'Password123',
        referralCode: 'CHILD999',
        referredBy: rootUser._id
      });

      expect(childUser.referredBy.toString()).toBe(rootUser._id.toString());

      // Fetch downline
      const downline = await User.find({ referredBy: rootUser._id });
      expect(downline).toHaveLength(1);
      expect(downline[0].email).toBe('child@example.com');
      expect(downline[0].mobileNumber).toBeNull();
    });

    test('30. Database migration script normalizes missing mobileNumber to null and preserves existing values', async () => {
      // Insert raw document without mobileNumber (like Akash)
      await mongoose.connection.collection('users').insertOne({
        name: 'Akash Missing Field',
        email: 'akash.missing@example.com',
        password: 'HashedPassword123',
        referralCode: 'MISSING1',
        referredBy: null,
        role: 'user',
        walletBalancePaise: 10000,
        totalRoiEarnedPaise: 0,
        totalLevelIncomeEarnedPaise: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Insert user with existing populated mobile number
      await User.create({
        name: 'Populated User',
        email: 'populated@example.com',
        mobileNumber: '+919876599999',
        password: 'Password123',
        referralCode: 'POPULATED1'
      });

      // Run migration function
      const migrationResult = await migrateMobileNumbers();
      expect(migrationResult.documentsNormalized).toBeGreaterThanOrEqual(1);

      // Verify the missing user now has mobileNumber: null
      const updatedMissing = await mongoose.connection.collection('users').findOne({ email: 'akash.missing@example.com' });
      expect(updatedMissing.mobileNumber).toBeNull();

      // Verify the populated user still has their original number
      const populatedUser = await User.findOne({ email: 'populated@example.com' });
      expect(populatedUser.mobileNumber).toBe('+919876599999');

      // Idempotence test: Running migration a second time modifies 0 documents
      const secondRun = await migrateMobileNumbers();
      expect(secondRun.documentsNormalized).toBe(0);
    });

    test('31. Partial unique index allows multiple nulls while preventing duplicate populated numbers', async () => {
      // Multiple users with mobileNumber: null should succeed
      const nullUser1 = await User.create({
        name: 'Null User 1',
        email: 'null1@example.com',
        mobileNumber: null,
        password: 'Password123',
        referralCode: 'NULLUSER1'
      });

      const nullUser2 = await User.create({
        name: 'Null User 2',
        email: 'null2@example.com',
        mobileNumber: null,
        password: 'Password123',
        referralCode: 'NULLUSER2'
      });

      expect(nullUser1.mobileNumber).toBeNull();
      expect(nullUser2.mobileNumber).toBeNull();

      // User with specific mobile number
      await User.create({
        name: 'Unique Mob 1',
        email: 'uniquemob1@example.com',
        mobileNumber: '+919999888877',
        password: 'Password123',
        referralCode: 'UNQMOB1'
      });

      // Duplicate populated mobile number must be rejected by partial unique index
      await expect(
        User.create({
          name: 'Unique Mob 2',
          email: 'uniquemob2@example.com',
          mobileNumber: '+919999888877',
          password: 'Password123',
          referralCode: 'UNQMOB2'
        })
      ).rejects.toThrow();
    });
  });
});

