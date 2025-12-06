const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/PlantationMonitoringReporting/paymentController');
const { auth } = require('../../middleware/auth');

// Payment Methods CRUD
router.get('/methods', auth, controller.getPaymentMethods);
router.post('/methods', auth, controller.addPaymentMethod);
router.put('/methods/:id', auth, controller.updatePaymentMethod);
router.delete('/methods/:id', auth, controller.deletePaymentMethod);
router.put('/methods/:id/default', auth, controller.setDefaultPaymentMethod);

// Payment Processing
router.post('/process', auth, controller.processPayment);

// Payment Transactions
router.get('/transactions', auth, controller.getPaymentTransactions);
router.get('/transactions/:id', auth, controller.getPaymentTransaction);

module.exports = router;