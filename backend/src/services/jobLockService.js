const os = require('os');
const crypto = require('crypto');
const JobLock = require('../models/JobLock');
const { CRON_CONFIG } = require('../config/cronConfig');

/**
 * Distributed Job Lock Service Layer
 * 
 * Coordinates background scheduled jobs across multiple Node.js instances
 * using atomic MongoDB operations to prevent split-brain and duplicate runs.
 */

/**
 * Generates a unique, human-identifiable lock owner string.
 * Format: hostname-pid-randomHex
 * 
 * @returns {string} Unique process identifier
 */
const generateLockOwnerId = () => {
  const host = os.hostname().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
  const pid = process.pid;
  const rand = crypto.randomBytes(4).toString('hex');
  return `${host}-${pid}-${rand}`;
};

/**
 * Atomically acquires a distributed lock for a specific job name.
 * 
 * ATOMIC MECHANISM:
 * Uses findOneAndUpdate with upsert: true and an $or expiration check.
 * - If no lock exists: inserts new lock atomically.
 * - If lock is expired (expiresAt <= now): steals and updates lock atomically.
 * - If lock is already owned by lockOwner: extends lock (re-entrant).
 * - If lock is actively held by another instance: Mongo rejects upsert with E11000 duplicate key.
 * 
 * @param {string} jobName Unique job name (e.g. 'DAILY_ROI_PROCESSING')
 * @param {string} lockOwner Unique owner identifier
 * @param {number} [leaseDurationMs=600000] Lease duration in milliseconds
 * @returns {Promise<{ acquired: boolean, lock?: object, currentOwner?: string, expiresAt?: Date }>}
 */
const acquireLock = async (jobName, lockOwner, leaseDurationMs = CRON_CONFIG.lockLeaseDurationMs) => {
  if (!jobName || !lockOwner) {
    throw new Error('jobName and lockOwner are required to acquire a distributed lock.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + leaseDurationMs);

  // 1. Atomically acquire by updating an existing expired or self-owned lock
  const updated = await JobLock.findOneAndUpdate(
    {
      jobName,
      $or: [
        { expiresAt: { $lte: now } },
        { lockOwner }
      ]
    },
    {
      $set: {
        lockOwner,
        acquiredAt: now,
        expiresAt,
        lastHeartbeatAt: now
      }
    },
    { new: true }
  ).lean();

  if (updated) {
    return {
      acquired: true,
      lock: updated
    };
  }

  // 2. If no document matched, check if an unexpired lock is held by another owner
  const currentLock = await JobLock.findOne({ jobName }).lean();
  if (currentLock) {
    if (new Date(currentLock.expiresAt) > now) {
      return {
        acquired: false,
        currentOwner: currentLock.lockOwner,
        expiresAt: currentLock.expiresAt
      };
    }
  }

  // 3. Document does not exist; atomically insert new lock (guarded by unique index on jobName)
  try {
    const newLock = await JobLock.create({
      jobName,
      lockOwner,
      acquiredAt: now,
      expiresAt,
      lastHeartbeatAt: now
    });
    return {
      acquired: true,
      lock: newLock.toObject()
    };
  } catch (err) {
    // E11000 duplicate key error means an unexpired lock was inserted concurrently by another instance
    if (err.code === 11000 || err.message?.includes('duplicate key') || err.message?.includes('E11000')) {
      const activeLock = await JobLock.findOne({ jobName }).lean();
      return {
        acquired: false,
        currentOwner: activeLock?.lockOwner,
        expiresAt: activeLock?.expiresAt
      };
    }
    throw err;
  }
};

/**
 * Renews an actively held distributed lock by extending its expiration.
 * Only succeeds if the current lock is still owned by the caller.
 * 
 * @param {string} jobName
 * @param {string} lockOwner
 * @param {number} [leaseDurationMs=600000]
 * @returns {Promise<boolean>} True if renewed successfully, false otherwise
 */
const renewLock = async (jobName, lockOwner, leaseDurationMs = CRON_CONFIG.lockLeaseDurationMs) => {
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + leaseDurationMs);

  const updated = await JobLock.findOneAndUpdate(
    { jobName, lockOwner },
    {
      $set: {
        expiresAt: newExpiresAt,
        lastHeartbeatAt: now
      }
    },
    { new: true }
  ).lean();

  return Boolean(updated);
};

/**
 * Safely releases an actively held distributed lock.
 * Strictly prevents an instance from releasing another instance's lock.
 * 
 * @param {string} jobName
 * @param {string} lockOwner
 * @returns {Promise<boolean>} True if released, false if not held by caller
 */
const releaseLock = async (jobName, lockOwner) => {
  if (!jobName || !lockOwner) {
    return false;
  }

  const result = await JobLock.deleteOne({
    jobName,
    lockOwner
  });

  return result.deletedCount > 0;
};

/**
 * Starts a recurring background heartbeat timer to periodically renew a lock during long-running tasks.
 * 
 * @param {string} jobName
 * @param {string} lockOwner
 * @param {number} [leaseDurationMs=600000]
 * @param {number} [intervalMs=30000]
 * @returns {{ stop: Function }} Handle to stop the heartbeat
 */
const startHeartbeat = (
  jobName,
  lockOwner,
  leaseDurationMs = CRON_CONFIG.lockLeaseDurationMs,
  intervalMs = CRON_CONFIG.lockHeartbeatIntervalMs
) => {
  const timer = setInterval(async () => {
    try {
      const renewed = await renewLock(jobName, lockOwner, leaseDurationMs);
      if (!renewed) {
        clearInterval(timer);
      }
    } catch (err) {
      console.warn(`[JobLock] Warning: Failed to renew heartbeat for job "${jobName}": ${err.message}`);
    }
  }, intervalMs);

  // Do not hold Node process open solely for lock heartbeat
  if (timer.unref) {
    timer.unref();
  }

  return {
    stop: () => clearInterval(timer)
  };
};

module.exports = {
  generateLockOwnerId,
  acquireLock,
  renewLock,
  releaseLock,
  startHeartbeat
};
