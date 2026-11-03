const express = require('express');
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateQuery, validateBody } = require('../middleware/validate');
const {
  directReferralsQuerySchema,
  referralTreeQuerySchema,
  referralIncomeQuerySchema
} = require('../validators/referralValidator');
const { processReferralCommissionSchema } = require('../validators/referralCommissionValidator');

const router = express.Router();

// Enforce authentication on all referral endpoints
router.use(authMiddleware);

// Get direct referrals (level 1 only)
router.get('/direct', validateQuery(directReferralsQuerySchema), referralController.getDirectReferrals);

// Get hierarchical referral tree with cycle protection
router.get('/tree', validateQuery(referralTreeQuerySchema), referralController.getReferralTree);

// Get referral income records and status summaries
router.get('/income', validateQuery(referralIncomeQuerySchema), referralController.getReferralIncome);

// Administrative trigger for multi-level referral commission processing
router.post(
  '/process',
  roleMiddleware('admin'),
  validateBody(processReferralCommissionSchema),
  referralController.processCommissions
);

module.exports = router;

