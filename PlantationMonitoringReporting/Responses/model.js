const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const responseSchema = new Schema(
  {
    responseId: { type: String, required: false },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlantationHealthIssue', required: true },
    responseText: { type: String, required: true },
    respondedBy: { type: String, required: true }, // username or user id
  },
  { timestamps: true }
);

// Auto-generate responseId like R001, R002, ...
responseSchema.pre('save', async function (next) {
  if (this.responseId) return next();
  try {
    const last = await mongoose.model('Response')
      .findOne()
      .sort({ createdAt: -1 });

    let newNumber = 1;
    if (last?.responseId) {
      const lastNum = parseInt(last.responseId.replace('R', ''), 10);
      if (!Number.isNaN(lastNum)) newNumber = lastNum + 1;
    }
    this.responseId = 'R' + newNumber.toString().padStart(3, '0');
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Response', responseSchema);
