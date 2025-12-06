const express = require('express');
const controller = require('../../Controllers/PlantationMonitoringReporting/responseController');
const { auth, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Routes
router.get('/', auth, controller.getResponses); // get all consultations (responses)

module.exports = router;