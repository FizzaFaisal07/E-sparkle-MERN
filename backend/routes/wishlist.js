const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(verifyToken);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Add product to wishlist
router.post('/add/:productId', wishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.checkWishlist);

// Clear wishlist
router.delete('/clear', wishlistController.clearWishlist);

// Move all wishlist items to cart
router.post('/move-to-cart', wishlistController.moveToCart);

module.exports = router;