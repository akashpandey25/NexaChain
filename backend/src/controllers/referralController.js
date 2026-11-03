const referralService = require('../services/referralService');

/**
 * Referral Controller
 * Exposes endpoints for direct referral lists, hierarchical tree traversal, and commission audits.
 */

/**
 * Get paginated list of direct referrals.
 * Route: GET /api/referrals/direct
 */
const getDirectReferrals = async (req, res, next) => {
  try {
    const data = await referralService.getDirectReferrals(req.user._id, req.query);

    return res.status(200).json({
      success: true,
      message: 'Direct referrals retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hierarchical multi-level referral network tree.
 * Route: GET /api/referrals/tree
 */
const getReferralTree = async (req, res, next) => {
  try {
    const data = await referralService.getReferralTree(req.user, req.query);

    return res.status(200).json({
      success: true,
      message: 'Referral tree retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated referral income history and status breakdown.
 * Route: GET /api/referrals/income
 */
const getReferralIncome = async (req, res, next) => {
  try {
    const data = await referralService.getReferralIncome(req.user._id, req.query);

    return res.status(200).json({
      success: true,
      message: 'Referral income records retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDirectReferrals,
  getReferralTree,
  getReferralIncome
};

