const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deliveryResponseSchema = new Schema(
  {
    responseId: { type: String, required: false },
    deliveryIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryIssue', required: true },
    responseText: { type: String, required: true },
    respondedBy: { type: String, required: true }, // username or user id
    actionTaken: { type: String },
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' }
  },
  { timestamps: true }
);

// Auto-generate responseId like DR001, DR002, ...
deliveryResponseSchema.pre('save', async function (next) {
  if (this.responseId) return next();
  try {
    const last = await mongoose.model('DeliveryResponse')
      .findOne()
      .sort({ createdAt: -1 });

    let newNumber = 1;
    if (last?.responseId) {
      const lastNum = parseInt(last.responseId.replace('DR', ''), 10);
      if (!Number.isNaN(lastNum)) newNumber = lastNum + 1;
    }
    this.responseId = 'DR' + newNumber.toString().padStart(3, '0');
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('DeliveryResponse', deliveryResponseSchema);