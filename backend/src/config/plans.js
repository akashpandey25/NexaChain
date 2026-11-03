/**
 * Server-Side Investment Plan Configuration Registry
 * 
 * NOTE: As required by the technical architecture, ROI percentages and plan configurations
 * must NEVER be determined by client inputs. This registry serves as the authoritative
 * server-side source of truth for authorized investment plans.
 */
const INVESTMENT_PLANS = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter Plan',
    roiPercentage: 1.0,
    durationDays: 30,
    description: 'Entry-level investment plan with 1.0% daily return for 30 days'
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth Plan',
    roiPercentage: 1.5,
    durationDays: 60,
    description: 'Mid-tier investment plan with 1.5% daily return for 60 days'
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium Plan',
    roiPercentage: 2.0,
    durationDays: 90,
    description: 'High-tier investment plan with 2.0% daily return for 90 days'
  }
};

/**
 * Find an authorized plan configuration by plan ID or plan Name (case-insensitive).
 * @param {string} identifier Plan key or plan name
 * @returns {object|null}
 */
const findPlan = (identifier) => {
  if (!identifier || typeof identifier !== 'string') return null;

  const normalized = identifier.trim().toUpperCase();

  // 1. Direct key match (e.g. 'STARTER')
  if (INVESTMENT_PLANS[normalized]) {
    return INVESTMENT_PLANS[normalized];
  }

  // 2. Name or ID match (case-insensitive)
  const found = Object.values(INVESTMENT_PLANS).find(
    (plan) =>
      plan.id.toUpperCase() === normalized ||
      plan.name.toUpperCase() === normalized
  );

  return found || null;
};

/**
 * Return list of all available plan names and IDs for error guidance.
 * @returns {string[]}
 */
const getAvailablePlanNames = () => {
  return Object.values(INVESTMENT_PLANS).map((p) => `"${p.name}" (${p.id})`);
};

module.exports = {
  INVESTMENT_PLANS,
  findPlan,
  getAvailablePlanNames
};

