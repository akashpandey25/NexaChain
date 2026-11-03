const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

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
          password: 'Password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('registered successfully');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.name).toBe('Jane Doe');
      expect(res.body.data.user.email).toBe('jane.doe@example.com');
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.walletBalancePaise).toBe(0);
      expect(res.body.data.user.referralCode).toMatch(/^NEXA/);
      expect(res.body.data.user.password).toBeUndefined();

      // Verify in database that password was hashed
      const dbUser = await User.findOne({ email: 'jane.doe@example.com' }).select('+password');
      expect(dbUser.password).not.toBe('Password123');
      expect(dbUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    test('2. Rejects duplicate email registration with HTTP 409', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Existing User',
          email: 'duplicate@example.com',
          password: 'Password123'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
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
});

