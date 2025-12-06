const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/PlantationMonitoringReporting/inventoryController');

router.get('/', controller.getInventory);
router.post('/', controller.addInventory);
router.post('/harvest', controller.addHarvestToInventory);
router.post('/resource', controller.receiveResource);
router.post('/final-product', controller.addFinalProduct);
router.put('/:id', controller.updateInventory);
router.delete('/:id', controller.deleteInventory);

module.exports = router;
