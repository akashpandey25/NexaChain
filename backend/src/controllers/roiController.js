const {
  getUserRoiHistory,
  getUserRoiSummary,
  processDailyROI
} = require('../services/roiService');
const { executeDailyRoiJob } = require('../cron/dailyRoiJob');

/**
 * ROI Controller
 * Handles user ROI ledger retrieval and administrative processing operations.
 */

/**
 * GET /api/roi/history
 * Returns paginated ROI history records for the authenticated user.
 */
const getRoiHistory = async (req, res, next) => {
  try {
    const data = await getUserRoiHistory(req.user._id, req.query);

    return res.status(200).json({
      success: true,
      message: 'ROI history retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roi/summary
 * Returns aggregated ROI earnings and status counts for the authenticated user.
 */
const getRoiSummary = async (req, res, next) => {
  try {
    const summary = await getUserRoiSummary(req.user._id);

    return res.status(200).json({
      success: true,
      message: 'ROI summary retrieved successfully',
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roi/process
 * Admin-only endpoint to trigger the daily ROI engine for a specified business date.
 * Coordinates with the distributed lock to prevent overlapping runs.
 */
const triggerDailyRoi = async (req, res, next) => {
  try {
    const businessDate = req.body?.businessDate || req.query?.businessDate;
    const result = await executeDailyRoiJob(businessDate);

    // If job was skipped due to lock contention or running locally, return HTTP 409 Conflict
    if (
      result.jobStatus === 'SKIPPED_LOCK_HELD_BY_ANOTHER_INSTANCE' ||
      result.jobStatus === 'SKIPPED_ALREADY_RUNNING_LOCALLY'
    ) {
      return res.status(409).json({
        success: false,
        message: 'Daily ROI processing job is currently running or locked by another instance. Please wait for completion.',
        errors: [
          {
            field: 'jobStatus',
            message: result.jobStatus,
            instanceId: result.instanceId
          }
        ]
      });
    }

    if (result.jobStatus === 'FAILED') {
      return res.status(500).json({
        success: false,
        message: 'Daily ROI processing failed',
        errors: result.failures
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Daily ROI processing completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoiHistory,
  getRoiSummary,
  triggerDailyRoi
};

