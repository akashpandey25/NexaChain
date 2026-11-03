/**
 * Cron & Scheduler Configuration Registry
 * 
 * Centralizes technical scheduling parameters, timezone settings,
 * distributed locking lease durations, and scheduler enable/disable controls.
 * 
 * ARCHITECTURAL REQUIREMENTS:
 * - Differentiates scheduler technical parameters from financial business rules.
 * - Enforces standard timezone: Asia/Kolkata (IST UTC+05:30).
 * - Uses standard daily midnight cron expression: "0 0 * * *".
 * - Allows scheduler to be toggled via environment (CRON_ENABLED).
 */

const { z } = require('zod');
const env = require('./env');

/**
 * Technical Scheduler Configuration Schema
 */
const cronConfigSchema = z.object({
  // Whether the background scheduler is activated in this process
  isEnabled: z.boolean(),

  // Standard cron schedule expression (default: "0 0 * * *" - midnight daily)
  cronExpression: z.string().min(1),

  // Authoritative business timezone
  timeZone: z.string().min(1),

  // Job name identifier for distributed locking
  jobName: z.string().min(1),

  // Distributed lock lease duration in milliseconds (default: 10 minutes)
  lockLeaseDurationMs: z.number().int().positive(),

  // Heartbeat refresh interval for active distributed locks in ms (default: 30 seconds)
  lockHeartbeatIntervalMs: z.number().int().positive(),

  // Graceful shutdown wait period for in-flight job completion (default: 8000 ms)
  shutdownGracePeriodMs: z.number().int().positive().optional().default(8000)
});

/**
 * Technical Scheduler Configuration
 */
const CRON_CONFIG = {
  // Enabled by default unless explicitly set to 'false' or running in test mode
  isEnabled: process.env.CRON_ENABLED !== 'false' && env.nodeEnv !== 'test',

  // Standard daily midnight cron schedule
  cronExpression: process.env.CRON_SCHEDULE || '0 0 * * *',

  // Authoritative business timezone
  timeZone: env.cronTimezone || 'Asia/Kolkata',

  // Default job identifier
  jobName: 'DAILY_ROI_PROCESSING',

  // Distributed lock lease duration (10 minutes)
  lockLeaseDurationMs: parseInt(process.env.CRON_LOCK_LEASE_MS, 10) || 10 * 60 * 1000,

  // Lock heartbeat interval (30 seconds)
  lockHeartbeatIntervalMs: parseInt(process.env.CRON_HEARTBEAT_MS, 10) || 30 * 1000,

  // Graceful shutdown wait period (default: 8000 ms, configurable via CRON_SHUTDOWN_TIMEOUT_MS)
  shutdownGracePeriodMs: parseInt(process.env.CRON_SHUTDOWN_TIMEOUT_MS, 10) || 8000
};

/**
 * Validates the scheduler technical configuration.
 * Throws an explicit Error if invalid.
 * 
 * @param {object} [customConfig] Optional runtime overrides for testing
 * @returns {object} Validated scheduler configuration
 */
const validateCronConfig = (customConfig = {}) => {
  const merged = {
    ...CRON_CONFIG,
    ...customConfig
  };

  try {
    return cronConfigSchema.parse(merged);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Cron Configuration Error: ${details}`);
    }
    throw err;
  }
};

module.exports = {
  CRON_CONFIG,
  validateCronConfig
};

