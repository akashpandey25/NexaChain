const dashboardService = require('../services/dashboardService');

/**
 * Dashboard Controller
 * Handles HTTP requests for aggregated user dashboard statistics.
 */

/**
 * Retrieve current authenticated user's dashboard statistics.
 * Route: GET /api/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await dashboardService.getDashboardData(
      req.user._id,
      req.query
    );

    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard
};

