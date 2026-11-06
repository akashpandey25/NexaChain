const Investment = require('../models/Investment');
const { findPlan, getAvailablePlanNames, getPublicPlans } = require('../config/plans');
const env = require('../config/env');

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

/**
 * Retrieve public investment plans for dynamic frontend loading.
 * @returns {Array<object>} Available plan objects
 */
const getPlans = () => {
  return getPublicPlans();
};

/**
 * Retrieve paginated pending investments across all platform users for administrative review.
 * 
 * @param {object} options Query parameters (page, limit)
 * @returns {Promise<{ investments: Array, pagination: object }>}
 */
const getAdminPendingInvestments = async (options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const filter = { status: 'pending' };

  const [totalRecords, investments] = await Promise.all([
    Investment.countDocuments(filter),
    Investment.find(filter)
      .populate('user', 'name email mobileNumber referralCode')
      .sort({ createdAt: -1 })
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
 * Administratively activate a pending investment contract.
 * Gated by INVESTMENT_ACTIVATION_ENABLED fail-safe flag.
 * Prevents self-activation and duplicate activations.
 * 
 * @param {string|mongoose.Types.ObjectId} adminUserId Authenticated admin user ID
 * @param {string} investmentId Target investment ObjectId
 * @returns {Promise<object>} Updated active investment document
 */
const activateInvestment = async (adminUserId, investmentId) => {
  // 1. Fail-Safe Production Safety Gate
  if (!env.investmentActivationEnabled) {
    const error = new Error(
      'Administrative activation of investment contracts is disabled by policy (INVESTMENT_ACTIVATION_ENABLED=false). ' +
      'Illustrative technical package rates require formal executive and commercial ratification prior to production activation.'
    );
    error.statusCode = 403;
    throw error;
  }

  // 2. Fetch target investment to inspect ownership and current state
  const investment = await Investment.findById(investmentId);
  if (!investment) {
    const error = new Error('Investment not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. Separation of Duties: Prevent admin from activating their own investment
  if (investment.user.toString() === adminUserId.toString()) {
    const error = new Error('Forbidden: Administrators are not permitted to activate or approve their own investment requests.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Validate current lifecycle state
  if (investment.status !== 'pending') {
    const error = new Error(
      `Cannot activate investment: current status is "${investment.status}". Only "pending" investments can be activated.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Calculate operational dates based on server plan duration
  const plan = findPlan(investment.planName);
  const durationDays = plan?.durationDays || 30;
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // 6. Atomic state transition with concurrency guard
  const updatedInvestment = await Investment.findOneAndUpdate(
    { _id: investmentId, status: 'pending' },
    {
      $set: {
        status: 'active',
        startDate,
        endDate,
        actionedBy: adminUserId,
        actionedAt: startDate
      }
    },
    { new: true }
  ).populate('user', 'name email mobileNumber referralCode');

  if (!updatedInvestment) {
    const error = new Error('Investment was already processed or modified by another concurrent transaction.');
    error.statusCode = 409;
    throw error;
  }

  return updatedInvestment;
};

/**
 * Administratively reject a pending investment contract with an auditable reason.
 * 
 * @param {string|mongoose.Types.ObjectId} adminUserId Authenticated admin user ID
 * @param {string} investmentId Target investment ObjectId
 * @param {string} reason Validated rejection explanation
 * @returns {Promise<object>} Updated cancelled investment document
 */
const rejectInvestment = async (adminUserId, investmentId, reason) => {
  // 1. Fetch target investment
  const investment = await Investment.findById(investmentId);
  if (!investment) {
    const error = new Error('Investment not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Validate current lifecycle state
  if (investment.status !== 'pending') {
    const error = new Error(
      `Cannot reject investment: current status is "${investment.status}". Only "pending" investments can be rejected.`
    );
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  // 3. Atomic state transition with concurrency guard
  const updatedInvestment = await Investment.findOneAndUpdate(
    { _id: investmentId, status: 'pending' },
    {
      $set: {
        status: 'cancelled',
        rejectionReason: reason,
        actionedBy: adminUserId,
        actionedAt: now
      }
    },
    { new: true }
  ).populate('user', 'name email mobileNumber referralCode');

  if (!updatedInvestment) {
    const error = new Error('Investment was already processed or modified by another concurrent transaction.');
    error.statusCode = 409;
    throw error;
  }

  return updatedInvestment;
};

module.exports = {
  createInvestment,
  getUserInvestments,
  getInvestmentById,
  getPlans,
  getAdminPendingInvestments,
  activateInvestment,
  rejectInvestment
};

