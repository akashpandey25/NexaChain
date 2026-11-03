const mongoose = require('mongoose');
const User = require('../models/User');
const Investment = require('../models/Investment');
const ReferralIncome = require('../models/ReferralIncome');
const WalletTransaction = require('../models/WalletTransaction');
const ROIHistory = require('../models/ROIHistory');
const { validateReferralCommissionConfig } = require('../config/referralCommissionConfig');

/**
 * Multi-Level Referral Commission Service Layer
 * 
 * Implements the reusable referral commission processing engine:
 * - Traversing upline ancestors up to the configured business maximum.
 * - Enforcing cycle detection to break corrupted/circular relationships.
 * - Calculating commission in integer paise via BigInt and basis points.
 * - Multi-document atomic transactions across ReferralIncome, User wallet, and WalletTransaction.
 * - Strict idempotency keys preventing double payouts.
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
 * Pure calculation function for multi-level referral commissions.
 * 
 * Formula:
 * CommissionPaise = floor(BasisAmountPaise * RateBasisPoints / 10000)
 * 
 * Uses BigInt integer arithmetic to prevent IEEE-754 64-bit float precision errors.
 * 
 * @param {number} basisAmountPaise Financial basis in integer paise (>= 0)
 * @param {number} rateBps Commission rate in basis points (0 to 10000, where 100 bps = 1.0%)
 * @param {string} [roundingMode='FLOOR'] Fractional paise rounding mode ('FLOOR', 'ROUND', 'CEIL')
 * @returns {number} Calculated commission in integer paise
 */
const calculateCommissionPaise = (basisAmountPaise, rateBps, roundingMode = 'FLOOR') => {
  if (!Number.isInteger(basisAmountPaise) || basisAmountPaise < 0) {
    throw new Error(`Invalid basis amount: "${basisAmountPaise}". Must be non-negative integer paise.`);
  }

  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10000) {
    throw new Error(`Invalid rate in basis points: "${rateBps}". Must be integer between 0 and 10000.`);
  }

  if (basisAmountPaise === 0 || rateBps === 0) {
    return 0;
  }

  const numerator = BigInt(basisAmountPaise) * BigInt(rateBps);
  const divisor = 10000n;
  const quotient = numerator / divisor;
  const remainder = numerator % divisor;

  let resultPaise = Number(quotient);

  if (remainder > 0n) {
    if (roundingMode === 'ROUND') {
      // Round-half-up: if remainder >= 5000n (0.5 paise), round up
      if (remainder >= 5000n) {
        resultPaise += 1;
      }
    } else if (roundingMode === 'CEIL') {
      resultPaise += 1;
    }
    // Default 'FLOOR': truncate fractional paise to maintain strict solvency
  }

  return resultPaise;
};

/**
 * Resolves a trusted source event from the database based on the configured trigger and basis.
 * 
 * @param {object} sourceEventInput Event descriptor { type, investmentId?, roiHistoryId? } or document
 * @param {object} config Validated referral commission configuration
 * @returns {Promise<object>} Resolved source event details
 */
const resolveSourceEvent = async (sourceEventInput, config) => {
  if (!sourceEventInput || typeof sourceEventInput !== 'object') {
    throw new Error('Invalid source event provided: Must be a non-null object.');
  }

  const triggerType = sourceEventInput.type || config.TRIGGER_EVENT;

  if (triggerType !== config.TRIGGER_EVENT) {
    throw new Error(
      `Source event type mismatch: Received "${triggerType}", but configured TRIGGER_EVENT is "${config.TRIGGER_EVENT}".`
    );
  }

  if (config.TRIGGER_EVENT === 'INVESTMENT_ACTIVATION') {
    const investmentId = sourceEventInput.investmentId || sourceEventInput._id;
    if (!investmentId) {
      throw new Error('INVESTMENT_ACTIVATION event requires a valid investmentId.');
    }

    const investment = await Investment.findById(investmentId).lean();
    if (!investment) {
      throw new Error(`Investment with ID "${investmentId}" not found in database.`);
    }

    if (!config.ELIGIBLE_SOURCE_STATUSES.includes(investment.status)) {
      throw new Error(
        `Investment ${investment._id} is in status "${investment.status}", which is not eligible for commission processing.`
      );
    }

    const sourceUser = await User.findById(investment.user).select('name email referralCode referredBy isActive').lean();
    if (!sourceUser) {
      throw new Error(`Source user ${investment.user} for investment ${investment._id} not found.`);
    }

    let basisAmountPaise;
    if (config.CALCULATION_BASIS === 'INVESTMENT_PRINCIPAL') {
      basisAmountPaise = investment.principalAmountPaise;
    } else {
      throw new Error(
        `Configured CALCULATION_BASIS "${config.CALCULATION_BASIS}" is incompatible with INVESTMENT_ACTIVATION trigger.`
      );
    }

    return {
      sourceEventId: investment._id,
      sourceInvestment: investment,
      sourceUser,
      basisAmountPaise,
      eventType: 'INVESTMENT_ACTIVATION'
    };
  }

  if (config.TRIGGER_EVENT === 'ROI_PAYOUT') {
    const roiHistoryId = sourceEventInput.roiHistoryId || sourceEventInput._id;
    if (!roiHistoryId) {
      throw new Error('ROI_PAYOUT event requires a valid roiHistoryId.');
    }

    const roiRecord = await ROIHistory.findById(roiHistoryId).lean();
    if (!roiRecord) {
      throw new Error(`ROIHistory record with ID "${roiHistoryId}" not found in database.`);
    }

    if (!config.ELIGIBLE_SOURCE_STATUSES.includes(roiRecord.status)) {
      throw new Error(
        `ROIHistory record ${roiRecord._id} is in status "${roiRecord.status}", which is not eligible for commission processing.`
      );
    }

    const investment = await Investment.findById(roiRecord.investment).lean();
    if (!investment) {
      throw new Error(`Associated Investment ${roiRecord.investment} not found.`);
    }

    const sourceUser = await User.findById(roiRecord.user).select('name email referralCode referredBy isActive').lean();
    if (!sourceUser) {
      throw new Error(`Source user ${roiRecord.user} not found.`);
    }

    let basisAmountPaise;
    if (config.CALCULATION_BASIS === 'ROI_AMOUNT') {
      basisAmountPaise = roiRecord.amountPaise;
    } else if (config.CALCULATION_BASIS === 'INVESTMENT_PRINCIPAL') {
      basisAmountPaise = investment.principalAmountPaise;
    } else {
      throw new Error(
        `Unsupported CALCULATION_BASIS "${config.CALCULATION_BASIS}" for ROI_PAYOUT trigger.`
      );
    }

    return {
      sourceEventId: roiRecord._id,
      sourceInvestment: investment,
      sourceUser,
      roiRecord,
      basisAmountPaise,
      eventType: 'ROI_PAYOUT'
    };
  }

  throw new Error(`Unsupported TRIGGER_EVENT: "${config.TRIGGER_EVENT}"`);
};

/**
 * Traverses upline referral ancestors starting from the direct referrer (Level 1).
 * Detects cycles using a Set of visited IDs and halts at maxLevels or when no parent exists.
 * 
 * @param {object} sourceUser The user whose activity generated the event
 * @param {number} maxLevels Maximum business levels to traverse
 * @param {boolean} requireActive Whether inactive users are flagged as ineligible
 * @returns {Promise<Array<{ user: object, level: number, isEligible: boolean, skipReason?: string }>>}
 */
const traverseReferralAncestors = async (sourceUser, maxLevels, requireActive = true) => {
  const ancestors = [];
  const visited = new Set([sourceUser._id.toString()]);
  let currentUser = sourceUser;

  for (let level = 1; level <= maxLevels; level++) {
    if (!currentUser.referredBy) {
      // Reached top of network; no further ancestor
      break;
    }

    const parentId = currentUser.referredBy.toString();

    // Cycle detection: prevent infinite traversal if circular references exist
    if (visited.has(parentId)) {
      break;
    }
    visited.add(parentId);

    const parentUser = await User.findById(parentId)
      .select('name email referralCode referredBy isActive walletBalancePaise')
      .lean();

    if (!parentUser) {
      // Broken reference in legacy data
      break;
    }

    let isEligible = true;
    let skipReason = null;

    if (requireActive && !parentUser.isActive) {
      isEligible = false;
      skipReason = 'Beneficiary account is inactive';
    }

    ancestors.push({
      user: parentUser,
      level,
      isEligible,
      skipReason
    });

    currentUser = parentUser;
  }

  return ancestors;
};

/**
 * Core Multi-Level Referral Commission Processing Engine.
 * 
 * Orchestrates:
 * 1. Source event verification and financial basis resolution.
 * 2. Upline network traversal up to MAX_ELIGIBLE_LEVELS.
 * 3. Rate determination in basis points per generational tier.
 * 4. Atomic multi-document transaction execution (ReferralIncome, User balance, WalletTransaction).
 * 5. Deterministic idempotency key deduplication.
 * 
 * @param {object} sourceEventInput Source event payload or Mongoose document
 * @param {object} [options={}] Overrides (e.g. customRules)
 * @returns {Promise<object>} Processing execution summary
 */
const processReferralCommissions = async (sourceEventInput, options = {}) => {
  // 1. Validate configuration
  const config = validateReferralCommissionConfig(options.customRules || {});

  // 2. Verify MongoDB transaction capability
  const hasTxSupport = await supportsTransactions();
  if (!hasTxSupport) {
    throw new Error(
      'MongoDB deployment does not support multi-document transactions. ' +
      'Referral commission processing requires a replica set or sharded cluster to ensure atomic ' +
      'updates across referral income ledgers, user balances, and wallet transactions. ' +
      'To enable transactions locally, configure MongoDB as a single-node replica set (mongod --replSet rs0). ' +
      'Non-transactional commission distribution is rejected to preserve ledger consistency.'
    );
  }

  // 3. Resolve source event and financial basis
  const resolvedEvent = await resolveSourceEvent(sourceEventInput, config);
  const { sourceEventId, sourceInvestment, sourceUser, basisAmountPaise, eventType } = resolvedEvent;

  const summary = {
    sourceEventId: sourceEventId.toString(),
    sourceUserId: sourceUser._id.toString(),
    sourceInvestmentId: sourceInvestment._id.toString(),
    triggerEvent: config.TRIGGER_EVENT,
    calculationBasis: config.CALCULATION_BASIS,
    basisAmountPaise,
    ancestorsEvaluated: 0,
    commissionsGenerated: 0,
    commissionsSkipped: 0,
    commissionsFailed: 0,
    totalCommissionPaise: 0,
    commissions: [],
    failures: []
  };

  if (basisAmountPaise <= 0) {
    return summary;
  }

  // 4. Traverse upline ancestors up to max eligible levels
  const ancestors = await traverseReferralAncestors(
    sourceUser,
    config.MAX_ELIGIBLE_LEVELS,
    config.REQUIRE_ACTIVE_BENEFICIARY
  );
  summary.ancestorsEvaluated = ancestors.length;

  if (ancestors.length === 0) {
    return summary;
  }

  // 5. Execute commission generation across all eligible ancestors inside a single atomic transaction
  // This guarantees that all levels succeed together, preventing partially credited commissions.
  const eventPrefix = eventType === 'INVESTMENT_ACTIVATION' ? 'inv' : 'roi';

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const commissionStatus = config.CREDIT_WALLET_IMMEDIATELY ? 'processed' : 'pending';
    const pendingCommissions = [];
    let batchSkipped = 0;

    for (const ancestor of ancestors) {
      const { user: beneficiary, level, isEligible } = ancestor;

      // Ineligible beneficiary (e.g. suspended/inactive)
      if (!isEligible) {
        batchSkipped += 1;
        continue;
      }

      // Check if commission rate is defined for this level
      const rateBps = config.LEVEL_RATES_BPS[level];
      if (typeof rateBps !== 'number' || rateBps <= 0) {
        batchSkipped += 1;
        continue;
      }

      // Calculate commission in integer paise
      const commissionPaise = calculateCommissionPaise(basisAmountPaise, rateBps, config.ROUNDING_MODE);
      if (commissionPaise <= 0) {
        batchSkipped += 1;
        continue;
      }

      // Construct deterministic unique transaction keys
      const transactionKey = `ref_${eventPrefix}_${sourceEventId}_ben_${beneficiary._id}_lvl${level}`;
      const walletTransactionKey = `wallet_${transactionKey}`;

      // Check if record already exists (idempotency check inside transaction)
      const existingRecord = await ReferralIncome.findOne({ transactionKey }).session(session).lean();
      if (existingRecord) {
        batchSkipped += 1;
        continue;
      }

      // 1. Create ReferralIncome record
      const refIncomeDoc = new ReferralIncome({
        beneficiary: beneficiary._id,
        sourceUser: sourceUser._id,
        sourceInvestment: sourceInvestment._id,
        level,
        percentageApplied: rateBps / 100,
        amountPaise: commissionPaise,
        status: commissionStatus,
        transactionKey
      });
      await refIncomeDoc.save({ session });

      // 2. If immediate wallet crediting is enabled, update balance and ledger
      if (config.CREDIT_WALLET_IMMEDIATELY) {
        await User.findByIdAndUpdate(
          beneficiary._id,
          { $inc: { walletBalancePaise: commissionPaise } },
          { session }
        );

        const walletTxDoc = new WalletTransaction({
          user: beneficiary._id,
          type: 'credit',
          amountPaise: commissionPaise,
          sourceType: 'referral',
          sourceId: refIncomeDoc._id,
          transactionKey: walletTransactionKey,
          description: `Level ${level} referral commission (${rateBps / 100}%) from investment ${sourceInvestment._id}`
        });
        await walletTxDoc.save({ session });
      }

      pendingCommissions.push({
        referralIncomeId: refIncomeDoc._id.toString(),
        beneficiaryId: beneficiary._id.toString(),
        level,
        rateBps,
        percentageApplied: rateBps / 100,
        amountPaise: commissionPaise,
        status: commissionStatus
      });
    }

    await session.commitTransaction();

    summary.commissionsGenerated = pendingCommissions.length;
    summary.commissionsSkipped = batchSkipped;
    summary.totalCommissionPaise = pendingCommissions.reduce((acc, c) => acc + c.amountPaise, 0);
    summary.commissions = pendingCommissions;
  } catch (txError) {
    await session.abortTransaction();

    // Check if duplicate key (code 11000) or concurrent WriteConflict occurred
    const isDuplicateOrConflict =
      txError.code === 11000 ||
      txError.code === 112 ||
      txError.message?.includes('duplicate key') ||
      txError.message?.includes('E11000') ||
      txError.message?.includes('WriteConflict') ||
      (Array.isArray(txError.errorLabels) && txError.errorLabels.includes('TransientTransactionError'));

    if (isDuplicateOrConflict) {
      summary.commissionsSkipped = ancestors.length;
    } else {
      summary.commissionsFailed = ancestors.length;
      summary.failures.push({
        reason: txError.message
      });
    }
  } finally {
    session.endSession();
  }

  return summary;
};

/**
 * Atomic helper to process referral commissions inside an existing MongoDB session transaction.
 * Invoked during processDailyROI when TRIGGER_EVENT === 'ROI_PAYOUT'.
 * 
 * @param {object} params { roiDoc, sourceInvestment, sourceUser, session, customRules }
 * @returns {Promise<object|null>}
 */
const processRoiReferralCommissionsInSession = async ({
  roiDoc,
  sourceInvestment,
  sourceUser,
  session,
  customRules = {}
}) => {
  const { BUSINESS_RULES } = require('../config/referralCommissionConfig');
  const rules = { ...BUSINESS_RULES, ...customRules };

  // Only proceed if commission processing is explicitly enabled with ROI_PAYOUT trigger
  if (!rules.IS_ENABLED || rules.TRIGGER_EVENT !== 'ROI_PAYOUT') {
    return null;
  }

  const config = validateReferralCommissionConfig(rules);
  const basisAmountPaise =
    config.CALCULATION_BASIS === 'ROI_AMOUNT'
      ? roiDoc.amountPaise
      : sourceInvestment.principalAmountPaise;

  if (basisAmountPaise <= 0) {
    return null;
  }

  const ancestors = await traverseReferralAncestors(
    sourceUser,
    config.MAX_ELIGIBLE_LEVELS,
    config.REQUIRE_ACTIVE_BENEFICIARY
  );

  const generatedCommissions = [];

  for (const ancestor of ancestors) {
    if (!ancestor.isEligible) continue;

    const rateBps = config.LEVEL_RATES_BPS[ancestor.level];
    if (typeof rateBps !== 'number' || rateBps <= 0) continue;

    const commissionPaise = calculateCommissionPaise(basisAmountPaise, rateBps, config.ROUNDING_MODE);
    if (commissionPaise <= 0) continue;

    const transactionKey = `ref_roi_${roiDoc._id}_ben_${ancestor.user._id}_lvl${ancestor.level}`;
    const walletTransactionKey = `wallet_${transactionKey}`;

    // Create ReferralIncome document with session
    const refIncomeDoc = new ReferralIncome({
      beneficiary: ancestor.user._id,
      sourceUser: sourceUser._id,
      sourceInvestment: sourceInvestment._id,
      level: ancestor.level,
      percentageApplied: rateBps / 100,
      amountPaise: commissionPaise,
      status: config.CREDIT_WALLET_IMMEDIATELY ? 'processed' : 'pending',
      transactionKey
    });
    await refIncomeDoc.save({ session });

    // Atomically credit wallet and create ledger row if enabled
    if (config.CREDIT_WALLET_IMMEDIATELY) {
      await User.findByIdAndUpdate(
        ancestor.user._id,
        { $inc: { walletBalancePaise: commissionPaise } },
        { session }
      );

      const walletTxDoc = new WalletTransaction({
        user: ancestor.user._id,
        type: 'credit',
        amountPaise: commissionPaise,
        sourceType: 'referral',
        sourceId: refIncomeDoc._id,
        transactionKey: walletTransactionKey,
        description: `Level ${ancestor.level} referral commission (${rateBps / 100}%) from ROI payout on ${sourceInvestment._id}`
      });
      await walletTxDoc.save({ session });
    }

    generatedCommissions.push({
      beneficiaryId: ancestor.user._id.toString(),
      level: ancestor.level,
      amountPaise: commissionPaise
    });
  }

  return generatedCommissions;
};

module.exports = {
  supportsTransactions,
  calculateCommissionPaise,
  resolveSourceEvent,
  traverseReferralAncestors,
  processReferralCommissions,
  processRoiReferralCommissionsInSession
};
