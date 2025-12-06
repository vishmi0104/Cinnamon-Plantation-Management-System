const express = require('express');
const router = express.Router();
const deliveryIssueController = require('../../Controllers/PlantationMonitoringReporting/deliveryIssueController');
const { auth } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB max size
  },
  fileFilter,
});

// Get all delivery issues
router.get('/', auth, deliveryIssueController.getDeliveryIssues);

// Add a new delivery issue
router.post('/', auth, upload.single('photo'), deliveryIssueController.addDeliveryIssue);

// Update an existing delivery issue
router.put('/:id', auth, upload.single('photo'), deliveryIssueController.updateDeliveryIssue);

// Delete a delivery issue
router.delete('/:id', auth, deliveryIssueController.deleteDeliveryIssue);

module.exports = router;