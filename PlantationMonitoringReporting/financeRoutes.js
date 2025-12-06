const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/PlantationMonitoringReporting/financeController');

router.get('/transactions', controller.getTransactions);
router.get('/summary', controller.getFinanceSummary);
router.get('/transactions/inventory/:inventoryId', controller.getTransactionsByInventory);
router.post('/transactions', controller.addTransaction);

module.exports = router;