const Order = require('../../Models/PlantationMonitoringReporting/Orders/model');
const User = require('../../Models/User');
const Finance = require('../../Models/PlantationMonitoringReporting/Finance/model');
const Inventory = require('../../Models/PlantationMonitoringReporting/Inventory/model');

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { items, totalAmount, notes } = req.body;
        const userId = req.user.id; // Assuming auth middleware sets req.user

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }

        // Create order
        const order = new Order({
            user: userId,
            items: items.map(item => ({ ...item, addedBy: 'user' })),
            totalAmount,
            notes: notes || '',
        });

        const savedOrder = await order.save();

        // Note: Finance transaction will be created when order is approved/rejected
        // This prevents premature expense recording

        res.status(201).json(savedOrder);
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get orders for the current user
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ user: userId })
            .populate('approvedBy', 'username')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all orders (for finance managers)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'username')
            .populate('approvedBy', 'username')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update order status (approve/reject)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const financeManagerId = req.user.id;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order
        order.status = status;
        if (status === 'approved' || status === 'rejected') {
            order.approvedBy = financeManagerId;
            order.approvedAt = new Date();
        }
        if (notes) {
            order.notes = notes;
        }

        const updatedOrder = await order.save();

        // Create finance transaction based on approval status
        if (status === 'approved') {
            const financeDoc = new Finance({
                type: 'income', // Customer payment is income for the company
                description: `Order ${order.orderId} approved - payment received`,
                amount: order.totalAmount,
                relatedInventoryId: order._id, // Using order ID as related inventory for now
                relatedItemId: order.orderId,
                category: 'orders', // Sales transaction
            });
            await financeDoc.save();

            // Update order status to indicate payment is required
            order.status = 'payment_required';
            await order.save();

            res.json({
                ...updatedOrder.toObject(),
                status: 'payment_required',
                message: 'Order approved. User can now proceed to payment.',
                requiresPayment: true
            });
        } else if (status === 'rejected') {
            // No finance transaction for rejected orders (no payment received)
            // Could potentially create a refund transaction if payment was already processed
            res.json(updatedOrder);
        } else {
            res.json(updatedOrder);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id)
            .populate('user', 'username')
            .populate('approvedBy', 'username');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add items to an existing order (factory manager)
exports.addItemsToOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // [{ itemId, quantity }]

        console.log('[addItemsToOrder] request', {
            orderId: id,
            items,
            user: req.user?.id,
        });

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required' });
        }

        let order;
        try {
            order = await Order.findById(id);
        } catch (e) {
            console.error('[addItemsToOrder] invalid order id', e?.message);
            return res.status(400).json({ error: 'Invalid order id' });
        }
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'rejected') {
            return res.status(400).json({ error: `Cannot modify a ${order.status} order` });
        }

        if (!Array.isArray(order.items)) {
            order.items = [];
        }

        // Normalize inputs (support custom items with provided fields)
        const normalized = items.map(it => ({
            itemId: it.itemId !== undefined ? String(it.itemId) : undefined,
            quantity: Number(it.quantity),
            price: it.price !== undefined ? Number(it.price) : undefined,
            name: it.name,
            unit: it.unit,
            category: it.category,
            isCustom: Boolean(it.isCustom)
        }));
        for (const it of normalized) {
            if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
                return res.status(400).json({ error: 'Each item requires positive quantity' });
            }
            if (it.isCustom) {
                if (!it.name || !it.unit || !it.category) {
                    return res.status(400).json({ error: 'Custom item requires name, unit, and category' });
                }
                if (!Number.isFinite(it.price) || it.price < 0) {
                    return res.status(400).json({ error: 'Custom item price must be a non-negative number' });
                }
                // Generate a stable custom itemId if not provided
                if (!it.itemId) {
                    it.itemId = `CUSTOM-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                }
            } else if (!it.itemId) {
                return res.status(400).json({ error: 'Inventory item requires itemId' });
            }
            if (it.price !== undefined && (!Number.isFinite(it.price) || it.price < 0)) {
                return res.status(400).json({ error: 'Price must be a non-negative number when provided' });
            }
        }

        // Build combined list of inventory lookups for inventory-backed items and any existing items lacking price
        const itemIds = normalized.filter(i => !i.isCustom).map(i => i.itemId);
        const existingNeedingPrice = (order.items || [])
            .filter(l => !Number.isFinite(Number(l.price)))
            .map(l => l.itemId)
            .filter(Boolean);
        const combinedIds = [...new Set([...itemIds, ...existingNeedingPrice])];
        const inventoryDocs = await Inventory.find({ itemId: { $in: combinedIds } });
        console.log('[addItemsToOrder] fetched inventory', inventoryDocs.map(d => ({ itemId: d.itemId, qty: d.quantity, price: d.price })));
        const itemIdToInv = new Map(inventoryDocs.map(doc => [doc.itemId, doc]));

        // Hydrate missing prices on existing lines to avoid validation errors (coerce invalid to 0)
        let hydratedExisting = false;
        if (Array.isArray(order.items) && order.items.length > 0) {
            for (const line of order.items) {
                const priceNum = Number(line.price);
                if (!Number.isFinite(priceNum) || priceNum < 0) {
                    const inv = itemIdToInv.get(line.itemId);
                    let invPrice = inv ? Number(inv.price) : NaN;
                    if (!Number.isFinite(invPrice) || invPrice < 0) {
                        console.warn('[addItemsToOrder] Coercing invalid existing line price to 0 for', line.itemId, line.name, inv?.price);
                        invPrice = 0;
                    }
                    line.price = invPrice;
                    hydratedExisting = true;
                }
            }
            if (hydratedExisting) {
                const before = Number(order.totalAmount || 0);
                const fixedTotal = (order.items || []).reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 0)), 0);
                order.totalAmount = Number(fixedTotal.toFixed(2));
                console.log('[addItemsToOrder] hydrated existing prices', { before, after: order.totalAmount });
            }
        }

        // Validate availability for inventory-backed items only
        for (const reqItem of normalized.filter(x => !x.isCustom)) {
            const inv = itemIdToInv.get(reqItem.itemId);
            if (!inv) {
                return res.status(404).json({ error: `Inventory item ${reqItem.itemId} not found` });
            }
            if (inv.quantity < reqItem.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${inv.name}. Available: ${inv.quantity} ${inv.unit}` });
            }
        }

        // Build order line items and total (prefer provided price; else inventory; coerce invalid to 0)
        let additionalAmount = 0;
        const newLineItems = [];
        for (const reqItem of normalized) {
            if (reqItem.isCustom) {
                const priceNumber = Number(reqItem.price);
                additionalAmount += priceNumber * reqItem.quantity;
                newLineItems.push({
                    itemId: reqItem.itemId,
                    name: reqItem.name,
                    category: reqItem.category,
                    unit: reqItem.unit,
                    price: priceNumber,
                    quantity: reqItem.quantity,
                    addedBy: 'factory',
                });
            } else {
                const inv = itemIdToInv.get(reqItem.itemId);
                let priceNumber = (reqItem.price !== undefined) ? Number(reqItem.price) : Number(inv.price);
                if (!Number.isFinite(priceNumber) || priceNumber < 0) {
                    console.warn('[addItemsToOrder] Coercing invalid price to 0 for', inv?.itemId, inv?.name, inv?.price);
                    priceNumber = 0;
                }
                additionalAmount += priceNumber * reqItem.quantity;
                newLineItems.push({
                    itemId: inv.itemId,
                    name: inv.name,
                    category: inv.category,
                    unit: inv.unit,
                    price: priceNumber,
                    quantity: reqItem.quantity,
                    addedBy: 'factory',
                });
            }
        }

        // Decrement inventory safely per item with compensation if any step fails (inventory-backed only)
        const decremented = [];
        for (const reqItem of normalized.filter(x => !x.isCustom)) {
            const updated = await Inventory.findOneAndUpdate(
                { itemId: reqItem.itemId, quantity: { $gte: reqItem.quantity } },
                { $inc: { quantity: -reqItem.quantity } },
                { new: true }
            );
            if (!updated) {
                // rollback previous decrements
                for (const done of decremented) {
                    await Inventory.updateOne(
                        { itemId: done.itemId },
                        { $inc: { quantity: done.quantity } }
                    );
                }
                return res.status(409).json({ error: 'Inventory changed, please try again' });
            }
            decremented.push({ itemId: reqItem.itemId, quantity: reqItem.quantity });
        }

        // Append to order and recompute total from all lines for safety
        order.items = order.items.concat(newLineItems);
        const newTotal = (order.items || []).reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 0)), 0);
        order.totalAmount = Number(newTotal.toFixed(2));

        const saved = await order.save();
        console.log('[addItemsToOrder] success', { orderId: saved._id, totalAmount: saved.totalAmount, addedLines: newLineItems.length });
        res.json(saved);
    } catch (err) {
        console.error('Error adding items to order:', err?.message, err?.stack);
        res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
};

// Helper to recompute totalAmount safely
const recomputeOrderTotal = (order) => {
    const total = (order.items || []).reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 0)), 0);
    order.totalAmount = Number(total.toFixed(2));
};

// Update an existing order item's quantity (factory/finance)
exports.updateOrderItemQuantity = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { quantity } = req.body;

        if (!itemId) {
            return res.status(400).json({ error: 'Item ID is required' });
        }
        if (quantity === undefined || quantity === null) {
            return res.status(400).json({ error: 'Quantity is required' });
        }
        const qtyNum = Number(quantity);
        if (!Number.isFinite(qtyNum) || qtyNum < 0) {
            return res.status(400).json({ error: 'Quantity must be a non-negative number' });
        }

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status === 'rejected') {
            return res.status(400).json({ error: `Cannot modify a ${order.status} order` });
        }

        if (!Array.isArray(order.items)) order.items = [];
        const lineIdx = order.items.findIndex(it => it.itemId === itemId);
        if (lineIdx === -1) return res.status(404).json({ error: 'Order item not found' });

        const currentLine = order.items[lineIdx];
        const currentQty = Number(currentLine.quantity || 0);
        const newQty = Number(quantity);

        if (newQty === currentQty) return res.json(order);

        // Adjust inventory based on delta
        const delta = newQty - currentQty; // positive means need to take more from inventory; negative means return to stock
        if (delta > 0) {
            const updated = await Inventory.findOneAndUpdate(
                { itemId, quantity: { $gte: delta } },
                { $inc: { quantity: -delta } },
                { new: true }
            );
            if (!updated) return res.status(409).json({ error: 'Not enough stock to increase quantity' });
        } else if (delta < 0) {
            await Inventory.updateOne({ itemId }, { $inc: { quantity: Math.abs(delta) } });
        }

        order.items[lineIdx].quantity = newQty;
        recomputeOrderTotal(order);
        const saved = await order.save();
        res.json(saved);
    } catch (err) {
        console.error('Error updating order item quantity:', err?.message, err?.stack);
        res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
};

// Delete an item from order (factory/finance)
exports.deleteOrderItem = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status === 'rejected') {
            return res.status(400).json({ error: `Cannot modify a ${order.status} order` });
        }

        if (!Array.isArray(order.items)) order.items = [];
        const lineIdx = order.items.findIndex(it => it.itemId === itemId);
        if (lineIdx === -1) return res.status(404).json({ error: 'Order item not found' });

        const line = order.items[lineIdx];
        // Return stock
        if (Number(line.quantity) > 0) {
            await Inventory.updateOne({ itemId }, { $inc: { quantity: Number(line.quantity) } });
        }

        // Remove item and recompute total
        order.items.splice(lineIdx, 1);
        recomputeOrderTotal(order);
        const saved = await order.save();
        res.json(saved);
    } catch (err) {
        console.error('Error deleting order item:', err?.message, err?.stack);
        res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
};

// Assign delivery assignee name (factory)
exports.assignDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryAssignee } = req.body;

        if (!deliveryAssignee || !String(deliveryAssignee).trim()) {
            return res.status(400).json({ error: 'deliveryAssignee is required' });
        }

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.deliveryAssignee = String(deliveryAssignee).trim();
        order.deliveryAssignedAt = new Date();
        const saved = await order.save();
        res.json(saved);
    } catch (err) {
        console.error('Error assigning delivery:', err?.message, err?.stack);
        res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
};

// Unassign delivery (factory)
exports.unassignDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.deliveryAssignee = '';
        order.deliveryAssignedAt = undefined;
        const saved = await order.save();
        res.json(saved);
    } catch (err) {
        console.error('Error unassigning delivery:', err?.message, err?.stack);
        res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
};