const mongoose = require('mongoose');

/**
 * Investment Schema
 * Represents an investment contract funded by a user.
 */
const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for an investment'],
      index: true
    },
    principalAmountPaise: {
      type: Number,
      required: [true, 'Principal amount in paise is required'],
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 0;
        },
        message: 'Principal amount must be a non-negative integer representing paise'
      }
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    roiPercentage: {
      type: Number,
      required: [true, 'ROI percentage is required'],
      min: [0, 'ROI percentage must be a non-negative number']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
      index: true
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'completed', 'cancelled'],
        message: 'Status must be one of: pending, active, completed, cancelled'
      },
      default: 'pending',
      index: true
    },
    totalRoiEarnedPaise: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 0;
        },
        message: 'Total ROI earned must be a non-negative integer representing paise'
      }
    },
    actionedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    actionedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
  },
  {
    timestamps: true,
    collection: 'investments'
  }
);

// Compound index for portfolio query optimization
investmentSchema.index({ user: 1, status: 1 });

// Prevent OverwriteModelError
const Investment = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);

module.exports = Investment;
