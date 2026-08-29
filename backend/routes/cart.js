const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

// All cart routes are protected
router.use(verifyToken);

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update item quantity
router.put('/update/:productId', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:productId', cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

// Get cart count
router.get('/count', cartController.getCartCount);

// Get cart total
router.get('/total', cartController.getCartTotal);

module.exports = router;