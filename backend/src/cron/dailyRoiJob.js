const cron = require('node-cron');
const { CRON_CONFIG, validateCronConfig } = require('../config/cronConfig');
const { processDailyROI } = require('../services/roiService');
const {
  generateLockOwnerId,
  acquireLock,
  releaseLock,
  startHeartbeat
} = require('../services/jobLockService');

/**
 * Daily Return on Investment (ROI) Cron Job & Scheduler
 * 
 * Automates daily ROI processing at 12:00 AM (midnight) in Asia/Kolkata timezone.
 * Uses distributed locking to prevent multi-instance concurrent execution,
 * and process-local concurrency flags to prevent overlapping runs.
 */

let scheduledTask = null;
let isJobRunningLocally = false;
let activeJobPromise = null;
const instanceIdentifier = generateLockOwnerId();

/**
 * Computes the target business date for the scheduled run in the configured timezone.
 * When the job triggers at midnight, it processes the calendar business day.
 * 
 * @param {Date} [referenceDate=new Date()]
 * @param {string} [timeZone='Asia/Kolkata']
 * @returns {string} Date formatted as 'YYYY-MM-DD'
 */
const resolveBusinessDateForRun = (referenceDate = new Date(), timeZone = CRON_CONFIG.timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(referenceDate);
};

/**
 * Core Job Execution Function
 * Can be triggered directly by the cron schedule, integration tests, or admin trigger.
 * 
 * @param {string|Date} [targetBusinessDate] Optional explicit business date
 * @param {object} [options={}] Optional execution options (e.g. customRules, lockOwner)
 * @returns {Promise<object>} Structured execution log and processing summary
 */
const executeDailyRoiJob = async (targetBusinessDate, options = {}) => {
  const config = validateCronConfig(options.cronConfigOverrides || {});
  const jobName = options.jobName || config.jobName;
  const lockOwner = options.lockOwner || instanceIdentifier;
  const businessDate = targetBusinessDate || resolveBusinessDateForRun(new Date(), config.timeZone);

  const startTimestamp = new Date();

  const executionLog = {
    jobName,
    businessDate,
    instanceId: lockOwner,
    startTimestamp: startTimestamp.toISOString(),
    completionTimestamp: null,
    durationMs: 0,
    jobStatus: 'RUNNING',
    eligibleInvestments: 0,
    processedInvestments: 0,
    skippedInvestments: 0,
    failedInvestments: 0,
    totalRoiGeneratedPaise: 0,
    failures: []
  };

  // 1. Process-local concurrency guard
  if (isJobRunningLocally) {
    executionLog.jobStatus = 'SKIPPED_ALREADY_RUNNING_LOCALLY';
    executionLog.completionTimestamp = new Date().toISOString();
    console.warn(`[Scheduler] ⚠️ Job "${jobName}" is already actively executing in this process. Skipping duplicate invocation.`);
    return executionLog;
  }

  // 2. Distributed lock acquisition across cluster instances
  let lockResult;
  try {
    lockResult = await acquireLock(jobName, lockOwner, config.lockLeaseDurationMs);
  } catch (lockError) {
    executionLog.jobStatus = 'FAILED_LOCK_ACQUISITION';
    executionLog.completionTimestamp = new Date().toISOString();
    executionLog.failures.push({ reason: `Distributed lock failure: ${lockError.message}` });
    console.error(`[Scheduler] ❌ Failed to evaluate distributed lock for "${jobName}": ${lockError.message}`);
    return executionLog;
  }

  if (!lockResult.acquired) {
    executionLog.jobStatus = 'SKIPPED_LOCK_HELD_BY_ANOTHER_INSTANCE';
    executionLog.completionTimestamp = new Date().toISOString();
    console.log(
      `[Scheduler] ℹ️ Job "${jobName}" skipped: Distributed lock is actively held by instance ` +
      `"${lockResult.currentOwner}" until ${new Date(lockResult.expiresAt).toISOString()}`
    );
    return executionLog;
  }

  isJobRunningLocally = true;
  console.log(`[Scheduler] 🚀 Starting daily ROI processing for business date: "${businessDate}" (Instance: ${lockOwner})`);

  // 3. Start background heartbeat to renew lock during execution
  const heartbeat = startHeartbeat(
    jobName,
    lockOwner,
    config.lockLeaseDurationMs,
    config.lockHeartbeatIntervalMs
  );

  const runJob = async () => {
    try {
      // 4. Delegate to the authoritative ROI processing service
      const summary = await processDailyROI(businessDate, options.roiServiceOptions || {});

      const endTimestamp = new Date();
      executionLog.completionTimestamp = endTimestamp.toISOString();
      executionLog.durationMs = endTimestamp.getTime() - startTimestamp.getTime();
      executionLog.eligibleInvestments = summary.eligibleInvestments;
      executionLog.processedInvestments = summary.processedInvestments;
      executionLog.skippedInvestments = summary.skippedInvestments;
      executionLog.failedInvestments = summary.failedInvestments;
      executionLog.totalRoiGeneratedPaise = summary.totalRoiGeneratedPaise;
      executionLog.failures = summary.failures || [];

      if (summary.failedInvestments > 0) {
        executionLog.jobStatus = 'PARTIAL_FAILURE';
        console.warn(
          `[Scheduler] ⚠️ Job completed with partial failures: ${summary.failedInvestments} investments failed. ` +
          `Processed: ${summary.processedInvestments}, Total: ${summary.totalRoiGeneratedPaise} paise (${executionLog.durationMs}ms)`
        );
      } else {
        executionLog.jobStatus = 'SUCCESS';
        console.log(
          `[Scheduler] ✅ Daily ROI run completed successfully: ` +
          `${summary.processedInvestments}/${summary.eligibleInvestments} processed, ` +
          `${summary.skippedInvestments} skipped, ` +
          `${summary.totalRoiGeneratedPaise} paise generated (${executionLog.durationMs}ms)`
        );
      }

      return executionLog;
    } catch (error) {
      const endTimestamp = new Date();
      executionLog.completionTimestamp = endTimestamp.toISOString();
      executionLog.durationMs = endTimestamp.getTime() - startTimestamp.getTime();
      executionLog.jobStatus = 'FAILED';
      executionLog.failures.push({ reason: error.message });

      console.error(`[Scheduler] ❌ Daily ROI processing failed: ${error.message} (${executionLog.durationMs}ms)`);
      return executionLog;
    } finally {
      // 5. Clean up heartbeat, release process flag, and release distributed lock safely
      heartbeat.stop();
      isJobRunningLocally = false;
      activeJobPromise = null;

      try {
        await releaseLock(jobName, lockOwner);
      } catch (releaseErr) {
        console.warn(`[Scheduler] Warning: Failed to release distributed lock for "${jobName}": ${releaseErr.message}`);
      }
    }
  };

  activeJobPromise = runJob();
  return await activeJobPromise;
};

/**
 * Initializes and starts the background daily ROI cron schedule.
 * 
 * @param {object} [customConfig={}]
 * @returns {object|null} Scheduled task handle or null if disabled
 */
const startDailyRoiScheduler = (customConfig = {}) => {
  const config = validateCronConfig(customConfig);

  if (!config.isEnabled) {
    console.log('[Scheduler] ⏸️ Background cron scheduler is DISABLED by configuration.');
    return null;
  }

  if (scheduledTask) {
    console.log('[Scheduler] ℹ️ Background scheduler is already running.');
    return scheduledTask;
  }

  console.log(
    `[Scheduler] ⏰ Initializing node-cron schedule: "${config.cronExpression}" ` +
    `(Timezone: ${config.timeZone}, Instance: ${instanceIdentifier})`
  );

  scheduledTask = cron.schedule(
    config.cronExpression,
    async () => {
      try {
        await executeDailyRoiJob(null, { cronConfigOverrides: config });
      } catch (err) {
        console.error(`[Scheduler] 💥 Unhandled error in scheduled ROI execution: ${err.message}`);
      }
    },
    {
      scheduled: true,
      timezone: config.timeZone
    }
  );

  return scheduledTask;
};

/**
 * Awaits completion of an actively running in-flight job up to timeoutMs.
 * 
 * @param {number} [timeoutMs=CRON_CONFIG.shutdownGracePeriodMs] Graceful shutdown timeout in ms
 * @returns {Promise<boolean>} True if completed or not running, false if timed out
 */
const waitForActiveJob = async (timeoutMs = CRON_CONFIG.shutdownGracePeriodMs) => {
  if (!isJobRunningLocally || !activeJobPromise) {
    return true;
  }
  console.log(`[Scheduler] ⏳ In-flight ROI job detected. Awaiting completion (timeout: ${timeoutMs}ms)...`);
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  const completed = await Promise.race([
    activeJobPromise.then(() => true).catch(() => true),
    timeoutPromise
  ]);
  clearTimeout(timer);
  return completed;
};

/**
 * Stops the background scheduler cleanly.
 */
const stopDailyRoiScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Scheduler] 🛑 Background cron scheduler stopped.');
  }
};

/**
 * Returns current scheduler status.
 */
const getSchedulerStatus = () => {
  return {
    isConfiguredEnabled: CRON_CONFIG.isEnabled,
    isTaskScheduled: Boolean(scheduledTask),
    isJobRunningLocally,
    cronExpression: CRON_CONFIG.cronExpression,
    timeZone: CRON_CONFIG.timeZone,
    instanceId: instanceIdentifier
  };
};

module.exports = {
  instanceIdentifier,
  resolveBusinessDateForRun,
  executeDailyRoiJob,
  startDailyRoiScheduler,
  stopDailyRoiScheduler,
  getSchedulerStatus,
  waitForActiveJob
};

