const env = require('../config/env');

/**
 * Centralized application error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Determine appropriate HTTP status code
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : res.statusCode && res.statusCode >= 400
      ? res.statusCode
      : 500;

  // Format message
  const message = statusCode === 500 && env.isProduction
    ? 'An unexpected internal server error occurred'
    : err.message || 'Something went wrong';

  // Format errors array based on environment and error structure
  let errors = [];

  if (Array.isArray(err.errors)) {
    errors = err.errors;
  } else if (env.isDevelopment) {
    errors = [
      {
        name: err.name,
        message: err.message,
        stack: err.stack ? err.stack.split('\n').map((line) => line.trim()) : undefined
      }
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = errorHandler;

