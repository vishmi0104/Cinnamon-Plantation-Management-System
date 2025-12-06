const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentMethodSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cardNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Basic card number validation (16 digits)
                return /^\d{16}$/.test(v.replace(/\s/g, ''));
            },
            message: 'Card number must be 16 digits'
        }
    },
    cardHolderName: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'Card holder name is required'
        }
    },
    expiryMonth: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^(0[1-9]|1[0-2])$/.test(v);
            },
            message: 'Expiry month must be between 01-12'
        }
    },
    expiryYear: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                const currentYear = new Date().getFullYear();
                const year = parseInt(v);
                // Allow years from 2020 onwards for testing
                return year >= 2020 && year <= currentYear + 20;
            },
            message: 'Expiry year must be valid (2020 or later)'
        }
    },
    cvv: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{3,4}$/.test(v);
            },
            message: 'CVV must be 3 or 4 digits'
        }
    },
    cardType: {
        type: String,
        enum: ['visa', 'mastercard', 'amex', 'discover', 'unknown'],
        default: 'unknown',
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Pre-save middleware to determine card type
paymentMethodSchema.pre('save', function(next) {
    const cardNumber = this.cardNumber.replace(/\s/g, '');

    if (cardNumber.startsWith('4')) {
        this.cardType = 'visa';
    } else if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) {
        this.cardType = 'mastercard';
    } else if (cardNumber.startsWith('3')) {
        this.cardType = 'amex';
    } else if (cardNumber.startsWith('6')) {
        this.cardType = 'discover';
    } else {
        this.cardType = 'unknown'; // Default fallback
    }

    next();
});

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await mongoose.model('PaymentMethod').updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
module.exports = PaymentMethod;