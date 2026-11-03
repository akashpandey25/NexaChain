const { z } = require('zod');

/**
 * Validator for ROI History and Query operations.
 */
const roiHistoryQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => Number.isInteger(val) && val >= 1, {
        message: 'Page must be an integer greater than or equal to 1'
      }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => Number.isInteger(val) && val >= 1 && val <= 100, {
        message: 'Limit must be an integer between 1 and 100'
      }),
    status: z
      .enum(['pending', 'processed', 'failed'], {
        errorMap: () => ({
          message: 'Status must be one of: pending, processed, failed'
        })
      })
      .optional(),
    investmentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Investment ID must be a valid 24-character hexadecimal MongoDB ObjectId')
      .optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'startDate must be a valid ISO 8601 date string'
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'endDate must be a valid ISO 8601 date string'
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
      message: 'startDate must be before or equal to endDate',
      path: ['startDate']
    }
  );

/**
 * Validator for administrative or testing ROI trigger payload.
 */
const processRoiSchema = z.object({
  businessDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'businessDate must be a valid ISO 8601 date or YYYY-MM-DD string'
    })
    .optional()
});

module.exports = {
  roiHistoryQuerySchema,
  processRoiSchema
};
