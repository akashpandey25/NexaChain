const mongoose = require('mongoose');

/**
 * Referral Income Schema
 * Records multi-tier referral commissions distributed across the upline network.
 */
const referralIncomeSchema = new mongoose.Schema(
  {
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Beneficiary user reference is required'],
      index: true
    },
    sourceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Source user reference is required'],
      index: true
    },
    sourceInvestment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: [true, 'Source investment reference is required'],
      index: true
    },
    level: {
      type: Number,
      required: [true, 'Referral level is required'],
      index: true,
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 1;
        },
        message: 'Referral level must be a positive integer (>= 1)'
      }
    },
    percentageApplied: {
      type: Number,
      required: [true, 'Applied commission percentage is required'],
      min: [0, 'Applied commission percentage must be non-negative']
    },
    amountPaise: {
      type: Number,
      required: [true, 'Referral commission amount in paise is required'],
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 0;
        },
        message: 'Commission amount must be a non-negative integer representing paise'
      }
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
    collection: 'referral_incomes'
  }
);

// Performance compound index for reporting beneficiary commissions by level
referralIncomeSchema.index({ beneficiary: 1, level: 1 });

// Query optimization index for source investment deduplication and auditing
referralIncomeSchema.index({ sourceInvestment: 1, beneficiary: 1, level: 1 });

// Prevent OverwriteModelError
const ReferralIncome = mongoose.models.ReferralIncome || mongoose.model('ReferralIncome', referralIncomeSchema);

module.exports = ReferralIncome;
