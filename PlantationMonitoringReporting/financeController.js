const Finance = require('../../Models/PlantationMonitoringReporting/Finance/model');

// Get all finance transactions
exports.getTransactions = async (req, res) => {
  try {
    const data = await Finance.find().populate('relatedInventoryId').sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get transactions by inventory item
exports.getTransactionsByInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const data = await Finance.find({ relatedInventoryId: inventoryId }).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add manual finance transaction
exports.addTransaction = async (req, res) => {
  try {
    const doc = new Finance(req.body);
    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get finance summary
exports.getFinanceSummary = async (req, res) => {
  try {
    const transactions = await Finance.find();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpense += transaction.amount;
      }
    });

    const netProfit = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      netProfit,
      transactionCount: transactions.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};