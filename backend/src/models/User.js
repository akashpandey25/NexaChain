const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a registered participant on the NexaChain platform.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Excluded from query results by default for security
    },
    referralCode: {
      type: String,
      required: [true, 'Referral code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Referral code must be at least 3 characters long'],
      maxlength: [30, 'Referral code cannot exceed 30 characters']
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
      validate: {
        validator: function (value) {
          // Prevent a user from referring themselves
          if (!value) return true;
          if (this._id && value.toString() === this._id.toString()) {
            return false;
          }
          return true;
        },
        message: 'A user cannot refer themselves (self-referral is forbidden)'
      }
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either "user" or "admin"'
      },
      default: 'user'
    },
    walletBalancePaise: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          return Number.isInteger(value) && value >= 0;
        },
        message: 'Wallet balance must be a non-negative integer representing paise'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Prevent OverwriteModelError in test/dev environments with hot reloads
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
