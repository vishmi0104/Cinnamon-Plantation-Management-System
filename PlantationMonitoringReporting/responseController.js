const Response = require('../../Models/PlantationMonitoringReporting/Responses/model');
const PlantationHealthIssue = require('../../Models/PlantationMonitoringReporting/PlantationHealthIssues/model');

// GET /api/responses - get all responses
exports.getResponses = async (req, res) => {
  try {
    const data = await Response.find()
      .populate('issueId')
      .populate('respondedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/responses/:issueId - get responses for a specific issue
exports.getResponsesByIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const data = await Response.find({ issueId })
      .populate('issueId')
      .populate('respondedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/responses - add a new response
exports.addResponse = async (req, res) => {
  try {
    const { issueId, responseText } = req.body;

    // Basic validation
    if (!issueId) {
      return res.status(400).json({ error: 'Issue ID is required' });
    }
    if (!responseText || typeof responseText !== 'string') {
      return res.status(400).json({ error: 'Response text is required and must be a string' });
    }

    const trimmedText = responseText.trim();
    if (trimmedText.length < 10) {
      return res.status(400).json({ error: 'Response text must be at least 10 characters long' });
    }
    if (trimmedText.length > 1000) {
      return res.status(400).json({ error: 'Response text cannot exceed 1000 characters' });
    }

    // Validate issue exists
    const issue = await PlantationHealthIssue.findById(issueId);
    if (!issue) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    const doc = new Response({
      issueId,
      responseText: trimmedText,
      respondedBy: req.user.id.toString(),
    });

    const saved = await doc.save();
    const populated = await Response.findById(saved._id).populate('issueId').populate('respondedBy', 'username');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error adding response:', err);
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/responses/:id - update a response
exports.updateResponse = async (req, res) => {
  try {
    const { responseText } = req.body;

    // Basic validation
    if (!responseText || typeof responseText !== 'string') {
      return res.status(400).json({ error: 'Response text is required and must be a string' });
    }

    const trimmedText = responseText.trim();
    if (trimmedText.length < 10) {
      return res.status(400).json({ error: 'Response text must be at least 10 characters long' });
    }
    if (trimmedText.length > 1000) {
      return res.status(400).json({ error: 'Response text cannot exceed 1000 characters' });
    }

    const updated = await Response.findByIdAndUpdate(
      req.params.id,
      { responseText: trimmedText },
      { new: true }
    ).populate('issueId').populate('respondedBy', 'username');

    if (!updated) return res.status(404).json({ error: 'Response not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating response:', err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/responses/:id - delete a response
exports.deleteResponse = async (req, res) => {
  try {
    const deleted = await Response.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Response not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
