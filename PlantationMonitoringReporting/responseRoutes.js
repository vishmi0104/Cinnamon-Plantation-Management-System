const express = require('express');
const controller = require('../../Controllers/PlantationMonitoringReporting/responseController');
const { auth, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Routes
router.get('/', auth, controller.getResponses); // all can view?
router.get('/:issueId', auth, controller.getResponsesByIssue);
router.post('/', auth, requireRole(['support', 'consultation']), controller.addResponse);
router.put('/:id', auth, requireRole(['support', 'consultation']), controller.updateResponse);
router.delete('/:id', auth, requireRole(['support', 'consultation']), controller.deleteResponse);

module.exports = router;
