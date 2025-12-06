const DeliveryResponse = require('../../Models/PlantationMonitoringReporting/DeliveryResponses/model');
const DeliveryIssue = require('../../Models/PlantationMonitoringReporting/DeliveryIssues/model');

// GET /api/delivery-responses - get all responses
exports.getDeliveryResponses = async (req, res) => {
  try {
    const data = await DeliveryResponse.find()
      .populate('deliveryIssueId')
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/delivery-responses/:issueId - get responses for a specific issue
exports.getDeliveryResponsesByIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const data = await DeliveryResponse.find({ deliveryIssueId: issueId })
      .populate('deliveryIssueId')
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/delivery-responses - add a new response
exports.addDeliveryResponse = async (req, res) => {
  try {
    const { deliveryIssueId, responseText, actionTaken, status } = req.body;

    // Validation
    if (!deliveryIssueId) {
      return res.status(400).json({ error: 'Delivery Issue ID is required' });
    }
    if (!responseText || typeof responseText !== 'string') {
      return res.status(400).json({ error: 'Response text is required and must be a string' });
    }

    const trimmedText = responseText.trim();
    if (trimmedText.length < 5) {
      return res.status(400).json({ error: 'Response text must be at least 5 characters long' });
    }

    // Validate issue exists
    const issue = await DeliveryIssue.findById(deliveryIssueId);
    if (!issue) {
      return res.status(400).json({ error: 'Invalid delivery issue ID' });
    }

    const doc = new DeliveryResponse({
      deliveryIssueId,
      responseText: trimmedText,
      respondedBy: req.body.respondedBy || 'Support Manager',
      actionTaken: actionTaken || '',
      status: status || 'Pending'
    });

    const saved = await doc.save();
    const populated = await DeliveryResponse.findById(saved._id).populate('deliveryIssueId');
    
    // If the response indicates the issue is resolved, update the issue status
    if (status === 'Resolved') {
      await DeliveryIssue.findByIdAndUpdate(deliveryIssueId, { status: 'Closed' });
    }
    
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error adding delivery response:', err);
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/delivery-responses/:id - update a response
exports.updateDeliveryResponse = async (req, res) => {
  try {
    const { responseText, actionTaken, status } = req.body;

    // Validation
    if (!responseText || typeof responseText !== 'string') {
      return res.status(400).json({ error: 'Response text is required and must be a string' });
    }

    const trimmedText = responseText.trim();
    if (trimmedText.length < 5) {
      return res.status(400).json({ error: 'Response text must be at least 5 characters long' });
    }

    const updated = await DeliveryResponse.findByIdAndUpdate(
      req.params.id,
      { 
        responseText: trimmedText,
        actionTaken: actionTaken || '',
        status: status || 'Pending'
      },
      { new: true }
    ).populate('deliveryIssueId');

    if (!updated) return res.status(404).json({ error: 'Response not found' });
    
    // If the response indicates the issue is resolved, update the issue status
    if (status === 'Resolved') {
      await DeliveryIssue.findByIdAndUpdate(updated.deliveryIssueId._id, { status: 'Closed' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating delivery response:', err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/delivery-responses/:id - delete a response
exports.deleteDeliveryResponse = async (req, res) => {
  try {
    const deleted = await DeliveryResponse.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Response not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};