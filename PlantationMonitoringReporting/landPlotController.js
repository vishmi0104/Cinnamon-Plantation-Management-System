const LandPlot = require('../../Models/PlantationMonitoringReporting/LandPlots/model');

// Get all
exports.getPlots = async (req, res) => {
  try {
    const data = await LandPlot.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add
exports.addPlot = async (req, res) => {
  try {
    const doc = new LandPlot(req.body);
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
exports.updatePlot = async (req, res) => {
  try {
    const updated = await LandPlot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Plot not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deletePlot = async (req, res) => {
  try {
    const deleted = await LandPlot.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Plot not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
