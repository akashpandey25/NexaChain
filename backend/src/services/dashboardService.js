const mongoose = require('mongoose');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const ReferralIncome = require('../models/ReferralIncome');

/**
 * Dashboard Service Layer
 * Aggregates user-specific metrics, financials, and chart series.
 */

/**
 * Retrieve aggregated dashboard statistics for an authenticated user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId Authenticated user ObjectId
 * @param {object} [queryOptions={}] Filter options (startDate, endDate, limit)
 * @returns {Promise<object>} Standardized dashboard payload
 */
const getDashboardData = async (userId, queryOptions = {}) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const limit = queryOptions.limit || 30;

  // Build businessDate filter for ROI chart series if provided
  const roiChartMatch = {
    user: userObjectId,
    status: 'processed' // Only processed records count toward earnings
  };

  if (queryOptions.startDate || queryOptions.endDate) {
    roiChartMatch.businessDate = {};
    if (queryOptions.startDate) {
      roiChartMatch.businessDate.$gte = new Date(queryOptions.startDate);
    }
    if (queryOptions.endDate) {
      roiChartMatch.businessDate.$lte = new Date(queryOptions.endDate);
    }
  }

  // Execute independent aggregation pipelines and counts in parallel
  const [
    userRecord,
    directReferralsTotal,
    activeDirectReferralsTotal,
    investmentStats,
    roiSummaryStats,
    roiChartStats,
    referralIncomeStats
  ] = await Promise.all([
    // 1. Fetch current wallet balance
    User.findById(userObjectId).select('walletBalancePaise').lean(),

    // 2. Count direct referrals (strictly where referredBy === userId)
    User.countDocuments({ referredBy: userObjectId }),

    // 3. Count active direct referrals
    User.countDocuments({ referredBy: userObjectId, isActive: true }),

    // 4. Aggregate investments by status (amounts and counts)
    Investment.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amountPaise: { $sum: '$principalAmountPaise' }
        }
      }
    ]),

    // 5. Aggregate processed ROI totals
    ROIHistory.aggregate([
      {
        $match: {
          user: userObjectId,
          status: 'processed' // Exclude pending and failed
        }
      },
      {
        $group: {
          _id: null,
          totalAmountPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 }
        }
      }
    ]),

    // 6. Aggregate ROI chart points grouped by businessDate (ascending)
    ROIHistory.aggregate([
      { $match: roiChartMatch },
      {
        $group: {
          _id: '$businessDate',
          amountPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }, // Business date ascending for charting
      { $limit: limit }
    ]),

    // 7. Aggregate processed referral income
    ReferralIncome.aggregate([
      {
        $match: {
          beneficiary: userObjectId,
          status: 'processed' // Exclude pending and failed
        }
      },
      {
        $group: {
          _id: null,
          totalAmountPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Process Investment Metrics
  const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
  const statusCounts = {
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  };
  const statusAmounts = {
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  };

  let totalInvestmentPaise = 0;
  let totalInvestmentCount = 0;

  investmentStats.forEach((item) => {
    if (statusCounts[item._id] !== undefined) {
      statusCounts[item._id] = item.count;
      statusAmounts[item._id] = item.amountPaise;
    }
    totalInvestmentPaise += item.amountPaise;
    totalInvestmentCount += item.count;
  });

  const amountByStatus = validStatuses.map((status) => ({
    status,
    count: statusCounts[status],
    amountPaise: statusAmounts[status]
  }));

  // Process ROI Metrics
  const totalRoiPaise =
    roiSummaryStats.length > 0 ? roiSummaryStats[0].totalAmountPaise : 0;
  const processedRoiRecordCount =
    roiSummaryStats.length > 0 ? roiSummaryStats[0].count : 0;

  const roiChartData = roiChartStats.map((point) => ({
    businessDate: point._id,
    amountPaise: point.amountPaise,
    count: point.count
  }));

  // Process Referral Income Metrics
  const processedReferralIncomePaise =
    referralIncomeStats.length > 0
      ? referralIncomeStats[0].totalAmountPaise
      : 0;

  // Process Wallet Balance
  const walletBalancePaise = userRecord ? userRecord.walletBalancePaise : 0;

  return {
    summary: {
      totalInvestmentPaise,
      activeInvestmentPaise: statusAmounts.active,
      totalRoiPaise,
      walletBalancePaise,
      totalDirectReferrals: directReferralsTotal,
      activeDirectReferrals: activeDirectReferralsTotal,
      processedReferralIncomePaise
    },
    investments: {
      totalCount: totalInvestmentCount,
      activeCount: statusCounts.active,
      pendingCount: statusCounts.pending,
      completedCount: statusCounts.completed,
      cancelledCount: statusCounts.cancelled,
      amountByStatus
    },
    roi: {
      totalProcessedRoiPaise: totalRoiPaise,
      processedRecordCount: processedRoiRecordCount,
      chartData: roiChartData
    },
    referrals: {
      totalDirectReferrals: directReferralsTotal,
      activeDirectReferrals: activeDirectReferralsTotal,
      processedReferralIncomePaise
    }
  };
};

module.exports = {
  getDashboardData
};

