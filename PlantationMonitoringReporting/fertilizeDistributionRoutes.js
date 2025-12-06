const express = require("express");
const router = express.Router();
const {
  getDistributions,
  getDistribution,
  addDistribution,
  updateDistribution,
  deleteDistribution,
} = require("../../Controllers/PlantationMonitoringReporting/fertilizeDistributionController");

const Assignment = require("../../Models/PlantationMonitoringReporting/FarmerAssignment/model");

// 📌 Existing CRUD routes
router.get("/", getDistributions);
router.get("/:id", getDistribution);
router.post("/", addDistribution);
router.put("/:id", updateDistribution);
router.delete("/:id", deleteDistribution);

// 📌 New route: Get farmers by plot
//    Example: GET /api/fertilizes/farmers/109
router.get("/farmers/:plotid", async (req, res) => {
  try {
    const farmers = await Assignment.find({ plotid: req.params.plotid });
    if (!farmers.length) {
      return res.status(404).json({ error: "No farmers assigned to this plot" });
    }
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
