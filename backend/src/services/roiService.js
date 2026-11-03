const mongoose = require('mongoose');
const Investment = require('../models/Investment');
const ROIHistory = require('../models/ROIHistory');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const { validateRoiConfig } = require('../config/roiConfig');
const { findPlan } = require('../config/plans');
const { processRoiReferralCommissionsInSession } = require('./referralCommissionService');

/**
 * ROI Processing Service Layer
 * 
 * Implements the reusable daily Return on Investment (ROI) engine,
 * atomic MongoDB multi-document transactions, strict idempotency keys,
 * and user history/summary retrieval.
 */

/**
 * Checks whether the connected MongoDB deployment supports multi-document transactions.
 * Multi-document transactions require a replica set or sharded cluster.
 * 
 * @returns {Promise<boolean>}
 */
const supportsTransactions = async () => {
  if (!mongoose.connection || !mongoose.connection.db) {
    return false;
  }
  try {
    const adminDb = mongoose.connection.db.admin();
    const hello = await adminDb.command({ hello: 1 });
    return Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch (err) {
    return false;
  }
};

/**
 * Normalizes any Date or date string to the configured business timezone (Asia/Kolkata).
 * Returns:
 * - dateKey: 'YYYY-MM-DD' string representation in business timezone
 * - normalizedUtcMidnight: Date object normalized to 00:00:00.000 UTC
 * - startOfBusinessDay: Exact start instant of that calendar day
 * - endOfBusinessDay: Exact end instant of that calendar day
 * 
 * @param {Date|string} [dateInput] Target business date
 * @param {string} [timeZone='Asia/Kolkata'] Timezone identifier
 * @returns {object} Normalized date descriptors
 */
const normalizeBusinessDate = (dateInput, timeZone = 'Asia/Kolkata') => {
  let targetDate;
  if (!dateInput) {
    targetDate = new Date();
  } else if (dateInput instanceof Date) {
    targetDate = dateInput;
  } else {
    targetDate = new Date(dateInput);
  }

  if (isNaN(targetDate.getTime())) {
    throw new Error(`Invalid business date provided: "${dateInput}". Must be a valid ISO Date.`);
  }

  // Format as YYYY-MM-DD in the designated business timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const dateKey = formatter.format(targetDate); // 'YYYY-MM-DD'

  // Construct UTC midnight date representing this business date
  const normalizedUtcMidnight = new Date(`${dateKey}T00:00:00.000Z`);

  // Window boundaries for that business day:
  // Starts at dateKey 00:00:00 in UTC (for query boundary) and ends at 23:59:59.999 UTC
  const startOfBusinessDay = new Date(`${dateKey}T00:00:00.000Z`);
  const endOfBusinessDay = new Date(`${dateKey}T23:59:59.999Z`);

  return {
    dateKey,
    normalizedUtcMidnight,
    startOfBusinessDay,
    endOfBusinessDay
  };
};

/**
 * Calculates daily ROI in integer paise based on principal and daily percentage.
 * 
 * Mathematical Formula:
 * rawPaise = (principalAmountPaise * roiPercentage) / 100
 * result = applyRounding(rawPaise, roundingMode)
 * 
 * @param {number} principalAmountPaise Principal investment amount in paise (integer >= 0)
 * @param {number} roiPercentage Daily ROI percentage (number >= 0)
 * @param {string} [roundingMode='FLOOR'] Rounding policy ('FLOOR', 'ROUND', 'CEIL')
 * @returns {number} Calculated daily ROI in non-negative integer paise
 */
const calculateDailyRoiPaise = (principalAmountPaise, roiPercentage, roundingMode = 'FLOOR') => {
  if (!Number.isInteger(principalAmountPaise) || principalAmountPaise < 0) {
    throw new Error(`Invalid principal amount: "${principalAmountPaise}". Must be non-negative integer paise.`);
  }

  if (typeof roiPercentage !== 'number' || isNaN(roiPercentage) || roiPercentage < 0) {
    throw new Error(`Invalid ROI percentage: "${roiPercentage}". Must be a non-negative number.`);
  }

  // Exact fractional paise before rounding
  const rawPaise = (principalAmountPaise * roiPercentage) / 100;

  let calculatedPaise;
  if (roundingMode === 'ROUND') {
    calculatedPaise = Math.round(rawPaise);
  } else if (roundingMode === 'CEIL') {
    calculatedPaise = Math.ceil(rawPaise);
  } else {
    // Default to 'FLOOR' (truncate fractional paise to ensure platform solvency)
    calculatedPaise = Math.floor(rawPaise);
  }

  if (!Number.isInteger(calculatedPaise) || calculatedPaise < 0) {
    throw new Error(`Calculated ROI resulted in an invalid amount: ${calculatedPaise}`);
  }

  return calculatedPaise;
};

/**
 * Validates that an investment has an approved server-side plan rate and is not forged.
 * 
 * @param {object} investment Investment document
 * @returns {number} Authorized daily ROI percentage
 */
const resolveAuthorizedRoiPercentage = (investment) => {
  if (!investment.planName || typeof investment.roiPercentage !== 'number') {
    throw new Error(`Investment ${investment._id} is missing planName or roiPercentage.`);
  }

  // Cross-reference with authoritative server-side plan registry
  const serverPlan = findPlan(investment.planName);
  if (!serverPlan) {
    throw new Error(
      `Investment ${investment._id} references unknown or unapproved plan: "${investment.planName}".`
    );
  }

  if (serverPlan.roiPercentage !== investment.roiPercentage) {
    throw new Error(
      `Investment ${investment._id} rate mismatch: stored ${investment.roiPercentage}%, but approved plan "${serverPlan.name}" specifies ${serverPlan.roiPercentage}%.`
    );
  }

  return investment.roiPercentage;
};

/**
 * Checks if an investment is eligible for ROI accrual on the specified business date.
 * 
 * Eligibility Criteria:
 * 1. Status must be in ALLOWED_INVESTMENT_STATUSES (e.g. 'active').
 * 2. startDate must be on or before the end of the business day.
 * 3. endDate must be null (indefinite) or on/after the start of the business day.
 * 
 * @param {object} investment
 * @param {object} dateContext
 * @param {string[]} allowedStatuses
 * @returns {{ isEligible: boolean, reason?: string }}
 */
const checkInvestmentEligibility = (investment, dateContext, allowedStatuses) => {
  if (!allowedStatuses.includes(investment.status)) {
    return { isEligible: false, reason: `Status is "${investment.status}" (must be in [${allowedStatuses.join(', ')}])` };
  }

  const startDate = new Date(investment.startDate);
  if (startDate > dateContext.endOfBusinessDay) {
    return { isEligible: false, reason: `Investment start date (${startDate.toISOString()}) is in the future relative to business date.` };
  }

  if (investment.endDate) {
    const endDate = new Date(investment.endDate);
    if (endDate < dateContext.startOfBusinessDay) {
      return { isEligible: false, reason: `Investment end date (${endDate.toISOString()}) has elapsed before business date.` };
    }
  }

  return { isEligible: true };
};

/**
 * Core Daily ROI Processing Engine
 * 
 * Processes eligible active investments for a given business date using:
 * - Batched cursor iteration.
 * - Multi-document atomic transactions.
 * - Idempotency enforcement via unique keys and database indexes.
 * - Audit ledger updates (WalletTransaction & cumulative investment updates).
 * 
 * @param {Date|string} [businessDateInput] Optional business date (defaults to today in Asia/Kolkata)
 * @param {object} [options={}] Optional overrides (e.g. customRules, batchSize)
 * @returns {Promise<object>} Processing summary
 */
const processDailyROI = async (businessDateInput, options = {}) => {
  // 1. Validate business rules configuration
  const config = validateRoiConfig(options.customRules || {});

  // 2. Verify MongoDB transaction support
  const hasTxSupport = await supportsTransactions();
  if (!hasTxSupport) {
    throw new Error(
      'MongoDB deployment does not support multi-document transactions. ' +
      'ROI processing requires a replica set or sharded cluster to ensure atomic financial updates ' +
      'across ROI history, investments, user balances, and ledger transactions. ' +
      'To enable transactions locally, configure MongoDB as a single-node replica set (mongod --replSet rs0). ' +
      'Non-transactional processing is rejected to preserve ledger consistency.'
    );
  }

  // 3. Normalize business date
  const dateContext = normalizeBusinessDate(businessDateInput, config.TIMEZONE);
  const { dateKey, normalizedUtcMidnight, startOfBusinessDay, endOfBusinessDay } = dateContext;

  // 4. Build query for eligible investments
  const eligibilityQuery = {
    status: { $in: config.ALLOWED_INVESTMENT_STATUSES },
    startDate: { $lte: endOfBusinessDay },
    $or: [
      { endDate: null },
      { endDate: { $gte: startOfBusinessDay } }
    ]
  };

  const totalEligible = await Investment.countDocuments(eligibilityQuery);

  const summary = {
    businessDate: dateKey,
    normalizedBusinessDate: normalizedUtcMidnight.toISOString(),
    eligibleInvestments: totalEligible,
    processedInvestments: 0,
    skippedInvestments: 0,
    failedInvestments: 0,
    totalRoiGeneratedPaise: 0,
    failures: []
  };

  if (totalEligible === 0) {
    return summary;
  }

  // 5. Stream active investments in configurable batches
  const batchSize = options.batchSize || config.batchSize;
  let skip = 0;

  while (skip < totalEligible) {
    const investmentsBatch = await Investment.find(eligibilityQuery)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(batchSize)
      .lean();

    if (!investmentsBatch || investmentsBatch.length === 0) {
      break;
    }

    for (const investment of investmentsBatch) {
      // 5a. Double check eligibility boundaries
      const eligibility = checkInvestmentEligibility(investment, dateContext, config.ALLOWED_INVESTMENT_STATUSES);
      if (!eligibility.isEligible) {
        summary.skippedInvestments += 1;
        continue;
      }

      // 5b. Check idempotency pre-condition (quick check before opening transaction)
      const existingRecord = await ROIHistory.findOne({
        investment: investment._id,
        businessDate: normalizedUtcMidnight
      }).select('_id status').lean();

      if (existingRecord) {
        summary.skippedInvestments += 1;
        continue;
      }

      // 5c. Resolve approved ROI percentage
      let roiPercentage;
      try {
        roiPercentage = resolveAuthorizedRoiPercentage(investment);
      } catch (err) {
        summary.failedInvestments += 1;
        summary.failures.push({
          investmentId: investment._id.toString(),
          reason: err.message
        });
        continue;
      }

      // 5d. Calculate daily ROI paise
      let roiAmountPaise;
      try {
        roiAmountPaise = calculateDailyRoiPaise(
          investment.principalAmountPaise,
          roiPercentage,
          config.ROUNDING_MODE
        );
      } catch (err) {
        summary.failedInvestments += 1;
        summary.failures.push({
          investmentId: investment._id.toString(),
          reason: err.message
        });
        continue;
      }

      // 5e. Execute atomic multi-document transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const roiTransactionKey = `roi_${investment._id}_${dateKey}`;
        const walletTransactionKey = `wallet_roi_${investment._id}_${dateKey}`;

        // 1. Create ROIHistory entry
        const roiDoc = new ROIHistory({
          user: investment.user,
          investment: investment._id,
          amountPaise: roiAmountPaise,
          roiPercentageApplied: roiPercentage,
          businessDate: normalizedUtcMidnight,
          status: 'processed',
          transactionKey: roiTransactionKey
        });
        await roiDoc.save({ session });

        // 2. Update Investment cumulative ROI total
        await Investment.findByIdAndUpdate(
          investment._id,
          { $inc: { totalRoiEarnedPaise: roiAmountPaise } },
          { session }
        );

        // 3. Atomically credit User wallet and create ledger entry (if configured)
        if (config.CREDIT_WALLET_IMMEDIATELY && roiAmountPaise > 0) {
          // Increment user's wallet balance
          await User.findByIdAndUpdate(
            investment.user,
            { $inc: { walletBalancePaise: roiAmountPaise } },
            { session }
          );

          // Write immutable WalletTransaction ledger row
          const walletDoc = new WalletTransaction({
            user: investment.user,
            type: 'credit',
            amountPaise: roiAmountPaise,
            sourceType: 'roi',
            sourceId: roiDoc._id,
            transactionKey: walletTransactionKey,
            description: `Daily ROI payout (${roiPercentage}%) for plan "${investment.planName}" on ${dateKey}`
          });
          await walletDoc.save({ session });
        }

        // 4. Atomically process referral commissions if configured for ROI_PAYOUT trigger
        const sourceUser = await User.findById(investment.user).select('name email referralCode referredBy isActive').lean();
        if (sourceUser) {
          await processRoiReferralCommissionsInSession({
            roiDoc,
            sourceInvestment: investment,
            sourceUser,
            session,
            customRules: options.referralCustomRules || {}
          });
        }

        await session.commitTransaction();

        summary.processedInvestments += 1;
        summary.totalRoiGeneratedPaise += roiAmountPaise;
      } catch (txError) {
        await session.abortTransaction();

        // Check if duplicate key violation (code 11000) or concurrent write conflict occurred
        const isDuplicateOrConflict =
          txError.code === 11000 ||
          txError.code === 112 || // WriteConflict in MongoDB transaction
          txError.message?.includes('duplicate key') ||
          txError.message?.includes('E11000') ||
          txError.message?.includes('WriteConflict') ||
          (Array.isArray(txError.errorLabels) && txError.errorLabels.includes('TransientTransactionError'));

        if (isDuplicateOrConflict) {
          summary.skippedInvestments += 1;
        } else {
          summary.failedInvestments += 1;
          summary.failures.push({
            investmentId: investment._id.toString(),
            reason: txError.message
          });
        }
      } finally {
        session.endSession();
      }
    }

    skip += investmentsBatch.length;
  }

  return summary;
};

/**
 * Retrieve paginated ROI history records for an authenticated user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId Authenticated user ID
 * @param {object} [queryOptions={}] Filters (page, limit, status, startDate, endDate, investmentId)
 * @returns {Promise<object>} Paginated ROI history
 */
const getUserRoiHistory = async (userId, queryOptions = {}) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const page = parseInt(queryOptions.page, 10) || 1;
  const limit = parseInt(queryOptions.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: userObjectId };

  if (queryOptions.status) {
    filter.status = queryOptions.status;
  }

  if (queryOptions.investmentId) {
    filter.investment = new mongoose.Types.ObjectId(queryOptions.investmentId);
  }

  if (queryOptions.startDate || queryOptions.endDate) {
    filter.businessDate = {};
    if (queryOptions.startDate) {
      filter.businessDate.$gte = new Date(queryOptions.startDate);
    }
    if (queryOptions.endDate) {
      filter.businessDate.$lte = new Date(queryOptions.endDate);
    }
  }

  const [totalRecords, roiRecords] = await Promise.all([
    ROIHistory.countDocuments(filter),
    ROIHistory.find(filter)
      .sort({ businessDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('investment', 'planName principalAmountPaise status startDate endDate')
      .lean()
  ]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  return {
    roiRecords,
    pagination: {
      totalRecords,
      currentPage: page,
      totalPages,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Retrieve aggregated ROI summary statistics for an authenticated user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId Authenticated user ID
 * @returns {Promise<object>} ROI summary statistics
 */
const getUserRoiSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [aggregateResult, statusCounts, latestRecord] = await Promise.all([
    // Sum only processed ROI amounts
    ROIHistory.aggregate([
      { $match: { user: userObjectId, status: 'processed' } },
      {
        $group: {
          _id: null,
          totalProcessedRoiPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 }
        }
      }
    ]),

    // Count records by status
    ROIHistory.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Find the latest processed payout
    ROIHistory.findOne({ user: userObjectId, status: 'processed' })
      .sort({ businessDate: -1 })
      .select('businessDate amountPaise')
      .lean()
  ]);

  const totalProcessedRoiPaise = aggregateResult[0]?.totalProcessedRoiPaise || 0;
  const processedCount = aggregateResult[0]?.count || 0;

  let pendingCount = 0;
  let failedCount = 0;

  statusCounts.forEach((s) => {
    if (s._id === 'pending') pendingCount = s.count;
    if (s._id === 'failed') failedCount = s.count;
  });

  return {
    totalProcessedRoiPaise,
    processedCount,
    pendingCount,
    failedCount,
    totalRecords: processedCount + pendingCount + failedCount,
    latestPayout: latestRecord
      ? {
          businessDate: latestRecord.businessDate,
          amountPaise: latestRecord.amountPaise
        }
      : null
  };
};

module.exports = {
  supportsTransactions,
  normalizeBusinessDate,
  calculateDailyRoiPaise,
  resolveAuthorizedRoiPercentage,
  checkInvestmentEligibility,
  processDailyROI,
  getUserRoiHistory,
  getUserRoiSummary
};
