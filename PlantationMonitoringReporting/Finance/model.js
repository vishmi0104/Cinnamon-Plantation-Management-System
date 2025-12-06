const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const financeSchema = new Schema({
    transactionId: {
        type: String,
        unique: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["income", "expense"],
    },
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    relatedInventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
    },
    relatedItemId: {
        type: String,
        default: "",
    },
    category: {
        type: String,
        enum: ["harvest", "resource", "final product", "delivery", "orders"],
        required: true,
    },
}, { timestamps: true });

// Auto-generate transactionId with prefix TXN + 3-digit sequence
financeSchema.pre("save", async function (next) {
    if (this.transactionId) return next(); // skip if already set

    try {
        const lastTransaction = await mongoose.model("Finance")
            .findOne({}, {}, { sort: { createdAt: -1 } });

        let newNumber = 1;
        if (lastTransaction && lastTransaction.transactionId) {
            const lastNum = parseInt(lastTransaction.transactionId.replace("TXN", ""), 10);
            if (!isNaN(lastNum)) {
                newNumber = lastNum + 1;
            }
        }

        this.transactionId = "TXN" + newNumber.toString().padStart(3, "0");
        next();
    } catch (err) {
        next(err);
    }
});

const Finance = mongoose.model('Finance', financeSchema);
module.exports = Finance;