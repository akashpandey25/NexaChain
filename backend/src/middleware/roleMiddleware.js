/**
 * Role-Based Authorization Middleware
 * Restricts route access to users possessing specific authorized roles.
 * Must be mounted AFTER authMiddleware.
 * 
 * @param {...string} allowedRoles Roles authorized to access the route (e.g. 'admin')
 * @returns {Function} Express middleware
 */
const authorizeRoles = (...roles) => {
  const allowedRoles = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check.',
        errors: [{ message: 'User not authenticated' }]
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
        errors: [
          {
            field: 'role',
            message: 'Insufficient role permissions'
          }
        ]
      });
    }

    next();
  };
};

module.exports = authorizeRoles;

