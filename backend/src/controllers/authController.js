const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { generateUniqueReferralCode } = require('../utils/referralCode');

/**
 * Register a new user account.
 * Route: POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, referralCode } = req.body;

    // 1. Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        errors: [
          {
            field: 'email',
            message: 'Email address is already in use.'
          }
        ]
      });
    }

    // 2. Resolve optional referral code
    let referredBy = null;
    if (referralCode && referralCode.trim() !== '') {
      const normalizedRefCode = referralCode.trim().toUpperCase();
      const referringUser = await User.findOne({
        referralCode: normalizedRefCode,
        isActive: true
      });

      if (!referringUser) {
        return res.status(400).json({
          success: false,
          message: 'The provided referral code is invalid or the sponsor account is inactive.',
          errors: [
            {
              field: 'referralCode',
              message: 'Referral code not found or inactive.'
            }
          ]
        });
      }

      // Prevent self-referral
      if (referringUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Self-referral is forbidden.',
          errors: [
            {
              field: 'referralCode',
              message: 'You cannot use your own referral code.'
            }
          ]
        });
      }

      referredBy = referringUser._id;
    }

    // 3. Generate a collision-tested unique referral code for the new user
    const newReferralCode = await generateUniqueReferralCode();

    // 4. Create user record (role strictly forced to 'user', password hashed by User model hook)
    const newUser = await User.create({
      name,
      email,
      mobileNumber: req.body.mobileNumber?.trim() || null,
      password,
      referralCode: newReferralCode,
      referredBy,
      role: 'user', // Security: Prevent role escalation during public registration
      walletBalancePaise: 0,
      totalRoiEarnedPaise: 0,
      totalLevelIncomeEarnedPaise: 0,
      isActive: true
    });

    // 5. Generate JWT token
    const token = generateToken(newUser);

    // 6. Return response with safe user representation
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: newUser.toSafeObject(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user and issue JWT access token.
 * Route: POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    // Generic error message to prevent user enumeration
    const genericAuthError = {
      success: false,
      message: 'Invalid email or password.',
      errors: [
        {
          message: 'Authentication credentials could not be verified.'
        }
      ]
    };

    if (!user) {
      return res.status(401).json(genericAuthError);
    }

    // 2. Securely verify password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(genericAuthError);
    }

    // 3. Check account activation status
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        errors: [
          {
            field: 'isActive',
            message: 'User account is deactivated.'
          }
        ]
      });
    }

    // 4. Generate JWT access token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve authenticated user profile.
 * Route: GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: {
        user: req.user.toSafeObject()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};

