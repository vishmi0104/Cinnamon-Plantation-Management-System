const express = require('express');
const router = express.Router();
const deliveryResponseController = require('../../Controllers/PlantationMonitoringReporting/deliveryResponseController');
const { auth } = require('../../middleware/auth');

// Get all delivery responses
router.get('/', auth, deliveryResponseController.getDeliveryResponses);

// Get responses for a specific issue
router.get('/:issueId', auth, deliveryResponseController.getDeliveryResponsesByIssue);

// Add a new delivery response
router.post('/', auth, deliveryResponseController.addDeliveryResponse);

// Update an existing delivery response
router.put('/:id', auth, deliveryResponseController.updateDeliveryResponse);

// Delete a delivery response
router.delete('/:id', auth, deliveryResponseController.deleteDeliveryResponse);

module.exports = router;