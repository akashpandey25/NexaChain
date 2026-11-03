const mongoose = require('mongoose');

/**
 * JobLock Schema
 * Provides distributed coordination across multiple backend server instances
 * to prevent concurrent execution of scheduled background jobs.
 */
const jobLockSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: [true, 'Job name is required for distributed locking'],
      trim: true
    },
    lockOwner: {
      type: String,
      required: [true, 'Lock owner identifier is required'],
      trim: true
    },
    acquiredAt: {
      type: Date,
      required: [true, 'Lock acquisition timestamp is required'],
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: [true, 'Lock expiration timestamp is required'],
      index: true
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'job_locks'
  }
);

// Unique index on jobName to enforce single lock document per job
jobLockSchema.index({ jobName: 1 }, { unique: true });

// Prevent OverwriteModelError
const JobLock = mongoose.models.JobLock || mongoose.model('JobLock', jobLockSchema);

module.exports = JobLock;
