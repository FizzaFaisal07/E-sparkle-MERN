const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ========== GET PRODUCT REVIEWS ==========
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find({ product: productId })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ product: productId });

        res.json({
            success: true,
            count: reviews.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            reviews
        });
    } catch (error) {
        console.error('❌ Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get reviews'
        });
    }
};

// ========== GET PRODUCT RATING ==========
exports.getProductRating = async (req, res) => {
    try {
        const { productId } = req.params;

        const rating = await Review.getAverageRating(productId);

        res.json({
            success: true,
            rating
        });
    } catch (error) {
        console.error('❌ Get rating error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get rating'
        });
    }
};

// ========== CREATE REVIEW ==========
exports.createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, title, comment } = req.body;

        // Validate
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Rating and comment are required'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user._id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }

        // Check if user purchased this product (optional verification)
        let verifiedPurchase = false;
        try {
            const orders = await Order.find({
                user: req.user._id,
                status: { $in: ['delivered', 'shipped'] }
            });
            
            // Check if product is in any order
            for (const order of orders) {
                if (order.items.some(item => 
                    item.product.toString() === productId
                )) {
                    verifiedPurchase = true;
                    break;
                }
            }
        } catch (err) {
            console.warn('⚠️ Could not verify purchase:', err.message);
        }

        // Create review
        const review = new Review({
            product: productId,
            user: req.user._id,
            rating,
            title: title || '',
            comment,
            verifiedPurchase
        });

        await review.save();

        // Populate user info
        await review.populate('user', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review
        });
    } catch (error) {
        console.error('❌ Create review error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create review'
        });
    }
};

// ========== UPDATE REVIEW ==========
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, comment } = req.body;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership
        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reviews'
            });
        }

        // Update fields
        if (rating) review.rating = rating;
        if (title !== undefined) review.title = title;
        if (comment) review.comment = comment;

        await review.save();
        await review.populate('user', 'name avatar');

        res.json({
            success: true,
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('❌ Update review error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update review'
        });
    }
};

// ========== DELETE REVIEW ==========
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership or admin
        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        await review.deleteOne();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete review error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete review'
        });
    }
};

// ========== MARK REVIEW HELPFUL ==========
exports.markHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user already marked helpful
        if (review.helpfulUsers.includes(req.user._id)) {
            // Remove helpful
            review.helpfulUsers = review.helpfulUsers.filter(
                id => id.toString() !== req.user._id.toString()
            );
            review.helpfulCount = review.helpfulUsers.length;
            await review.save();
            
            return res.json({
                success: true,
                message: 'Removed helpful mark',
                helpfulCount: review.helpfulCount
            });
        }

        // Add helpful
        review.helpfulUsers.push(req.user._id);
        review.helpfulCount = review.helpfulUsers.length;
        await review.save();

        res.json({
            success: true,
            message: 'Marked as helpful',
            helpfulCount: review.helpfulCount
        });
    } catch (error) {
        console.error('❌ Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark helpful'
        });
    }
};