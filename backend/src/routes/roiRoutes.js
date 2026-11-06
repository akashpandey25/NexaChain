const express = require('express');
const router = express.Router();
const roiController = require('../controllers/roiController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateQuery, validateBody } = require('../middleware/validate');
const { roiHistoryQuerySchema, processRoiSchema } = require('../validators/roiValidator');

// All ROI endpoints require valid JWT authentication
router.use(authMiddleware);

// Retrieve personal ROI ledger records
router.get(
  '/history',
  validateQuery(roiHistoryQuerySchema),
  roiController.getRoiHistory
);

// Retrieve aggregated personal ROI statistics
router.get('/summary', roiController.getRoiSummary);

// Administrative trigger for daily ROI batch run
router.post(
  '/process',
  roleMiddleware('admin'),
  validateBody(processRoiSchema),
  roiController.triggerDailyRoi
);

module.exports = router;
