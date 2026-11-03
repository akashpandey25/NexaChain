const investmentService = require('../services/investmentService');

/**
 * Investment Controller
 * Handles incoming HTTP requests, orchestrates service logic, and sends standardized responses.
 */

/**
 * Create a new pending investment.
 * Route: POST /api/investments
 */
const createInvestment = async (req, res, next) => {
  try {
    const investment = await investmentService.createInvestment(req.user._id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: {
        investment
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List paginated investments for the authenticated user.
 * Route: GET /api/investments
 */
const getInvestments = async (req, res, next) => {
  try {
    const result = await investmentService.getUserInvestments(req.user._id, req.query);

    return res.status(200).json({
      success: true,
      message: 'Investments retrieved successfully',
      data: {
        investments: result.investments,
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve investment details by ID for the authenticated owner.
 * Route: GET /api/investments/:id
 */
const getInvestmentById = async (req, res, next) => {
  try {
    const investment = await investmentService.getInvestmentById(req.params.id, req.user._id);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found',
        errors: [
          {
            field: 'id',
            message: 'Investment not found or does not belong to the current user'
          }
        ]
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Investment details retrieved successfully',
      data: {
        investment
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvestment,
  getInvestments,
  getInvestmentById
};

