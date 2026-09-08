const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ========== USER ROUTES ==========

// Create order - REMOVED validation middleware
router.post('/', verifyToken, orderController.createOrder);

// Get user's orders
router.get('/my-orders', verifyToken, orderController.getMyOrders);

// Get single order
router.get('/:id', verifyToken, orderController.getOrderById);

// Cancel order
router.put('/:id/cancel', verifyToken, orderController.cancelOrder);

// ========== ADMIN ROUTES ==========

// Get all orders (admin)
router.get('/', verifyToken, isAdmin, orderController.getAllOrders);

// Update order status (admin)
router.put('/:id/status', verifyToken, isAdmin, orderController.updateOrderStatus);

// Update order payment status (admin)
router.put('/:id/payment', verifyToken, isAdmin, orderController.updatePaymentStatus);

// Delete order (admin)
router.delete('/:id', verifyToken, isAdmin, orderController.deleteOrder);

// Get order statistics (admin)
router.get('/stats/overview', verifyToken, isAdmin, orderController.getOrderStats);

module.exports = router;