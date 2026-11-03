const { z } = require('zod');

/**
 * Validates that a string can be parsed into a valid Date object.
 */
const isValidDateString = (val) => {
  if (!val) return true;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

const dashboardQuerySchema = z
  .object({
    startDate: z
      .string()
      .refine(isValidDateString, {
        message: 'startDate must be a valid ISO date string (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)'
      })
      .optional(),
    endDate: z
      .string()
      .refine(isValidDateString, {
        message: 'endDate must be a valid ISO date string (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)'
      })
      .optional(),
    limit: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return 30;
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 1) return 30;
        return parsed > 100 ? 100 : parsed;
      })
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
  dashboardQuerySchema
};

