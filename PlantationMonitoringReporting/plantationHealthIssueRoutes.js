const express = require('express');
const multer = require('multer');
const path = require('path');
const controller = require('../../Controllers/PlantationMonitoringReporting/plantationHealthIssueController');
const { auth, requireRole } = require('../../middleware/auth');

const router = express.Router();

// Multer storage + simple guards
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (_req, file, cb) => {
  const ok = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype);
  cb(ok ? null : new Error('Only JPG/PNG files are allowed'), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Routes
router.get('/', auth, controller.getIssues);
router.post('/', auth, requireRole(['plantation', 'factory']), upload.single('photo'), controller.addIssue);
router.put('/:id', auth, requireRole(['plantation', 'factory']), upload.single('photo'), controller.updateIssue);
router.delete('/:id', auth, requireRole(['plantation', 'factory']), controller.deleteIssue);

module.exports = router;
