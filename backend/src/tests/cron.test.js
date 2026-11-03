const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const WalletTransaction = require('../models/WalletTransaction');
const JobLock = require('../models/JobLock');
const {
  CRON_CONFIG,
  validateCronConfig
} = require('../config/cronConfig');
const {
  acquireLock,
  renewLock,
  releaseLock,
  generateLockOwnerId
} = require('../services/jobLockService');
const {
  executeDailyRoiJob,
  startDailyRoiScheduler,
  stopDailyRoiScheduler,
  getSchedulerStatus
} = require('../cron/dailyRoiJob');
const { generateToken } = require('../utils/jwt');
const { INVESTMENT_PLANS } = require('../config/plans');

jest.setTimeout(180000);

describe('Automated Daily ROI Scheduler & Distributed Locking', () => {
  let replSet;
  let testUser;
  let adminUser;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Start an in-memory replica set for transactions and locking
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = replSet.getUri();
    await connectDB(uri);

    // Build model indexes
    await Promise.all([
      User.init(),
      Investment.init(),
      ROIHistory.init(),
      WalletTransaction.init(),
      JobLock.init()
    ]);
    await JobLock.syncIndexes();

    // Create test user
    testUser = await User.create({
      name: 'Cron Test User',
      email: 'cronuser@example.com',
      password: 'Password123!',
      referralCode: 'CRON001',
      walletBalancePaise: 0
    });
    userToken = generateToken(testUser);

    // Create admin user for manual trigger testing
    adminUser = await User.create({
      name: 'Cron Admin',
      email: 'cronadmin@example.com',
      password: 'AdminPassword123!',
      referralCode: 'CRONADM',
      role: 'admin',
      walletBalancePaise: 0
    });
    adminToken = generateToken(adminUser);
  });

  afterAll(async () => {
    stopDailyRoiScheduler();
    await disconnectDB();
    if (replSet) {
      await replSet.stop();
    }
  });

  beforeEach(async () => {
    stopDailyRoiScheduler();
    await Investment.deleteMany({});
    await ROIHistory.deleteMany({});
    await WalletTransaction.deleteMany({});
    await JobLock.deleteMany({});
    await User.updateOne({ _id: testUser._id }, { walletBalancePaise: 0 });
  });

  describe('1. Scheduler Configuration & Technical Parameters', () => {
    test('Configures standard daily midnight expression and Asia/Kolkata timezone', () => {
      const config = validateCronConfig();
      expect(config.cronExpression).toBe('0 0 * * *');
      expect(config.timeZone).toBe('Asia/Kolkata');
      expect(config.jobName).toBe('DAILY_ROI_PROCESSING');
      expect(config.lockLeaseDurationMs).toBeGreaterThan(0);
      expect(config.lockHeartbeatIntervalMs).toBeGreaterThan(0);
    });

    test('Validates scheduler configuration and rejects invalid cron expressions or numbers', () => {
      expect(() =>
        validateCronConfig({ cronExpression: '' })
      ).toThrow('Cron Configuration Error');

      expect(() =>
        validateCronConfig({ lockLeaseDurationMs: -500 })
      ).toThrow('Cron Configuration Error');
    });

    test('Scheduler can be disabled via configuration flag and reports status', () => {
      const task = startDailyRoiScheduler({ isEnabled: false });
      expect(task).toBeNull();

      const status = getSchedulerStatus();
      expect(status.isTaskScheduled).toBe(false);
    });

    test('Scheduler starts when enabled and stops cleanly', () => {
      const task = startDailyRoiScheduler({ isEnabled: true });
      expect(task).toBeTruthy();

      const statusRunning = getSchedulerStatus();
      expect(statusRunning.isTaskScheduled).toBe(true);

      stopDailyRoiScheduler();
      const statusStopped = getSchedulerStatus();
      expect(statusStopped.isTaskScheduled).toBe(false);
    });
  });

  describe('2. Distributed Lock Mechanics & Fault Tolerance', () => {
    test('Atomically acquires distributed lock for an instance', async () => {
      const owner1 = generateLockOwnerId();
      const result = await acquireLock('TEST_JOB', owner1, 5000);

      expect(result.acquired).toBe(true);
      expect(result.lock).toHaveProperty('jobName', 'TEST_JOB');
      expect(result.lock).toHaveProperty('lockOwner', owner1);

      // Verify lock in database
      const lockInDb = await JobLock.findOne({ jobName: 'TEST_JOB' });
      expect(lockInDb).toBeTruthy();
      expect(lockInDb.lockOwner).toBe(owner1);
    });

    test('Enforces lock contention: second instance cannot acquire unexpired lock', async () => {
      const owner1 = 'instance-alpha';
      const owner2 = 'instance-beta';

      // Instance 1 acquires lock
      const res1 = await acquireLock('TEST_JOB', owner1, 10000);
      expect(res1.acquired).toBe(true);

      // Instance 2 attempts to acquire the same lock while active
      const res2 = await acquireLock('TEST_JOB', owner2, 10000);
      expect(res2.acquired).toBe(false);
      expect(res2.currentOwner).toBe(owner1);

      // Verify database still lists instance 1
      const lockInDb = await JobLock.findOne({ jobName: 'TEST_JOB' });
      expect(lockInDb.lockOwner).toBe(owner1);
    });

    test('Recovers expired lock safely if an instance crashed or timed out', async () => {
      const owner1 = 'crashed-instance';
      const owner2 = 'healthy-instance';

      // Create an expired lock in the database
      const pastDate = new Date(Date.now() - 5000);
      await JobLock.create({
        jobName: 'TEST_JOB',
        lockOwner: owner1,
        acquiredAt: new Date(Date.now() - 60000),
        expiresAt: pastDate
      });

      // Healthy instance attempts acquisition: should steal the expired lock
      const res = await acquireLock('TEST_JOB', owner2, 10000);
      expect(res.acquired).toBe(true);
      expect(res.lock.lockOwner).toBe(owner2);

      const lockInDb = await JobLock.findOne({ jobName: 'TEST_JOB' });
      expect(lockInDb.lockOwner).toBe(owner2);
    });

    test('Safely releases lock only if held by matching owner', async () => {
      const owner1 = 'instance-1';
      const owner2 = 'imposter-instance';

      await acquireLock('TEST_JOB', owner1, 10000);

      // Imposter tries to release instance 1's lock -> must fail
      const releasedByImposter = await releaseLock('TEST_JOB', owner2);
      expect(releasedByImposter).toBe(false);

      // Lock must still exist
      const lockStillExists = await JobLock.findOne({ jobName: 'TEST_JOB' });
      expect(lockStillExists).toBeTruthy();

      // Legitimate owner releases lock -> succeeds
      const releasedByOwner = await releaseLock('TEST_JOB', owner1);
      expect(releasedByOwner).toBe(true);

      // Lock should now be removed
      const lockAfterRelease = await JobLock.findOne({ jobName: 'TEST_JOB' });
      expect(lockAfterRelease).toBeNull();
    });

    test('Renews actively held lock during heartbeat', async () => {
      const owner1 = 'instance-heartbeat';
      await acquireLock('TEST_JOB', owner1, 5000);

      const initialLock = await JobLock.findOne({ jobName: 'TEST_JOB' });
      const initialExpires = initialLock.expiresAt.getTime();

      // Renew with 20000 ms lease
      const renewed = await renewLock('TEST_JOB', owner1, 20000);
      expect(renewed).toBe(true);

      const renewedLock = await JobLock.findOne({ jobName: 'TEST_JOB' });
      expect(renewedLock.expiresAt.getTime()).toBeGreaterThan(initialExpires);
    });

    test('Handles concurrent acquisition attempts without race condition', async () => {
      const owners = ['inst-a', 'inst-b', 'inst-c', 'inst-d'];

      // Fire 4 simultaneous acquisition attempts
      const results = await Promise.all(
        owners.map((owner) => acquireLock('CONCURRENT_JOB', owner, 10000))
      );

      const acquiredCount = results.filter((r) => r.acquired).length;
      const rejectedCount = results.filter((r) => !r.acquired).length;

      expect(acquiredCount).toBe(1);
      expect(rejectedCount).toBe(3);

      const singleLock = await JobLock.countDocuments({ jobName: 'CONCURRENT_JOB' });
      expect(singleLock).toBe(1);
    });
  });

  describe('3. Job Execution & Observability Logging', () => {
    test('Executes daily ROI processing with structured observability log and releases lock', async () => {
      const businessDate = '2026-11-03';

      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      const log = await executeDailyRoiJob(businessDate);

      expect(log.jobName).toBe('DAILY_ROI_PROCESSING');
      expect(log.businessDate).toBe('2026-11-03');
      expect(log.jobStatus).toBe('SUCCESS');
      expect(log.eligibleInvestments).toBe(1);
      expect(log.processedInvestments).toBe(1);
      expect(log.skippedInvestments).toBe(0);
      expect(log.failedInvestments).toBe(0);
      expect(log.totalRoiGeneratedPaise).toBe(1500);
      expect(log.durationMs).toBeGreaterThanOrEqual(0);
      expect(log.completionTimestamp).toBeTruthy();

      // Distributed lock should be released cleanly after completion
      const activeLock = await JobLock.findOne({ jobName: 'DAILY_ROI_PROCESSING' });
      expect(activeLock).toBeNull();

      // Verify wallet update
      const user = await User.findById(testUser._id);
      expect(user.walletBalancePaise).toBe(1500);
    });

    test('Records PARTIAL_FAILURE status and logs failed investments without aborting valid ones', async () => {
      const businessDate = '2026-11-03';

      // Valid investment
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 1.0,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // Invalid investment (corrupted rate)
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 200000,
        planName: INVESTMENT_PLANS.STARTER.name,
        roiPercentage: 99.0, // Mismatched rate
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      const log = await executeDailyRoiJob(businessDate);

      expect(log.jobStatus).toBe('PARTIAL_FAILURE');
      expect(log.eligibleInvestments).toBe(2);
      expect(log.processedInvestments).toBe(1);
      expect(log.failedInvestments).toBe(1);
      expect(log.failures.length).toBe(1);
      expect(log.failures[0].reason).toContain('rate mismatch');

      // Valid investment was still credited (1000 paise)
      const user = await User.findById(testUser._id);
      expect(user.walletBalancePaise).toBe(1000);
    });

    test('Retrying job skips already processed investments safely (Idempotency)', async () => {
      const businessDate = '2026-11-03';

      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      // First run: processes 1 investment
      const run1 = await executeDailyRoiJob(businessDate);
      expect(run1.processedInvestments).toBe(1);

      // Second run: skips the already processed investment
      const run2 = await executeDailyRoiJob(businessDate);
      expect(run2.processedInvestments).toBe(0);
      expect(run2.skippedInvestments).toBe(1);
      expect(run2.totalRoiGeneratedPaise).toBe(0);

      // Wallet must not be double-credited
      const user = await User.findById(testUser._id);
      expect(user.walletBalancePaise).toBe(1500);
    });
  });

  describe('4. Administrative Manual Trigger & Lock Coordination', () => {
    test('POST /api/roi/process executes job under distributed lock', async () => {
      await Investment.create({
        user: testUser._id,
        principalAmountPaise: 100000,
        planName: INVESTMENT_PLANS.GROWTH.name,
        roiPercentage: 1.5,
        status: 'active',
        startDate: new Date('2026-11-01T00:00:00.000Z')
      });

      const res = await request(app)
        .post('/api/roi/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ businessDate: '2026-11-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedInvestments).toBe(1);
      expect(res.body.data.totalRoiGeneratedPaise).toBe(1500);
      expect(res.body.data.jobStatus).toBe('SUCCESS');
    });

    test('POST /api/roi/process returns HTTP 409 Conflict if job is actively running or locked', async () => {
      // Artificially hold the distributed lock
      await acquireLock('DAILY_ROI_PROCESSING', 'other-instance-lock', 60000);

      const res = await request(app)
        .post('/api/roi/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ businessDate: '2026-11-03' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('currently running or locked by another instance');
    });
  });
});

