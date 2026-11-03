const mongoose = require('mongoose');
const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');

/**
 * Referral Service Layer
 * Encapsulates direct referral listings, hierarchical breadth-first tree traversal,
 * cycle protection, and referral income auditing.
 */

/**
 * Retrieve paginated direct referrals (level 1 downline only).
 * 
 * @param {string|mongoose.Types.ObjectId} userId Authenticated sponsor ID
 * @param {object} [options={}] Pagination options (page, limit)
 * @returns {Promise<{ referrals: Array, pagination: object }>}
 */
const getDirectReferrals = async (userId, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  // Strict query: direct referrals only (where referredBy === userId)
  const filter = { referredBy: userId };

  const [totalRecords, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('_id name referralCode isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  const referrals = users.map((u) => ({
    id: u._id,
    name: u.name,
    referralCode: u.referralCode,
    isActive: u.isActive,
    createdAt: u.createdAt
  }));

  const pagination = {
    currentPage: page,
    pageSize: limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  return {
    referrals,
    pagination
  };
};

/**
 * Traverse and construct the complete multi-tier referral tree starting from rootUser.
 * Uses an efficient breadth-first batched query approach (1 database query per level)
 * with strict cycle detection and a configurable safety depth limit.
 * 
 * @param {object} rootUser Authenticated user document/object
 * @param {object} [options={}] Traversal options (maxDepth)
 * @returns {Promise<{ tree: object, metadata: object }>}
 */
const getReferralTree = async (rootUser, options = {}) => {
  const maxDepth = options.maxDepth || 5;
  const rootId = (rootUser._id || rootUser.id).toString();

  const rootNode = {
    userId: rootId,
    name: rootUser.name,
    referralCode: rootUser.referralCode,
    isActive: rootUser.isActive,
    level: 0,
    children: []
  };

  // Set to detect and prevent infinite loops / cycles
  const visited = new Set([rootId]);
  let currentLevelParents = [rootNode];
  let currentDepth = 0;
  let hasMoreLevels = false;
  let totalMembers = 0;

  // Traverse level-by-level using batch queries
  while (currentLevelParents.length > 0 && currentDepth < maxDepth) {
    const parentMap = new Map();
    const parentIds = [];

    for (const parent of currentLevelParents) {
      parentMap.set(parent.userId, parent);
      parentIds.push(new mongoose.Types.ObjectId(parent.userId));
    }

    // Single batch query for the entire generation level (Zero N+1 query issue)
    const children = await User.find({
      referredBy: { $in: parentIds }
    })
      .select('_id name referralCode isActive referredBy createdAt')
      .sort({ createdAt: -1 })
      .lean();

    if (children.length === 0) {
      break;
    }

    currentDepth++;
    const nextLevelParents = [];

    for (const child of children) {
      const childId = child._id.toString();
      const parentId = child.referredBy ? child.referredBy.toString() : null;

      // Cycle detection: skip already visited nodes to prevent cyclic loops
      if (!parentId || visited.has(childId)) {
        continue;
      }

      visited.add(childId);
      totalMembers++;

      const childNode = {
        userId: childId,
        name: child.name,
        referralCode: child.referralCode,
        isActive: child.isActive,
        level: currentDepth,
        createdAt: child.createdAt,
        children: []
      };

      const parentNode = parentMap.get(parentId);
      if (parentNode) {
        parentNode.children.push(childNode);
      }

      nextLevelParents.push(childNode);
    }

    currentLevelParents = nextLevelParents;
  }

  // Check if deeper downlines exist past the safety limit
  if (currentDepth === maxDepth && currentLevelParents.length > 0) {
    const deeperParentIds = currentLevelParents.map(
      (p) => new mongoose.Types.ObjectId(p.userId)
    );
    const deeperCount = await User.countDocuments({
      referredBy: { $in: deeperParentIds }
    });
    if (deeperCount > 0) {
      hasMoreLevels = true;
    }
  }

  return {
    tree: rootNode,
    metadata: {
      traversalDepth: currentDepth,
      maxTraversalDepth: maxDepth,
      totalMembers,
      hasMoreLevels
    }
  };
};

/**
 * Retrieve referral income records earned by the authenticated beneficiary.
 * 
 * @param {string|mongoose.Types.ObjectId} userId Authenticated beneficiary ID
 * @param {object} [options={}] Filter and pagination options
 * @returns {Promise<{ incomeRecords: Array, summary: object, pagination: object }>}
 */
const getReferralIncome = async (userId, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Strict isolation filter: beneficiary must match authenticated user
  const filter = { beneficiary: userObjectId };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.startDate || options.endDate) {
    filter.createdAt = {};
    if (options.startDate) {
      filter.createdAt.$gte = new Date(options.startDate);
    }
    if (options.endDate) {
      filter.createdAt.$lte = new Date(options.endDate);
    }
  }

  // Execute summary aggregation, count, and paginated query in parallel
  const [summaryStats, totalRecords, records] = await Promise.all([
    // Aggregate income by status for beneficiary
    ReferralIncome.aggregate([
      { $match: { beneficiary: userObjectId } },
      {
        $group: {
          _id: '$status',
          totalAmountPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 }
        }
      }
    ]),

    // Total records matching current filter
    ReferralIncome.countDocuments(filter),

    // Paginated records with safe sourceUser projection
    ReferralIncome.find(filter)
      .populate('sourceUser', 'name email referralCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;

  // Process separate summary totals
  const summary = {
    processedIncomePaise: 0,
    pendingIncomePaise: 0,
    failedIncomePaise: 0,
    totalIncomePaise: 0
  };

  summaryStats.forEach((item) => {
    if (item._id === 'processed') {
      summary.processedIncomePaise = item.totalAmountPaise;
    } else if (item._id === 'pending') {
      summary.pendingIncomePaise = item.totalAmountPaise;
    } else if (item._id === 'failed') {
      summary.failedIncomePaise = item.totalAmountPaise;
    }
    summary.totalIncomePaise += item.totalAmountPaise;
  });

  // Map safe representation of records
  const incomeRecords = records.map((rec) => ({
    id: rec._id,
    amountPaise: rec.amountPaise,
    level: rec.level,
    percentageApplied: rec.percentageApplied,
    status: rec.status,
    sourceInvestment: rec.sourceInvestment,
    sourceUser: rec.sourceUser
      ? {
          id: rec.sourceUser._id,
          name: rec.sourceUser.name,
          email: rec.sourceUser.email,
          referralCode: rec.sourceUser.referralCode
        }
      : null,
    transactionKey: rec.transactionKey,
    createdAt: rec.createdAt
  }));

  const pagination = {
    currentPage: page,
    pageSize: limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  return {
    incomeRecords,
    summary,
    pagination
  };
};

module.exports = {
  getDirectReferrals,
  getReferralTree,
  getReferralIncome
};

