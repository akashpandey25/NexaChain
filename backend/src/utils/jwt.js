const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * SECURITY NOTE ON JSON WEB TOKENS (JWT):
 * JWTs generated below are DIGITALLY SIGNED using HMAC-SHA256 with JWT_SECRET.
 * Signing ensures that any tampering with the header or payload invalidates the signature.
 * However, JWTs are NOT ENCRYPTED: the payload is base64url-encoded and can be read by
 * anyone who inspects the token.
 * Therefore, NEVER include sensitive secrets, passwords, or personal credentials in the payload.
 */

/**
 * Generate a signed JWT access token with a minimal payload.
 * @param {object} user User document or object containing _id, email, and role
 * @param {object} [customOptions={}] Optional jwt.sign options override (e.g. custom expiresIn)
 * @returns {string} Signed JWT token
 */
const generateToken = (user, customOptions = {}) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    role: user.role
  };

  const options = {
    expiresIn: customOptions.expiresIn || env.jwtExpiresIn,
    issuer: 'NexaChain-Auth',
    audience: 'NexaChain-Client'
  };

  return jwt.sign(payload, env.jwtSecret, options);
};

/**
 * Verify a JWT token signature and expiration.
 * @param {string} token
 * @returns {object} Decoded token payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret, {
    issuer: 'NexaChain-Auth',
    audience: 'NexaChain-Client'
  });
};

module.exports = {
  generateToken,
  verifyToken
};

