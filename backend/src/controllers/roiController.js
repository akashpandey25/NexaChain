const {
  getUserRoiHistory,
  getUserRoiSummary,
  processDailyROI
} = require('../services/roiService');

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
 */
const triggerDailyRoi = async (req, res, next) => {
  try {
    const businessDate = req.body?.businessDate || req.query?.businessDate;
    const summary = await processDailyROI(businessDate);

    return res.status(200).json({
      success: true,
      message: 'Daily ROI processing completed',
      data: summary
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

