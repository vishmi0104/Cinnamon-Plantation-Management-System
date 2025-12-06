const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/PlantationMonitoringReporting/farmerAssignmentController');

router.get('/', controller.getAssignments);
router.post('/', controller.addAssignment);
router.put('/:id', controller.updateAssignment);   // ✅ param has name
router.delete('/:id', controller.deleteAssignment); // ✅ param has name

module.exports = router;
