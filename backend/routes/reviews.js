const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ========== PUBLIC ROUTES ==========
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/product/:productId/rating', reviewController.getProductRating);

// ========== ADMIN ROUTES ==========
// ✅ GET ALL REVIEWS
router.get('/', verifyToken, isAdmin, reviewController.getAllReviews);

// ✅ GET SINGLE REVIEW BY ID (ADD THIS)
router.get('/:reviewId', verifyToken, isAdmin, reviewController.getReviewById);

// ========== PROTECTED ROUTES ==========
router.post('/:productId', verifyToken, reviewController.createReview);
router.put('/:reviewId', verifyToken, reviewController.updateReview);
router.delete('/:reviewId', verifyToken, reviewController.deleteReview);
router.post('/:reviewId/helpful', verifyToken, reviewController.markHelpful);

module.exports = router;