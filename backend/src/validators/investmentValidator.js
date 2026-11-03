const { z } = require('zod');

// Regex for standard 24-character hex MongoDB ObjectId
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Validator schema for creating an investment.
 * Accepts either 'principalAmountPaise' or 'amountPaise', normalizing to 'principalAmountPaise'.
 */
const createInvestmentSchema = z
  .object({
    principalAmountPaise: z
      .number({
        required_error: 'Investment amount in paise is required'
      })
      .int('Investment amount must be an integer (in paise)')
      .positive('Investment amount must be a positive integer greater than zero')
      .optional(),
    amountPaise: z
      .number()
      .int('Investment amount must be an integer (in paise)')
      .positive('Investment amount must be a positive integer greater than zero')
      .optional(),
    planName: z
      .string({
        required_error: 'Plan name or identifier is required'
      })
      .trim()
      .min(1, 'Plan name cannot be empty')
      .max(100, 'Plan name cannot exceed 100 characters'),
    // Reject or strip any attempted client injection
    roiPercentage: z.any().optional(),
    user: z.any().optional(),
    userId: z.any().optional(),
    status: z.any().optional()
  })
  .refine(
    (data) => data.principalAmountPaise !== undefined || data.amountPaise !== undefined,
    {
      message: 'Investment amount in paise is required (principalAmountPaise or amountPaise)',
      path: ['principalAmountPaise']
    }
  )
  .transform((data) => {
    // Normalize to principalAmountPaise
    const principalAmountPaise =
      data.principalAmountPaise !== undefined
        ? data.principalAmountPaise
        : data.amountPaise;

    return {
      principalAmountPaise,
      planName: data.planName
    };
  });

/**
 * Validator schema for querying/listing investments.
 */
const listInvestmentsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 10;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 10;
      return parsed > 100 ? 100 : parsed;
    }),
  status: z
    .enum(['pending', 'active', 'completed', 'cancelled'], {
      errorMap: () => ({
        message: 'Invalid status filter. Allowed values: pending, active, completed, cancelled'
      })
    })
    .optional()
});

/**
 * Validator schema for URL route parameters (e.g. /:id).
 */
const investmentIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Investment ID is required' })
    .regex(objectIdRegex, 'Invalid investment ID format. Must be a 24-character hexadecimal ID')
});

module.exports = {
  createInvestmentSchema,
  listInvestmentsQuerySchema,
  investmentIdParamSchema
};

