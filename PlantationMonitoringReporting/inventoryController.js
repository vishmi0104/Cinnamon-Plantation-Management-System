const Inventory = require('../../Models/PlantationMonitoringReporting/Inventory/model');
const Finance = require('../../Models/PlantationMonitoringReporting/Finance/model');
const HarvestBatch = require('../../Models/PlantationMonitoringReporting/HarvestBatches/model');

// Helper function to log finance transaction
const logFinanceTransaction = async (type, description, amount, relatedInventoryId, relatedItemId, category) => {
    try {
        const financeDoc = new Finance({
            type,
            description,
            amount,
            relatedInventoryId,
            relatedItemId,
            category,
        });
        await financeDoc.save();
        console.log(`✅ Finance transaction logged: ${description}`);
    } catch (err) {
        console.error('❌ Error logging finance transaction:', err.message);
    }
};

// Get all inventory items with reorder alerts
exports.getInventory = async (req, res) => {
  try {
    const data = await Inventory.find().sort({ createdAt: -1 });

    // Check for low stock alerts
    const lowStockItems = data.filter(item => item.status === 'Low Stock');
    if (lowStockItems.length > 0) {
      console.log('⚠️ Low Stock Alert:', lowStockItems.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', '));
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new inventory item
exports.addInventory = async (req, res) => {
  try {
    const doc = new Inventory(req.body);
    const saved = await doc.save();

    // Log finance transaction if amount is provided
    if (req.body.amount) {
      await logFinanceTransaction(
        req.body.transactionType || 'expense',
        `Added ${saved.name} to inventory`,
        req.body.amount,
        saved._id,
        saved.itemId,
        saved.category
      );
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add harvest to inventory
exports.addHarvestToInventory = async (req, res) => {
  try {
    const { harvestId, name, quantity, unit, reorderLevel, description } = req.body;

    // Verify harvest exists
    const harvest = await HarvestBatch.findOne({ harvestId });
    if (!harvest) {
      return res.status(400).json({ error: 'Harvest not found' });
    }

    // Check if harvest already added to inventory
    const existingItem = await Inventory.findOne({ relatedHarvestId: harvestId });
    if (existingItem) {
      return res.status(400).json({ error: 'Harvest already added to inventory' });
    }

    const doc = new Inventory({
      name: name || `Harvest ${harvestId}`,
      category: 'harvest',
      quantity,
      unit: unit || 'kg',
      reorderLevel: reorderLevel || 0,
      description: description || `Harvest from batch ${harvestId}`,
      relatedHarvestId: harvestId,
    });

    const saved = await doc.save();

    // Log finance transaction (income from harvest)
    await logFinanceTransaction(
      'income',
      `Harvest ${harvestId} added to inventory`,
      quantity * 10, // Assuming some value per kg
      saved._id,
      saved.itemId,
      'harvest'
    );

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update inventory when resources are received
exports.receiveResource = async (req, res) => {
  try {
    const { itemId, additionalQuantity, supplier, amount } = req.body;

    const item = await Inventory.findOne({ itemId });
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    item.quantity += additionalQuantity;
    if (supplier) item.supplier = supplier;

    const updated = await item.save();

    // Log finance transaction (expense for resource purchase)
    if (amount) {
      await logFinanceTransaction(
        'expense',
        `Received ${additionalQuantity} ${item.unit} of ${item.name}`,
        amount,
        updated._id,
        updated.itemId,
        'resource'
      );
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add final product from production
exports.addFinalProduct = async (req, res) => {
  try {
    const { name, quantity, unit, reorderLevel, description, batchId, amount } = req.body;

    const doc = new Inventory({
      name,
      category: 'final product',
      quantity,
      unit: unit || 'kg',
      reorderLevel: reorderLevel || 0,
      description: description || 'Final product from production',
      relatedBatchId: batchId || '',
    });

    const saved = await doc.save();

    // Log finance transaction (income from final product)
    if (amount) {
      await logFinanceTransaction(
        'income',
        `Final product ${name} added to inventory`,
        amount,
        saved._id,
        saved.itemId,
        'final product'
      );
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update inventory item
exports.updateInventory = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Get current item to access reorderLevel if not provided in update
    const currentItem = await Inventory.findById(req.params.id);
    if (!currentItem) return res.status(404).json({ error: "Inventory item not found" });

    const reorderLevel = updateData.reorderLevel !== undefined ? updateData.reorderLevel : currentItem.reorderLevel;

    // Calculate status based on quantity and reorderLevel
    if (updateData.quantity !== undefined) {
      if (updateData.quantity <= 0) {
        updateData.status = "Out of Stock";
      } else if (updateData.quantity <= reorderLevel) {
        updateData.status = "Low Stock";
      } else {
        updateData.status = "Available";
      }
    }

    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Log finance transaction if quantity changed (usage/consumption)
    if (req.body.quantity !== undefined && req.body.previousQuantity) {
      const quantityChange = req.body.quantity - req.body.previousQuantity;
      if (quantityChange < 0) {
        await logFinanceTransaction(
          'expense',
          `Used ${Math.abs(quantityChange)} ${updated.unit} of ${updated.name}`,
          Math.abs(quantityChange) * 5, // Assuming some cost per unit
          updated._id,
          updated.itemId,
          updated.category
        );
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete inventory item
exports.deleteInventory = async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Inventory item not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
