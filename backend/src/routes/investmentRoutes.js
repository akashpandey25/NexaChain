const express = require('express');
const investmentController = require('../controllers/investmentController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const {
  createInvestmentSchema,
  listInvestmentsQuerySchema,
  investmentIdParamSchema,
  adminPendingInvestmentsQuerySchema,
  rejectInvestmentSchema
} = require('../validators/investmentValidator');

const router = express.Router();

// Enforce authentication across all investment endpoints
router.use(authMiddleware);

// Available investment plans registry
router.get('/plans', investmentController.getPlans);

// Administrative: List pending investment requests across all users
router.get(
  '/admin/pending',
  authorizeRoles('admin'),
  validateQuery(adminPendingInvestmentsQuerySchema),
  investmentController.getAdminPendingInvestments
);

// Create investment (strictly creates in 'pending' status)
router.post('/', validate(createInvestmentSchema), investmentController.createInvestment);

// List authenticated user's investments with pagination and status filter
router.get('/', validateQuery(listInvestmentsQuerySchema), investmentController.getInvestments);

// Get specific investment details by ID
router.get('/:id', validateParams(investmentIdParamSchema), investmentController.getInvestmentById);

// Administrative: Activate a pending investment contract
router.patch(
  '/:id/activate',
  authorizeRoles('admin'),
  validateParams(investmentIdParamSchema),
  investmentController.activateInvestment
);

// Administrative: Reject a pending investment contract
router.patch(
  '/:id/reject',
  authorizeRoles('admin'),
  validateParams(investmentIdParamSchema),
  validate(rejectInvestmentSchema),
  investmentController.rejectInvestment
);

module.exports = router;

