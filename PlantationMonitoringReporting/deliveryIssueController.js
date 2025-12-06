const DeliveryIssue = require('../../Models/PlantationMonitoringReporting/DeliveryIssues/model');

// GET /api/delivery-issues
exports.getDeliveryIssues = async (_req, res) => {
  try {
    const data = await DeliveryIssue.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/delivery-issues
exports.addDeliveryIssue = async (req, res) => {
  try {
    // Basic visibility for debugging
    console.log('[ADD DELIVERY ISSUE] body:', req.body);
    console.log('[ADD DELIVERY ISSUE] file:', req.file?.filename);

    // Validation
    if (!req.body.orderId || !req.body.description || !req.body.issueType || !req.body.deliveryPerson) {
      return res.status(400).json({ error: 'orderId, issueType, deliveryPerson and description are required' });
    }

    // Coerce reportedBy to number if present
    const reportedBy = Number(req.body.reportedBy) || 1; // Default to 1 for factory manager

    const doc = new DeliveryIssue({
      orderId: req.body.orderId,
      reportedBy,
      issueType: req.body.issueType,
      description: req.body.description,
      status: req.body.status || 'Open',
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      deliveryPerson: req.body.deliveryPerson,
      customerName: req.body.customerName,
      orderDate: req.body.orderDate ? new Date(req.body.orderDate) : new Date(),
    });

    const saved = await doc.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/delivery-issues/:id
exports.updateDeliveryIssue = async (req, res) => {
  try {
    console.log('[UPDATE DELIVERY ISSUE] body:', req.body);
    console.log('[UPDATE DELIVERY ISSUE] file:', req.file?.filename);

    const updateData = { ...req.body };

    if (updateData.reportedBy != null) updateData.reportedBy = Number(updateData.reportedBy);
    if (req.file) {
      updateData.photoUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await DeliveryIssue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Delivery issue not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/delivery-issues/:id
exports.deleteDeliveryIssue = async (req, res) => {
  try {
    const deleted = await DeliveryIssue.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Delivery issue not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};