/**
 * ROI Configuration Registry
 * 
 * Centralizes configurable ROI business rules and operational parameters.
 * 
 * ARCHITECTURAL REQUIREMENTS:
 * - Distinguishes technical defaults (batch size, cursor limits) from business rules
 *   (ROI rates, rounding mode, wallet crediting, timezone).
 * - Never blindly accepts ROI percentages from client requests.
 * - Refuses to process investments if required business rules are missing or invalid.
 * - Never silently substitutes business-rule defaults without explicit configuration.
 */

const env = require('./env');
const { INVESTMENT_PLANS } = require('./plans');

/**
 * Technical Defaults
 * Operational knobs that govern throughput, memory footprint, and network timeouts.
 */
const TECHNICAL_DEFAULTS = {
  // Number of active investments processed in a single cursor batch
  BATCH_SIZE: 100,
  // Hard upper limit for batch size to prevent heap exhaustion
  MAX_BATCH_SIZE: 500,
  // Minimum batch size
  MIN_BATCH_SIZE: 1
};

/**
 * Configurable Business Rules
 * Governs calculation logic, eligibility, ledger posting, and rounding.
 */
const BUSINESS_RULES = {
  // Business timezone for normalizing calendar days (IST UTC+05:30)
  TIMEZONE: env.cronTimezone || 'Asia/Kolkata',

  // Calculation mode: 'DAILY_SIMPLE' means principalAmountPaise * (roiPercentage / 100)
  CALCULATION_MODE: 'DAILY_SIMPLE',

  // Allowed investment statuses for ROI accrual
  ALLOWED_INVESTMENT_STATUSES: ['active'],

  // Rounding mode for fractional paise:
  // 'FLOOR': Truncates fractional paise. Ensures platform solvency by never creating unbacked paise.
  // 'ROUND': Standard round-half-up.
  // 'CEIL': Rounds up fractional paise.
  ROUNDING_MODE: process.env.ROI_ROUNDING_MODE || 'FLOOR',

  // Immediate wallet crediting:
  // When true: user.walletBalancePaise is credited and a WalletTransaction ledger row is created atomically.
  // When false: ROIHistory is recorded with status 'processed', but balance crediting is deferred to maturity/claim.
  CREDIT_WALLET_IMMEDIATELY: process.env.ROI_CREDIT_WALLET_IMMEDIATELY !== 'false',

  // Reference to server-authorized investment plans
  PLANS: INVESTMENT_PLANS
};

/**
 * Validates that all required business rules are explicitly present and syntactically valid.
 * Throws an explicit Error if any required business rule is missing or unapproved.
 * 
 * @param {object} [customRules] Optional runtime rule overrides for testing
 * @returns {object} Validated business rules combined with technical defaults
 */
const validateRoiConfig = (customRules = {}) => {
  const rules = {
    ...BUSINESS_RULES,
    ...customRules
  };

  // 1. Validate Timezone
  if (!rules.TIMEZONE || typeof rules.TIMEZONE !== 'string') {
    throw new Error('ROI Configuration Error: "TIMEZONE" business rule is missing or invalid.');
  }

  // 2. Validate Calculation Mode
  const validCalculationModes = ['DAILY_SIMPLE'];
  if (!rules.CALCULATION_MODE || !validCalculationModes.includes(rules.CALCULATION_MODE)) {
    throw new Error(
      `ROI Configuration Error: "CALCULATION_MODE" must be one of: ${validCalculationModes.join(', ')}`
    );
  }

  // 3. Validate Rounding Mode
  const validRoundingModes = ['FLOOR', 'ROUND', 'CEIL'];
  if (!rules.ROUNDING_MODE || !validRoundingModes.includes(rules.ROUNDING_MODE)) {
    throw new Error(
      `ROI Configuration Error: "ROUNDING_MODE" must be one of: ${validRoundingModes.join(', ')}`
    );
  }

  // 4. Validate Immediate Wallet Crediting flag
  if (typeof rules.CREDIT_WALLET_IMMEDIATELY !== 'boolean') {
    throw new Error(
      'ROI Configuration Error: "CREDIT_WALLET_IMMEDIATELY" must be a boolean (true/false).'
    );
  }

  // 5. Validate Allowed Investment Statuses
  if (!Array.isArray(rules.ALLOWED_INVESTMENT_STATUSES) || rules.ALLOWED_INVESTMENT_STATUSES.length === 0) {
    throw new Error(
      'ROI Configuration Error: "ALLOWED_INVESTMENT_STATUSES" must be a non-empty array of investment statuses.'
    );
  }

  // 6. Validate Authorized Plans Registry
  if (!rules.PLANS || typeof rules.PLANS !== 'object' || Object.keys(rules.PLANS).length === 0) {
    throw new Error(
      'ROI Configuration Error: Authorized investment plans registry ("PLANS") is missing or empty.'
    );
  }

  // Validate each registered plan has positive daily ROI percentage
  for (const [key, plan] of Object.entries(rules.PLANS)) {
    if (typeof plan.roiPercentage !== 'number' || plan.roiPercentage <= 0) {
      throw new Error(
        `ROI Configuration Error: Plan "${key}" has an invalid daily ROI percentage (${plan.roiPercentage}).`
      );
    }
  }

  // 7. Resolve Batch Size (Technical Knob)
  let batchSize = customRules.batchSize || parseInt(process.env.ROI_BATCH_SIZE, 10) || TECHNICAL_DEFAULTS.BATCH_SIZE;
  if (isNaN(batchSize) || batchSize < TECHNICAL_DEFAULTS.MIN_BATCH_SIZE) {
    batchSize = TECHNICAL_DEFAULTS.BATCH_SIZE;
  }
  if (batchSize > TECHNICAL_DEFAULTS.MAX_BATCH_SIZE) {
    batchSize = TECHNICAL_DEFAULTS.MAX_BATCH_SIZE;
  }

  return {
    ...rules,
    batchSize
  };
};

module.exports = {
  TECHNICAL_DEFAULTS,
  BUSINESS_RULES,
  validateRoiConfig
};

