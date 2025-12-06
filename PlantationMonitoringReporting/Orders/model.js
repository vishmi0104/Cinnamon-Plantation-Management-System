const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    itemId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    unit: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        required: true,
    },
    addedBy: {
        type: String,
        enum: ['user', 'factory'],
        default: 'user',
    },
});

const orderSchema = new Schema({
    orderId: {
        type: String,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'payment_required'],
        default: 'pending',
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    notes: {
        type: String,
        default: '',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: {
        type: Date,
    },
    deliveryAssignee: {
        type: String,
        default: '',
    },
    deliveryAssignedAt: {
        type: Date,
    },
}, { timestamps: true });

// Auto-generate orderId with prefix ORD + 3-digit sequence
orderSchema.pre("save", async function (next) {
    if (this.orderId) return next(); // skip if already set

    try {
        const lastOrder = await mongoose.model("Order")
            .findOne({}, {}, { sort: { createdAt: -1 } });

        let newNumber = 1;
        if (lastOrder && lastOrder.orderId) {
            const lastNum = parseInt(lastOrder.orderId.replace("ORD", ""), 10);
            if (!isNaN(lastNum)) {
                newNumber = lastNum + 1;
            }
        }

        this.orderId = "ORD" + newNumber.toString().padStart(3, "0");
        next();
    } catch (err) {
        next(err);
    }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;