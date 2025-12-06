const HarvestBatch = require('../../Models/PlantationMonitoringReporting/HarvestBatches/model');
const LandPlot = require('../../Models/PlantationMonitoringReporting/LandPlots/model');
const FarmerAssignment = require('../../Models/PlantationMonitoringReporting/FarmerAssignment/model');
const Inventory = require('../../Models/PlantationMonitoringReporting/Inventory/model');

// Process harvest batch and add to inventory
exports.processHarvestToInventory = async (req, res) => {
  try {
    const { batchId } = req.params;

    // Find the harvest batch
    const batch = await HarvestBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Harvest batch not found' });
    }

    // Check if already processed
    const existingInventory = await Inventory.findOne({ relatedHarvestId: batch.harvestId });
    if (existingInventory) {
      return res.status(400).json({ error: 'Harvest already processed to inventory' });
    }

    // Update batch status to Processed
    batch.status = 'Processed';
    await batch.save();

    // Add to inventory
    const inventoryDoc = new Inventory({
      name: `Harvest ${batch.harvestId}`,
      category: 'harvest',
      quantity: batch.weightKg,
      unit: 'kg',
      reorderLevel: 0,
      description: `Processed harvest from batch ${batch.harvestId}, plot ${batch.plotid}`,
      relatedHarvestId: batch.harvestId,
    });

    const savedInventory = await inventoryDoc.save();

    res.status(201).json({
      message: 'Harvest processed and added to inventory',
      batch: batch,
      inventory: savedInventory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all batches
exports.getBatches = async (req, res) => {
  try {
    const data = await HarvestBatch.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add batch (auto harvestId + validate plotid + auto farmerId)
exports.addBatch = async (req, res) => {
  try {
    const { plotid, harvestDate, weightKg, status } = req.body;

    //  Check if plot exists
    const plot = await LandPlot.findOne({ plotid });
    if (!plot) {
      return res.status(400).json({ error: "Invalid Plot ID – plot does not exist" });
    }

    //  Find farmer assigned to this plot
    const assignment = await FarmerAssignment.findOne({ plotid });
    if (!assignment) {
      return res.status(400).json({ error: "No farmer assigned to this plot" });
    }

    //  Generate next Harvest ID with prefix HB###
    const lastBatch = await HarvestBatch.findOne().sort({ createdAt: -1 });
    let nextId = "HB001";
    if (lastBatch && lastBatch.harvestId) {
      const lastNum = parseInt(lastBatch.harvestId.replace("HB", ""), 10);
      const newNum = lastNum + 1;
      nextId = `HB${String(newNum).padStart(3, "0")}`;
    }

    //  Create new batch
    const doc = new HarvestBatch({
      harvestId: nextId,
      plotid,
      farmerId: assignment.farmerId, // auto-filled
      harvestDate,
      weightKg,
      status: status || "Pending"
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update batch (validate if plotid changes)
exports.updateBatch = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.plotid) {
      const plot = await LandPlot.findOne({ plotid: updateData.plotid });
      if (!plot) {
        return res.status(400).json({ error: "Invalid Plot ID – plot does not exist" });
      }

      const assignment = await FarmerAssignment.findOne({ plotid: updateData.plotid });
      if (!assignment) {
        return res.status(400).json({ error: "No farmer assigned to this plot" });
      }

      // Auto-update farmerId
      updateData.farmerId = assignment.farmerId;
    }

    const updated = await HarvestBatch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Batch not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete batch
exports.deleteBatch = async (req, res) => {
  try {
    const deleted = await HarvestBatch.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Batch not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
