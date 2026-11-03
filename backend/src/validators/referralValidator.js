const { z } = require('zod');

const isValidDateString = (val) => {
  if (!val) return true;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

/**
 * Validation schema for GET /api/referrals/direct
 */
const directReferralsQuerySchema = z.object({
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
    })
});

/**
 * Validation schema for GET /api/referrals/tree
 */
const referralTreeQuerySchema = z.object({
  maxDepth: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 5;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 5;
      // Cap safety depth between 1 and 10 to protect memory and socket bounds
      return parsed > 10 ? 10 : parsed;
    })
});

/**
 * Validation schema for GET /api/referrals/income
 */
const referralIncomeQuerySchema = z
  .object({
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
      .enum(['pending', 'processed', 'failed'], {
        errorMap: () => ({
          message: 'Invalid status filter. Allowed values: pending, processed, failed'
        })
      })
      .optional(),
    startDate: z
      .string()
      .refine(isValidDateString, {
        message: 'startDate must be a valid ISO date string'
      })
      .optional(),
    endDate: z
      .string()
      .refine(isValidDateString, {
        message: 'endDate must be a valid ISO date string'
      })
      .optional()
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'startDate cannot be later than endDate',
      path: ['startDate']
    }
  );

module.exports = {
  directReferralsQuerySchema,
  referralTreeQuerySchema,
  referralIncomeQuerySchema
};

