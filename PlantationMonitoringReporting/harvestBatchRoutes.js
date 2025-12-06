const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/PlantationMonitoringReporting/harvestBatchController');

router.get('/', controller.getBatches);
router.post('/', controller.addBatch);
router.post('/:batchId/process-to-inventory', controller.processHarvestToInventory);
router.put('/:id', controller.updateBatch);    // ✅ safe param
router.delete('/:id', controller.deleteBatch); // ✅ safe param

module.exports = router;
