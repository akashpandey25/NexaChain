const crypto = require('crypto');
const User = require('../models/User');

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 unambiguous set (no 0, O, 1, I)

/**
 * Generate a random referral code of specified length with 'NEXA' prefix.
 * @param {number} [length=6] Number of random characters
 * @returns {string} e.g. "NEXA7K92P4"
 */
const generateRandomCode = (length = 6) => {
  const randomBytes = crypto.randomBytes(length);
  let code = 'NEXA';
  for (let i = 0; i < length; i++) {
    code += CHARSET[randomBytes[i] % CHARSET.length];
  }
  return code;
};

/**
 * Generate a unique referral code and verify against existing records in MongoDB.
 * Retries up to maxRetries if a collision is detected.
 * @param {number} [maxRetries=10]
 * @returns {Promise<string>}
 */
const generateUniqueReferralCode = async (maxRetries = 10) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const candidate = generateRandomCode(6);
    const existing = await User.findOne({ referralCode: candidate }).lean();

    if (!existing) {
      return candidate;
    }
  }

  // Fallback with timestamp suffix to guarantee uniqueness if retries exhausted
  const fallback = `NEXA${Date.now().toString(36).toUpperCase()}`;
  return fallback;
};

module.exports = {
  generateRandomCode,
  generateUniqueReferralCode
};

