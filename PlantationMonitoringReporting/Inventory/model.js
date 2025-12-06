const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
    itemId: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ["harvest", "resource", "final product"],
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        required: true,
        enum: ["kg", "liters", "pieces", "boxes", "bags"],
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    reorderLevel: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        default: "",
    },
    supplier: {
        type: String,
        default: "",
    },
    manufactureDate: {
        type: Date,
        default: null,
    },
    expireDate: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ["Available", "Low Stock", "Out of Stock"],
        default: "Available",
    },
    relatedHarvestId: {
        type: String,
        default: "",
    },
    relatedBatchId: {
        type: String,
        default: "",
    },
}, { timestamps: true });

// Auto-generate itemId with prefix INV + 3-digit sequence
inventorySchema.pre("save", async function (next) {
    if (this.itemId) return next(); // skip if already set

    try {
        const lastItem = await mongoose.model("Inventory")
            .findOne({}, {}, { sort: { createdAt: -1 } });

        let newNumber = 1;
        if (lastItem && lastItem.itemId) {
            const lastNum = parseInt(lastItem.itemId.replace("INV", ""), 10);
            if (!isNaN(lastNum)) {
                newNumber = lastNum + 1;
            }
        }

        this.itemId = "INV" + newNumber.toString().padStart(3, "0");
        next();
    } catch (err) {
        next(err);
    }
});

// Pre-save hook to calculate status based on quantity and reorderLevel
inventorySchema.pre('save', function(next) {
    if (this.quantity <= 0) {
        this.status = "Out of Stock";
    } else if (this.quantity <= this.reorderLevel) {
        this.status = "Low Stock";
    } else {
        this.status = "Available";
    }
    next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
