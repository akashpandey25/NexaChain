const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateQuery } = require('../middleware/validate');
const { dashboardQuerySchema } = require('../validators/dashboardValidator');

const router = express.Router();

// Enforce authentication on all dashboard routes
router.use(authMiddleware);

// Retrieve dashboard statistics
router.get('/', validateQuery(dashboardQuerySchema), dashboardController.getDashboard);

module.exports = router;

