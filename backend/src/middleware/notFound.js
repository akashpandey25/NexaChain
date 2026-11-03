/**
 * Middleware to catch 404 Not Found errors for unhandled routes.
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errors: [
      {
        path: req.originalUrl,
        method: req.method,
        message: 'The requested route does not exist on this server.'
      }
    ]
  });
};

module.exports = notFound;

