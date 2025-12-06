const FarmerAssignment = require('../../Models/PlantationMonitoringReporting/FarmerAssignment/model');
const LandPlot = require('../../Models/PlantationMonitoringReporting/LandPlots/model');

// Get all assignments (with land plot info joined manually)
exports.getAssignments = async (req, res) => {
  try {
    const data = await FarmerAssignment.find();

    // Optional: join with LandPlots to return full plot details
    const assignmentsWithPlots = await Promise.all(
      data.map(async (assignment) => {
        const plot = await LandPlot.findOne({ plotid: assignment.plotid });
        return { ...assignment.toObject(), plot };
      })
    );

    res.json(assignmentsWithPlots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add assignment (only if land plot exists)
exports.addAssignment = async (req, res) => {
  try {
    const { farmerId, farmerName, plotid, assignedDate } = req.body;

    //  Check if plot exists
    const existingPlot = await LandPlot.findOne({ plotid });
    if (!existingPlot) {
      return res.status(400).json({ error: "Invalid Plot ID – plot does not exist" });
    }

    const doc = new FarmerAssignment({
      farmerId,
      farmerName,
      plotid,
      assignedDate
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update assignment (validate plotid if provided)
exports.updateAssignment = async (req, res) => {
  try {
    if (req.body.plotid) {
      const existingPlot = await LandPlot.findOne({ plotid: req.body.plotid });
      if (!existingPlot) {
        return res.status(400).json({ error: "Invalid Plot ID – plot does not exist" });
      }
    }

    const updated = await FarmerAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Assignment not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const deleted = await FarmerAssignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Assignment not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
