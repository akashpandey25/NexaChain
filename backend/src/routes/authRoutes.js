const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes (Authentication required)
router.get('/me', authMiddleware, authController.getMe);

// Role-protected route (Demonstrates and verifies role-based authorization)
router.get(
  '/admin-check',
  authMiddleware,
  authorizeRoles('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin authorization verified successfully.',
      data: {
        adminUser: req.user.toSafeObject()
      }
    });
  }
);

module.exports = router;

