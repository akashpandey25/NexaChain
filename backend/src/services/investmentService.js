const Investment = require('../models/Investment');
const { findPlan, getAvailablePlanNames } = require('../config/plans');

/**
 * Investment Service Layer
 * Encapsulates all business rules, server-side plan resolution, and ownership enforcement.
 */

/**
 * Create a new investment contract associated with the authenticated user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId Authenticated user ID (req.user._id)
 * @param {object} data Validated investment data containing principalAmountPaise and planName
 * @returns {Promise<object>} Created investment document
 */
const createInvestment = async (userId, data) => {
  // 1. Resolve authorized server-side plan configuration
  const plan = findPlan(data.planName);

  if (!plan) {
    const error = new Error(
      `Unrecognized or unconfigured investment plan: '${data.planName}'. Available plans: [${getAvailablePlanNames().join(', ')}]`
    );
    error.statusCode = 400;
    error.errors = [
      {
        field: 'planName',
        message: 'Plan is not configured on the server. Arbitrary client plan configurations are forbidden.'
      }
    ];
    throw error;
  }

  // 2. Set start and end dates based on server plan duration
  const startDate = new Date();
  const endDate = plan.durationDays
    ? new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
    : null;

  // 3. Persist investment strictly in 'pending' status using server-authoritative rates
  const investment = await Investment.create({
    user: userId, // Enforce authenticated user ownership
    principalAmountPaise: data.principalAmountPaise,
    planName: plan.name,
    roiPercentage: plan.roiPercentage, // Server-configured rate (never client-supplied)
    startDate,
    endDate,
    status: 'pending', // Strictly pending; no auto-activation
    totalRoiEarnedPaise: 0 // Initialized to 0
  });

  return investment;
};

/**
 * Retrieve paginated list of investments owned exclusively by the authenticated user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId Authenticated user ID
 * @param {object} options Query parameters (page, limit, status)
 * @returns {Promise<{ investments: Array, pagination: object }>}
 */
const getUserInvestments = async (userId, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // Build query filter strictly scoped to authenticated user ID
  const filter = { user: userId };

  if (options.status) {
    filter.status = options.status;
  }

  // Execute count and query in parallel
  const [totalRecords, investments] = await Promise.all([
    Investment.countDocuments(filter),
    Investment.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const pagination = {
    currentPage: page,
    pageSize: limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  return {
    investments,
    pagination
  };
};

/**
 * Retrieve investment details by ID, enforcing authenticated user ownership.
 * 
 * @param {string} investmentId Target investment ObjectId
 * @param {string|mongoose.Types.ObjectId} userId Authenticated user ID
 * @returns {Promise<object|null>} Investment document or null if not found/unauthorized
 */
const getInvestmentById = async (investmentId, userId) => {
  // Query by both _id and user to guarantee ownership isolation
  const investment = await Investment.findOne({
    _id: investmentId,
    user: userId
  }).lean();

  return investment;
};

module.exports = {
  createInvestment,
  getUserInvestments,
  getInvestmentById
};

