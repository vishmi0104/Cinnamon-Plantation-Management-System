const express = require('express');
const router = express.Router();
const controller = require('../../Controllers/PlantationMonitoringReporting/orderController');
const { auth, requireRole } = require('../../middleware/auth');

// User routes (require authentication)
router.post('/', auth, controller.createOrder);
router.get('/my-orders', auth, controller.getUserOrders);

// Admin/Finance routes
router.get('/', auth, controller.getAllOrders);
router.put('/:id/status', auth, controller.updateOrderStatus);
router.get('/:id', auth, controller.getOrderById);
router.post('/:id/items', auth, requireRole(['factory', 'finance']), controller.addItemsToOrder);
router.put('/:id/items/:itemId', auth, requireRole(['factory', 'finance']), controller.updateOrderItemQuantity);
router.delete('/:id/items/:itemId', auth, requireRole(['factory', 'finance']), controller.deleteOrderItem);
router.put('/:id/delivery', auth, requireRole(['factory']), controller.assignDelivery);
router.delete('/:id/delivery', auth, requireRole(['factory']), controller.unassignDelivery);

module.exports = router;