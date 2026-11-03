const { z } = require('zod');

/**
 * Validation schema for administrative referral commission processing.
 */
const processReferralCommissionSchema = z.object({
  sourceType: z.enum(['investment', 'roi'], {
    errorMap: () => ({
      message: 'sourceType must be either "investment" or "roi"'
    })
  }),
  sourceId: z
    .string({
      required_error: 'sourceId is required to identify the originating event'
    })
    .regex(/^[0-9a-fA-F]{24}$/, 'sourceId must be a valid 24-character hexadecimal MongoDB ObjectId')
});

module.exports = {
  processReferralCommissionSchema
};

