const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deliveryIssueSchema = new Schema(
  {
    deliveryIssueId: { type: String, unique: true, required: false },
    orderId: { type: String, required: true },
    reportedBy: { type: Number, required: true },
    issueType: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    photoUrl: { type: String, default: null },
    deliveryPerson: { type: String, required: true },
    customerName: { type: String },
    orderDate: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate deliveryIssueId like DI001, DI002, ...
deliveryIssueSchema.pre('save', async function (next) {
  if (this.deliveryIssueId) return next();
  try {
    const last = await mongoose.model('DeliveryIssue')
      .findOne()
      .sort({ createdAt: -1 });

    let newNumber = 1;
    if (last?.deliveryIssueId) {
      const lastNum = parseInt(last.deliveryIssueId.replace('DI', ''), 10);
      if (!Number.isNaN(lastNum)) newNumber = lastNum + 1;
    }
    this.deliveryIssueId = 'DI' + newNumber.toString().padStart(3, '0');
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('DeliveryIssue', deliveryIssueSchema);