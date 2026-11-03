const mongoose = require('mongoose');

/**
 * ROI History Schema
 * Records daily return on investment payouts associated with an active investment.
 */
const roiHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for ROI history record'],
      index: true
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: [true, 'Investment reference is required for ROI history record'],
      index: true
    },
    amountPaise: {
      type: Number,
      required: [true, 'ROI amount in paise is required'],
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 0;
        },
        message: 'ROI amount must be a non-negative integer representing paise'
      }
    },
    roiPercentageApplied: {
      type: Number,
      required: [true, 'Applied ROI percentage is required'],
      min: [0, 'Applied ROI percentage must be a non-negative number']
    },
    businessDate: {
      type: Date,
      required: [true, 'Business date is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processed', 'failed'],
        message: 'Status must be one of: pending, processed, failed'
      },
      default: 'pending'
    },
    transactionKey: {
      type: String,
      required: [true, 'Unique transaction key is required for idempotency'],
      unique: true,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'roi_histories'
  }
);

// Normalize businessDate to UTC midnight before validation
roiHistorySchema.pre('validate', function (next) {
  if (this.businessDate) {
    const parsed = new Date(this.businessDate);
    if (!isNaN(parsed.getTime())) {
      parsed.setUTCHours(0, 0, 0, 0);
      this.businessDate = parsed;
    }
  }
  next();
});

// Compound unique index: guarantees only one ROI record per investment per business date
roiHistorySchema.index({ investment: 1, businessDate: 1 }, { unique: true });

// Query optimization index for user history
roiHistorySchema.index({ user: 1, businessDate: -1 });

// Prevent OverwriteModelError
const ROIHistory = mongoose.models.ROIHistory || mongoose.model('ROIHistory', roiHistorySchema);

module.exports = ROIHistory;
