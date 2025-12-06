const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentTransactionSchema = new Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    paymentMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    transactionId: {
        type: String,
        unique: true,
    },
    paymentGatewayResponse: {
        type: Schema.Types.Mixed,
        default: {},
    },
    failureReason: {
        type: String,
        default: '',
    },
    processedAt: {
        type: Date,
    },
}, { timestamps: true });

// Auto-generate transactionId with prefix PAY + 3-digit sequence
paymentTransactionSchema.pre("save", async function (next) {
    if (this.transactionId) return next();

    try {
        const lastTransaction = await mongoose.model("PaymentTransaction")
            .findOne({}, {}, { sort: { createdAt: -1 } });

        let newNumber = 1;
        if (lastTransaction && lastTransaction.transactionId) {
            const lastNum = parseInt(lastTransaction.transactionId.replace("PAY", ""), 10);
            if (!isNaN(lastNum)) {
                newNumber = lastNum + 1;
            }
        }

        this.transactionId = "PAY" + newNumber.toString().padStart(3, "0");
        next();
    } catch (err) {
        next(err);
    }
});

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
module.exports = PaymentTransaction;