const express = require('express');
const investmentController = require('../controllers/investmentController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, validateQuery, validateParams } = require('../middleware/validate');
const {
  createInvestmentSchema,
  listInvestmentsQuerySchema,
  investmentIdParamSchema
} = require('../validators/investmentValidator');

const router = express.Router();

// Enforce authentication across all investment endpoints
router.use(authMiddleware);

// Create investment
router.post('/', validate(createInvestmentSchema), investmentController.createInvestment);

// List authenticated user's investments with pagination and status filter
router.get('/', validateQuery(listInvestmentsQuerySchema), investmentController.getInvestments);

// Get specific investment details by ID
router.get('/:id', validateParams(investmentIdParamSchema), investmentController.getInvestmentById);

module.exports = router;

