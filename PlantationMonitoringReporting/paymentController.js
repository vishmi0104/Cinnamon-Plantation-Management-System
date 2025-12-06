const PaymentMethod = require('../../Models/PlantationMonitoringReporting/PaymentMethod/model');
const PaymentTransaction = require('../../Models/PlantationMonitoringReporting/PaymentTransaction/model');
const Order = require('../../Models/PlantationMonitoringReporting/Orders/model');

// Get all payment methods for the current user
exports.getPaymentMethods = async (req, res) => {
    try {
        const userId = req.user.id;
        const paymentMethods = await PaymentMethod.find({
            user: userId,
            isActive: true
        }).select('-cvv'); // Don't send CVV in response

        res.json(paymentMethods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add new payment method
exports.addPaymentMethod = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, isDefault } = req.body;

        console.log('🔍 Payment method creation request:', {
            userId,
            cardNumber: cardNumber ? '****' + cardNumber.slice(-4) : 'undefined',
            cardHolderName,
            expiryMonth,
            expiryYear,
            cvv: cvv ? '***' : 'undefined',
            isDefault
        });

        // Clean and validate input data
        const cleanCardNumber = cardNumber.replace(/\s/g, ''); // Remove spaces
        const cleanExpiryMonth = expiryMonth.toString().padStart(2, '0'); // Ensure 2-digit format

        console.log('🧹 Cleaned data:', {
            cleanCardNumber: '****' + cleanCardNumber.slice(-4),
            cleanExpiryMonth,
            expiryYear: expiryYear.toString()
        });

        // Basic validation before creating model
        if (!/^\d{16}$/.test(cleanCardNumber)) {
            console.log('❌ Card number validation failed:', cleanCardNumber.length, 'digits');
            return res.status(400).json({ error: 'Card number must be 16 digits' });
        }
        if (!/^(0[1-9]|1[0-2])$/.test(cleanExpiryMonth)) {
            console.log('❌ Expiry month validation failed:', cleanExpiryMonth);
            return res.status(400).json({ error: 'Expiry month must be between 01-12' });
        }
        if (!/^\d{4}$/.test(expiryYear.toString())) {
            console.log('❌ Expiry year validation failed:', expiryYear);
            return res.status(400).json({ error: 'Expiry year must be 4 digits' });
        }
        if (!/^\d{3,4}$/.test(cvv)) {
            console.log('❌ CVV validation failed:', cvv.length, 'digits');
            return res.status(400).json({ error: 'CVV must be 3 or 4 digits' });
        }

        // Determine card type
        let cardType = 'unknown';
        if (cleanCardNumber.startsWith('4')) {
            cardType = 'visa';
        } else if (cleanCardNumber.startsWith('5') || cleanCardNumber.startsWith('2')) {
            cardType = 'mastercard';
        } else if (cleanCardNumber.startsWith('3')) {
            cardType = 'amex';
        } else if (cleanCardNumber.startsWith('6')) {
            cardType = 'discover';
        }

        console.log('💳 Determined card type:', cardType);

        // Check if this is the first payment method, make it default
        const existingMethods = await PaymentMethod.countDocuments({ user: userId, isActive: true });
        const shouldBeDefault = isDefault || existingMethods === 0;

        console.log('📊 Existing methods count:', existingMethods, 'should be default:', shouldBeDefault);

        const paymentMethod = new PaymentMethod({
            user: userId,
            cardNumber: cleanCardNumber,
            cardHolderName: cardHolderName.trim(),
            expiryMonth: cleanExpiryMonth,
            expiryYear: expiryYear.toString(),
            cvv,
            cardType,
            isDefault: shouldBeDefault,
        });

        console.log('💾 Attempting to save payment method...');
        const saved = await paymentMethod.save();
        console.log('✅ Payment method saved successfully:', saved._id);

        // Return without CVV for security
        const response = saved.toObject();
        delete response.cvv;

        res.status(201).json(response);
    } catch (err) {
        console.error('❌ Payment method creation error:', err.message);
        console.error('❌ Error details:', err);
        res.status(400).json({ error: err.message });
    }
};

// Update payment method
exports.updatePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        // Remove sensitive fields that shouldn't be updated
        delete updates.cardNumber;
        delete updates.cvv;
        delete updates.user;

        const updated = await PaymentMethod.findOneAndUpdate(
            { _id: id, user: userId },
            updates,
            { new: true }
        ).select('-cvv');

        if (!updated) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete payment method (soft delete)
exports.deletePaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const paymentMethod = await PaymentMethod.findOneAndUpdate(
            { _id: id, user: userId },
            { isActive: false },
            { new: true }
        );

        if (!paymentMethod) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        // If this was the default method, set another one as default
        if (paymentMethod.isDefault) {
            const nextDefault = await PaymentMethod.findOneAndUpdate(
                { user: userId, isActive: true, _id: { $ne: id } },
                { isDefault: true }
            );
        }

        res.json({ message: 'Payment method deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Set default payment method
exports.setDefaultPaymentMethod = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // First, unset all default flags for this user
        await PaymentMethod.updateMany(
            { user: userId },
            { isDefault: false }
        );

        // Then set the specified method as default
        const updated = await PaymentMethod.findOneAndUpdate(
            { _id: id, user: userId },
            { isDefault: true },
            { new: true }
        ).select('-cvv');

        if (!updated) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Process payment for an approved order
exports.processPayment = async (req, res) => {
    console.log('🔍 Payment processing request received:', {
        userId: req.user?.id,
        body: req.body,
        headers: req.headers.authorization ? 'Bearer token present' : 'No token'
    });

    try {
        const { orderId, paymentMethodId } = req.body;
        const userId = req.user.id;

        console.log('🔍 Extracted data:', { orderId, paymentMethodId, userId });

        // Verify order exists and belongs to user
        console.log('🔍 Checking order exists...');
        const order = await Order.findOne({ _id: orderId, user: userId });
        console.log('🔍 Order found:', order ? { id: order._id, status: order.status, user: order.user } : 'null');

        if (!order) {
            console.log('❌ Order not found or does not belong to user');
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if order is approved or payment required
        console.log('🔍 Checking order status:', order.status);
        if (order.status !== 'approved' && order.status !== 'payment_required') {
            console.log('❌ Invalid order status for payment:', order.status);
            return res.status(400).json({ error: 'Order must be approved before payment' });
        }

        // Verify payment method exists and belongs to user
        console.log('🔍 Checking payment method exists...');
        const paymentMethod = await PaymentMethod.findOne({
            _id: paymentMethodId,
            user: userId,
            isActive: true
        });
        console.log('🔍 Payment method found:', paymentMethod ? { id: paymentMethod._id, user: paymentMethod.user } : 'null');

        if (!paymentMethod) {
            console.log('❌ Payment method not found or does not belong to user');
            return res.status(404).json({ error: 'Payment method not found' });
        }

        // Check if payment already exists for this order
        console.log('🔍 Checking for existing payment...');
        const existingPayment = await PaymentTransaction.findOne({ order: orderId });
        console.log('🔍 Existing payment found:', existingPayment ? 'yes' : 'no');

        if (existingPayment) {
            console.log('❌ Payment already processed for this order');
            return res.status(400).json({ error: 'Payment already processed for this order' });
        }

        // Create payment transaction
        const paymentTransaction = new PaymentTransaction({
            order: orderId,
            user: userId,
            paymentMethod: paymentMethodId,
            amount: order.totalAmount,
            status: 'processing',
        });

        // Simulate payment processing (in real app, integrate with payment gateway)
        setTimeout(async () => {
            try {
                // Simulate successful payment
                await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
                    status: 'completed',
                    processedAt: new Date(),
                    paymentGatewayResponse: { success: true, transactionId: 'SIM_' + Date.now() }
                });

                // Update order status to completed
                await Order.findByIdAndUpdate(orderId, { status: 'completed' });
            } catch (error) {
                console.error('Payment processing failed:', error);
                await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
                    status: 'failed',
                    failureReason: 'Processing error'
                });
            }
        }, 2000); // Simulate 2-second processing time

        const saved = await paymentTransaction.save();

        res.status(201).json({
            message: 'Payment processing started',
            transactionId: saved.transactionId,
            amount: saved.amount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get payment transactions for user
exports.getPaymentTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await PaymentTransaction.find({ user: userId })
            .populate('order', 'orderId totalAmount')
            .populate('paymentMethod', 'cardType cardHolderName')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get payment transaction by ID
exports.getPaymentTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const transaction = await PaymentTransaction.findOne({
            _id: id,
            user: userId
        })
        .populate('order', 'orderId totalAmount status')
        .populate('paymentMethod', 'cardType cardHolderName');

        if (!transaction) {
            return res.status(404).json({ error: 'Payment transaction not found' });
        }

        res.json(transaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};