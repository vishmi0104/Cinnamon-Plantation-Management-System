const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/PlantationMonitoringReporting/landPlotController');

router.get('/', controller.getPlots);
router.post('/', controller.addPlot);
router.put('/:id', controller.updatePlot);    // ✅ safe param
router.delete('/:id', controller.deletePlot); // ✅ safe param

module.exports = router;
