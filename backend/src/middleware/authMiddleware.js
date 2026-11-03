const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates JWT access token in the Authorization header and verifies user in MongoDB.
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header is present and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Authorization header missing or malformed.',
      errors: [
        {
          field: 'authorization',
          message: 'Expected header format: Bearer <token>'
        }
      ]
    });
  }

  const token = authHeader.split(' ')[1];

  // 2. Verify token signature and expiration
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
        errors: [{ name: error.name, message: 'Token expired' }]
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      errors: [{ name: error.name, message: error.message }]
    });
  }

  // 3. Retrieve user from database (password excluded by default via schema select: false)
  try {
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
        errors: [{ message: 'User record not found' }]
      });
    }

    // 4. Reject inactive or suspended accounts
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Access denied.',
        errors: [{ message: 'User account is inactive' }]
      });
    }

    // 5. Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;

