const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const issueSchema = new Schema(
  {
    plantIssueid: { type: String, unique: true, required: false },
    plotid: { type: Number, required: true },
    reportedBy: { type: Number, required: true },
    issueType: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    photoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

// Auto-generate plantIssueid like PI001, PI002, ...
issueSchema.pre('save', async function (next) {
  if (this.plantIssueid) return next();
  try {
    const last = await mongoose.model('PlantationHealthIssue')
      .findOne()
      .sort({ createdAt: -1 });

    let newNumber = 1;
    if (last?.plantIssueid) {
      const lastNum = parseInt(last.plantIssueid.replace('PI', ''), 10);
      if (!Number.isNaN(lastNum)) newNumber = lastNum + 1;
    }
    this.plantIssueid = 'PI' + newNumber.toString().padStart(3, '0');
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('PlantationHealthIssue', issueSchema);
