const PlantationHealthIssue = require('../../Models/PlantationMonitoringReporting/PlantationHealthIssues/model');
const LandPlot = require('../../Models/PlantationMonitoringReporting/LandPlots/model');

// GET /api/issues
exports.getIssues = async (_req, res) => {
  try {
    const data = await PlantationHealthIssue.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/issues
exports.addIssue = async (req, res) => {
  try {
    // Basic visibility for debugging (remove later if you want)
    console.log('[ADD ISSUE] body:', req.body);
    console.log('[ADD ISSUE] file:', req.file?.filename);

    // Coerce to numbers
    const plotid = Number(req.body.plotid);
    const reportedBy = Number(req.body.reportedBy);

    if (!plotid || !reportedBy) {
      return res.status(400).json({ error: 'plotid and reportedBy are required numbers' });
    }

    // Validate plot exists
    const plot = await LandPlot.findOne({ plotid });
    if (!plot) {
      return res.status(400).json({ error: 'Invalid Plot ID – plot does not exist' });
    }

    const doc = new PlantationHealthIssue({
      plotid,
      reportedBy,
      issueType: req.body.issueType,
      description: req.body.description,
      status: req.body.status || 'Open',
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/issues/:id
exports.updateIssue = async (req, res) => {
  try {
    console.log('[UPDATE ISSUE] body:', req.body);
    console.log('[UPDATE ISSUE] file:', req.file?.filename);

    const updateData = { ...req.body };

    if (updateData.plotid != null) updateData.plotid = Number(updateData.plotid);
    if (updateData.reportedBy != null) updateData.reportedBy = Number(updateData.reportedBy);

    if (updateData.plotid) {
      const plot = await LandPlot.findOne({ plotid: updateData.plotid });
      if (!plot) {
        return res.status(400).json({ error: 'Invalid Plot ID – plot does not exist' });
      }
    }

    if (req.file) {
      updateData.photoUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await PlantationHealthIssue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Issue not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/issues/:id
exports.deleteIssue = async (req, res) => {
  try {
    const deleted = await PlantationHealthIssue.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Issue not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
