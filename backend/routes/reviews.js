const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/product/:productId/rating', reviewController.getProductRating);

// Protected routes
router.post('/:productId', verifyToken, reviewController.createReview);
router.put('/:reviewId', verifyToken, reviewController.updateReview);
router.delete('/:reviewId', verifyToken, reviewController.deleteReview);
router.post('/:reviewId/helpful', verifyToken, reviewController.markHelpful);

module.exports = router;