const { z } = require('zod');

/**
 * Format Zod validation errors into a clean array matching standard response format.
 * @param {z.ZodError} error
 * @returns {Array<{ field: string, message: string }>}
 */
const formatZodErrors = (error) => {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'parameter',
    message: issue.message
  }));
};

/**
 * Higher-order middleware to validate incoming request body against a Zod schema.
 * Rejects invalid input with HTTP 400 and structured error details.
 * @param {z.ZodSchema} schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error);
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation failed for request data',
        errors: formattedErrors
      });
    }
    next(error);
  }
};

/**
 * Higher-order middleware to validate request query parameters.
 * @param {z.ZodSchema} schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    const validatedQuery = schema.parse(req.query);
    req.query = validatedQuery;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error);
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation failed for query parameters',
        errors: formattedErrors
      });
    }
    next(error);
  }
};

/**
 * Higher-order middleware to validate route parameters (e.g. req.params.id).
 * @param {z.ZodSchema} schema
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => (req, res, next) => {
  try {
    const validatedParams = schema.parse(req.params);
    req.params = validatedParams;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error);
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation failed for route parameters',
        errors: formattedErrors
      });
    }
    next(error);
  }
};

module.exports = validate;
module.exports.validate = validate;
module.exports.validateQuery = validateQuery;
module.exports.validateParams = validateParams;
