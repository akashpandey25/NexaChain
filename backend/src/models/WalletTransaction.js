const mongoose = require('mongoose');

/**
 * Wallet Transaction Schema
 * Immutable ledger of all credits and debits to user wallets.
 */
const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for wallet transaction'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['credit', 'debit'],
        message: 'Transaction type must be either "credit" or "debit"'
      },
      required: [true, 'Transaction type is required']
    },
    amountPaise: {
      type: Number,
      required: [true, 'Transaction amount in paise is required'],
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value > 0;
        },
        message: 'Transaction amount must be a positive integer greater than zero'
      }
    },
    sourceType: {
      type: String,
      enum: {
        values: ['roi', 'referral', 'investment', 'adjustment'],
        message: 'Source type must be one of: roi, referral, investment, adjustment'
      },
      required: [true, 'Source type is required']
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    transactionKey: {
      type: String,
      required: [true, 'Unique transaction key is required for idempotency'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'wallet_transactions'
  }
);

// Performance compound index for fast user ledger lookups ordered by time
walletTransactionSchema.index({ user: 1, createdAt: -1 });

// Prevent OverwriteModelError
const WalletTransaction =
  mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
