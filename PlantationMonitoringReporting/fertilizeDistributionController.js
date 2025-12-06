const Distribution = require("../../Models/PlantationMonitoringReporting/FertilizeDistribution/model");
const LandPlot = require("../../Models/PlantationMonitoringReporting/LandPlots/model");
const Assignment = require("../../Models/PlantationMonitoringReporting/FarmerAssignment/model");

//  Get all distributions (populate farmer + plot info)
exports.getDistributions = async (req, res) => {
  try {
    const data = await Distribution.find().sort({ createdAt: -1 });

    // Attach farmer and plot details for frontend use
    const enriched = await Promise.all(
      data.map(async (d) => {
        const plot = await LandPlot.findOne({ plotid: d.plotid });
        const assignment = await Assignment.findOne({ plotid: d.plotid });

        return {
          ...d.toObject(),
          plotLocation: plot ? plot.location : null,
          farmerName: assignment ? assignment.farmerName : null,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Get single distribution
exports.getDistribution = async (req, res) => {
  try {
    const record = await Distribution.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Distribution record not found" });
    }

    const plot = await LandPlot.findOne({ plotid: record.plotid });
    const assignment = await Assignment.findOne({ plotid: record.plotid });

    res.json({
      ...record.toObject(),
      plotLocation: plot ? plot.location : null,
      farmerName: assignment ? assignment.farmerName : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Add new distribution
exports.addDistribution = async (req, res) => {
  try {
    const plot = await LandPlot.findOne({ plotid: req.body.plotid });
    if (!plot) {
      return res
        .status(400)
        .json({ error: "Invalid Plot ID – plot does not exist" });
    }

    const assignment = await Assignment.findOne({
      plotid: req.body.plotid,
      farmerId: req.body.farmerId, //  farmer must match
    });
    if (!assignment) {
      return res
        .status(400)
        .json({ error: "This farmer is not assigned to the selected plot" });
    }

    const doc = new Distribution({
      farmerId: req.body.farmerId,
      plotid: req.body.plotid,
      type: req.body.type,
      units: req.body.units,
      distributedDate: req.body.distributedDate,
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

//  Update distribution
exports.updateDistribution = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.plotid) {
      const plot = await LandPlot.findOne({ plotid: updateData.plotid });
      if (!plot) {
        return res
          .status(400)
          .json({ error: "Invalid Plot ID – plot does not exist" });
      }

      // also validate farmer if provided
      if (updateData.farmerId) {
        const assignment = await Assignment.findOne({
          plotid: updateData.plotid,
          farmerId: updateData.farmerId,
        });
        if (!assignment) {
          return res.status(400).json({
            error: "This farmer is not assigned to the selected plot",
          });
        }
      }
    }

    const updated = await Distribution.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Distribution record not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

//  Delete distribution
exports.deleteDistribution = async (req, res) => {
  try {
    const deleted = await Distribution.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Distribution record not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
