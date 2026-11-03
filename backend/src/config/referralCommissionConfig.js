/**
 * Multi-Level Referral Commission Configuration Registry
 * 
 * Centralizes configurable business rules, commission triggers, calculation bases,
 * basis-point commission percentages, and operational parameters.
 * 
 * ARCHITECTURAL REQUIREMENTS:
 * - Distinguishes technical defaults (traversal recursion limits, batch limits)
 *   from financial business rules (rates, levels, triggers, eligibility).
 * - Never invents company-specific commission percentages or max levels.
 * - Missing or unapproved configuration disables commission processing safely.
 * - Uses integer basis points for commission rates:
 *     1% = 100 bps
 *     1.5% = 150 bps
 *     10% = 1000 bps
 *     100% = 10000 bps
 * - Truncates fractional paise using integer arithmetic.
 */

/**
 * Technical Defaults
 * Operational knobs that govern recursion safety, memory bounds, and execution limits.
 */
const TECHNICAL_DEFAULTS = {
  // Maximum recursion depth guard to protect against memory exhaustion or deep graph traversals
  MAX_TRAVERSAL_GUARD: 20,
  // Minimum level allowed
  MIN_LEVEL: 1
};

/**
 * Supported Business Options
 * Enumerates valid options without making assumptions about company business policy.
 */
const SUPPORTED_TRIGGER_EVENTS = ['INVESTMENT_ACTIVATION', 'ROI_PAYOUT'];
const SUPPORTED_CALCULATION_BASES = ['INVESTMENT_PRINCIPAL', 'ROI_AMOUNT'];
const SUPPORTED_ROUNDING_MODES = ['FLOOR', 'ROUND', 'CEIL'];

/**
 * Parses commission rate mappings from environment variable or returns null.
 * Expected JSON format: {"1": 500, "2": 300, "3": 100} (rates in basis points)
 */
const parseEnvRates = () => {
  if (!process.env.REFERRAL_COMMISSION_RATES_BPS) return null;
  try {
    const parsed = JSON.parse(process.env.REFERRAL_COMMISSION_RATES_BPS);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch (err) {
    return null;
  }
};

/**
 * Active Business Rules
 * By default, commission processing is DISABLED (`IS_ENABLED: false`) until
 * explicit company approval and production configuration is established.
 */
const BUSINESS_RULES = {
  // Master switch: Must be explicitly enabled by environment or configuration
  IS_ENABLED: process.env.REFERRAL_COMMISSION_ENABLED === 'true',

  // Trigger event: 'INVESTMENT_ACTIVATION' or 'ROI_PAYOUT'
  TRIGGER_EVENT: process.env.REFERRAL_COMMISSION_TRIGGER || null,

  // Calculation basis: 'INVESTMENT_PRINCIPAL' or 'ROI_AMOUNT'
  CALCULATION_BASIS: process.env.REFERRAL_COMMISSION_BASIS || null,

  // Maximum referral depth for financial commission eligibility
  MAX_ELIGIBLE_LEVELS: process.env.REFERRAL_COMMISSION_MAX_LEVELS
    ? parseInt(process.env.REFERRAL_COMMISSION_MAX_LEVELS, 10)
    : null,

  // Rates mapping per generational level in basis points (e.g. { 1: 500, 2: 300 })
  LEVEL_RATES_BPS: parseEnvRates(),

  // Rounding policy for fractional paise
  ROUNDING_MODE: process.env.REFERRAL_COMMISSION_ROUNDING || 'FLOOR',

  // Immediate wallet crediting switch:
  // When true: beneficiary.walletBalancePaise is credited and WalletTransaction is created atomically.
  // When false: ReferralIncome is created with status 'pending' without crediting balance.
  CREDIT_WALLET_IMMEDIATELY: process.env.REFERRAL_COMMISSION_CREDIT_IMMEDIATELY !== 'false',

  // Beneficiary eligibility requirement: only active accounts receive commissions
  REQUIRE_ACTIVE_BENEFICIARY: process.env.REFERRAL_REQUIRE_ACTIVE_BENEFICIARY !== 'false',

  // Eligible statuses for the source event
  ELIGIBLE_SOURCE_STATUSES: ['active', 'completed', 'processed']
};

/**
 * Validates the referral commission configuration.
 * Throws an explicit Error if commission processing is attempted with missing or invalid rules.
 * 
 * @param {object} [customRules] Optional runtime rules for testing or tenant override
 * @returns {object} Validated referral commission configuration
 */
const validateReferralCommissionConfig = (customRules = {}) => {
  const rules = {
    ...BUSINESS_RULES,
    ...customRules
  };

  // 1. Check if commission processing is explicitly enabled
  if (!rules.IS_ENABLED) {
    throw new Error(
      'Referral Commission Configuration Error: Commission processing is currently DISABLED. ' +
      'Commission rates, calculation basis, and trigger events must be explicitly approved by stakeholders.'
    );
  }

  // 2. Validate Trigger Event
  if (!rules.TRIGGER_EVENT || !SUPPORTED_TRIGGER_EVENTS.includes(rules.TRIGGER_EVENT)) {
    throw new Error(
      `Referral Commission Configuration Error: "TRIGGER_EVENT" is missing or invalid. ` +
      `Must be one of: [${SUPPORTED_TRIGGER_EVENTS.join(', ')}]. Received: "${rules.TRIGGER_EVENT}"`
    );
  }

  // 3. Validate Calculation Basis
  if (!rules.CALCULATION_BASIS || !SUPPORTED_CALCULATION_BASIS(rules.CALCULATION_BASIS)) {
    throw new Error(
      `Referral Commission Configuration Error: "CALCULATION_BASIS" is missing or invalid. ` +
      `Must be one of: [${SUPPORTED_CALCULATION_BASES.join(', ')}]. Received: "${rules.CALCULATION_BASIS}"`
    );
  }

  // 4. Validate Maximum Eligible Levels
  if (
    typeof rules.MAX_ELIGIBLE_LEVELS !== 'number' ||
    !Number.isInteger(rules.MAX_ELIGIBLE_LEVELS) ||
    rules.MAX_ELIGIBLE_LEVELS < TECHNICAL_DEFAULTS.MIN_LEVEL
  ) {
    throw new Error(
      'Referral Commission Configuration Error: "MAX_ELIGIBLE_LEVELS" must be a positive integer >= 1.'
    );
  }

  if (rules.MAX_ELIGIBLE_LEVELS > TECHNICAL_DEFAULTS.MAX_TRAVERSAL_GUARD) {
    throw new Error(
      `Referral Commission Configuration Error: "MAX_ELIGIBLE_LEVELS" (${rules.MAX_ELIGIBLE_LEVELS}) ` +
      `exceeds the maximum traversal safety guard (${TECHNICAL_DEFAULTS.MAX_TRAVERSAL_GUARD}).`
    );
  }

  // 5. Validate Level Commission Rates Mapping
  if (!rules.LEVEL_RATES_BPS || typeof rules.LEVEL_RATES_BPS !== 'object') {
    throw new Error(
      'Referral Commission Configuration Error: "LEVEL_RATES_BPS" is missing or not an object. ' +
      'Rates must be explicitly configured per generational level in basis points.'
    );
  }

  // Ensure rates are valid non-negative integers representing basis points (0 to 10000 bps)
  const normalizedRates = {};
  for (const [levelKey, rateBps] of Object.entries(rules.LEVEL_RATES_BPS)) {
    const level = parseInt(levelKey, 10);
    if (isNaN(level) || level < 1 || level > rules.MAX_ELIGIBLE_LEVELS) {
      throw new Error(
        `Referral Commission Configuration Error: Invalid level "${levelKey}" in LEVEL_RATES_BPS. ` +
        `Must be an integer between 1 and ${rules.MAX_ELIGIBLE_LEVELS}.`
      );
    }
    if (
      typeof rateBps !== 'number' ||
      !Number.isInteger(rateBps) ||
      rateBps < 0 ||
      rateBps > 10000
    ) {
      throw new Error(
        `Referral Commission Configuration Error: Level ${level} rate (${rateBps}) must be an integer ` +
        `between 0 and 10000 basis points (0% to 100%).`
      );
    }
    normalizedRates[level] = rateBps;
  }

  // 6. Validate Rounding Mode
  if (!rules.ROUNDING_MODE || !SUPPORTED_ROUNDING_MODES.includes(rules.ROUNDING_MODE)) {
    throw new Error(
      `Referral Commission Configuration Error: "ROUNDING_MODE" must be one of: [${SUPPORTED_ROUNDING_MODES.join(', ')}]`
    );
  }

  // 7. Validate Immediate Wallet Crediting flag
  if (typeof rules.CREDIT_WALLET_IMMEDIATELY !== 'boolean') {
    throw new Error(
      'Referral Commission Configuration Error: "CREDIT_WALLET_IMMEDIATELY" must be a boolean (true/false).'
    );
  }

  return {
    ...rules,
    LEVEL_RATES_BPS: normalizedRates,
    maxTraversalGuard: TECHNICAL_DEFAULTS.MAX_TRAVERSAL_GUARD
  };
};

function SUPPORTED_CALCULATION_BASIS(basis) {
  return SUPPORTED_CALCULATION_BASES.includes(basis);
}

module.exports = {
  TECHNICAL_DEFAULTS,
  SUPPORTED_TRIGGER_EVENTS,
  SUPPORTED_CALCULATION_BASES,
  SUPPORTED_ROUNDING_MODES,
  BUSINESS_RULES,
  validateReferralCommissionConfig
};

