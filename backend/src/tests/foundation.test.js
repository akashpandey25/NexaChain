const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const { connectDB, disconnectDB, getDBStatus } = require('../config/db');

// Increase default timeout to accommodate in-memory MongoDB lifecycle
jest.setTimeout(120000);

describe('Backend Foundation & MongoDB Connection Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start an in-memory MongoDB instance to safely verify connection logic
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  test('1. Database status helper correctly reflects connected state', () => {
    const status = getDBStatus();
    expect(status.isConnected).toBe(true);
    expect(status.statusText).toBe('connected');
  });

  test('2. GET / should return root API information with standard success format', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.version).toBe('1.0.0');
  });

  test('3. GET /api/health should return 200 with database: connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy and operational');
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('uptime');
  });

  test('4. Security headers (Helmet) should be present', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('5. CORS headers should allow configured client origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  test('6. GET /api/unknown-route should return 404 with standard error format', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Resource not found');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.body.errors[0].path).toBe('/api/non-existent-endpoint');
  });

  test('7. GET /api/health should return 503 when database is disconnected', async () => {
    // Temporarily disconnect to verify 503 handling
    await disconnectDB();

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Database is disconnected');
    expect(res.body.errors[0].status).toBe('degraded');
    expect(res.body.errors[0].database).toBe('disconnected');

    // Reconnect for cleanup
    await connectDB(mongoServer.getUri());
  });
});
