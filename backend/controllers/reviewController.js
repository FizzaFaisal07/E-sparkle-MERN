const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// ========== GET PRODUCT REVIEWS ==========
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        console.log(`📖 Fetching reviews for product ID: ${productId}`);

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Try to find product in database
        let product = null;
        let productFound = false;

        // Method 1: Try as MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(productId)) {
            try {
                product = await Product.findById(productId);
                if (product) productFound = true;
            } catch (e) {
                console.log('⚠️ Not a valid ObjectId, trying other methods');
            }
        }

        // Method 2: Try as numeric ID
        if (!productFound && !isNaN(parseInt(productId))) {
            try {
                product = await Product.findOne({ id: parseInt(productId) });
                if (product) productFound = true;
                console.log(`🔍 Found product by numeric ID: ${productId}`);
            } catch (e) {
                console.log('⚠️ Product not found by numeric ID');
            }
        }

        // Method 3: Try by name (for default products)
        if (!productFound) {
            try {
                const allProducts = await Product.find({});
                for (const p of allProducts) {
                    if (String(p.id) === String(productId) || 
                        String(p._id) === String(productId) ||
                        (p.name && p.name.toLowerCase().includes(String(productId).toLowerCase()))) {
                        product = p;
                        productFound = true;
                        console.log(`🔍 Found product: ${product.name}`);
                        break;
                    }
                }
            } catch (e) {
                console.log('⚠️ Error searching products by name');
            }
        }

        // If product not found in DB, return empty reviews (not 404)
        if (!productFound) {
            console.log(`⚠️ Product ${productId} not in database, returning empty reviews`);
            return res.json({
                success: true,
                count: 0,
                total: 0,
                page: parseInt(page),
                totalPages: 0,
                reviews: [],
                rating: {
                    averageRating: 0,
                    reviewCount: 0
                },
                message: 'Product not in database, but you can still view reviews'
            });
        }

        // If product exists, get its reviews
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const query = { product: product._id };

        let reviews = await Review.find(query)
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(query);

        // Calculate average rating
        const ratingResult = await Review.aggregate([
            { $match: query },
            { $group: {
                _id: null,
                avg: { $avg: '$rating' },
                count: { $sum: 1 }
            }}
        ]);

        const averageRating = ratingResult.length > 0 ? Math.round(ratingResult[0].avg * 10) / 10 : 0;
        const reviewCount = ratingResult.length > 0 ? ratingResult[0].count : 0;

        console.log(`✅ Found ${reviews.length} reviews for product: ${product.name}`);

        res.json({
            success: true,
            count: reviews.length,
            total: total || 0,
            page: parseInt(page),
            totalPages: Math.ceil((total || 0) / parseInt(limit)),
            reviews: reviews || [],
            rating: {
                averageRating: averageRating || 0,
                reviewCount: reviewCount || 0
            }
        });
    } catch (error) {
        console.error('❌ Get reviews error:', error);
        // Return empty reviews instead of error
        res.json({
            success: true,
            count: 0,
            total: 0,
            page: 1,
            totalPages: 0,
            reviews: [],
            rating: {
                averageRating: 0,
                reviewCount: 0
            }
        });
    }
};

// ========== GET PRODUCT RATING ==========
exports.getProductRating = async (req, res) => {
    try {
        const { productId } = req.params;

        let product = null;
        let productFound = false;

        if (mongoose.Types.ObjectId.isValid(productId)) {
            try {
                product = await Product.findById(productId);
                if (product) productFound = true;
            } catch (e) {}
        }

        if (!productFound && !isNaN(parseInt(productId))) {
            try {
                product = await Product.findOne({ id: parseInt(productId) });
                if (product) productFound = true;
            } catch (e) {}
        }

        if (!productFound) {
            return res.json({
                success: true,
                rating: {
                    averageRating: 0,
                    reviewCount: 0
                }
            });
        }

        const reviews = await Review.find({ product: product._id });
        let averageRating = 0;
        if (reviews.length > 0) {
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            averageRating = Math.round((total / reviews.length) * 10) / 10;
        }

        res.json({
            success: true,
            rating: {
                averageRating,
                reviewCount: reviews.length
            }
        });
    } catch (error) {
        console.error('❌ Get rating error:', error);
        res.json({
            success: true,
            rating: {
                averageRating: 0,
                reviewCount: 0
            }
        });
    }
};

// ========== CREATE REVIEW ==========
exports.createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, title, comment } = req.body;

        console.log(`📝 Creating review for product: ${productId}`);
        console.log(`📝 User: ${req.user._id}, Rating: ${rating}, Comment: ${comment}`);

        // Validate input
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Rating and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        if (comment.length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be at least 5 characters'
            });
        }

        // Find product - try multiple methods
        let product = null;
        let productFound = false;

        // Method 1: Try as MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(productId)) {
            try {
                product = await Product.findById(productId);
                if (product) {
                    productFound = true;
                    console.log(`✅ Found product by ObjectId: ${product.name}`);
                }
            } catch (e) {
                console.log('⚠️ Not a valid ObjectId');
            }
        }

        // Method 2: Try as numeric ID
        if (!productFound && !isNaN(parseInt(productId))) {
            try {
                product = await Product.findOne({ id: parseInt(productId) });
                if (product) {
                    productFound = true;
                    console.log(`✅ Found product by numeric ID: ${product.name}`);
                }
            } catch (e) {
                console.log('⚠️ Product not found by numeric ID');
            }
        }

        // Method 3: Search by name (for default products)
        if (!productFound) {
            try {
                const allProducts = await Product.find({});
                for (const p of allProducts) {
                    if (String(p.id) === String(productId) || 
                        String(p._id) === String(productId)) {
                        product = p;
                        productFound = true;
                        console.log(`✅ Found product in all products: ${product.name}`);
                        break;
                    }
                }
            } catch (e) {
                console.log('⚠️ Error searching products');
            }
        }

        // Method 4: Create a temporary product for default products
        if (!productFound) {
            console.log(`⚠️ Product ${productId} not in database, creating temporary product`);
            
            try {
                // Check if product exists with this name or ID
                const existingProduct = await Product.findOne({ 
                    $or: [
                        { id: parseInt(productId) },
                        { name: { $regex: `^Product ${productId}$`, $options: 'i' } }
                    ]
                });

                if (existingProduct) {
                    product = existingProduct;
                    productFound = true;
                    console.log(`✅ Found existing product: ${product.name}`);
                } else {
                    // Create a new product
                    const newProduct = new Product({
                        id: !isNaN(parseInt(productId)) ? parseInt(productId) : Date.now(),
                        name: `Product ${productId}`,
                        price: 0,
                        description: 'Product created from review',
                        category: 'General',
                        status: 'active',
                        stock: 0,
                        createdBy: req.user._id
                    });
                    
                    await newProduct.save();
                    product = newProduct;
                    productFound = true;
                    console.log(`✅ Created temporary product: ${product.name}`);
                }
            } catch (err) {
                console.error('❌ Error creating temporary product:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create product for review: ' + err.message
                });
            }
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user already reviewed this product
        try {
            const existingReview = await Review.findOne({
                product: product._id,
                user: req.user._id
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already reviewed this product'
                });
            }
        } catch (err) {
            console.warn('⚠️ Could not check existing review:', err.message);
        }

        // Check if user purchased this product (optional)
        let verifiedPurchase = false;
        try {
            const orders = await Order.find({
                user: req.user._id,
                status: { $in: ['delivered', 'shipped'] }
            });
            
            for (const order of orders) {
                if (order.items && order.items.some(item => 
                    item.product && item.product.toString() === product._id.toString()
                )) {
                    verifiedPurchase = true;
                    break;
                }
            }
        } catch (err) {
            console.warn('⚠️ Could not verify purchase:', err.message);
        }

        // Create the review
        const review = new Review({
            product: product._id,
            user: req.user._id,
            rating: parseInt(rating),
            title: title || '',
            comment: comment.trim(),
            verifiedPurchase: verifiedPurchase
        });

        await review.save();
        await review.populate('user', 'name');

        console.log(`✅ Review created successfully for: ${product.name}`);

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review: {
                _id: review._id,
                rating: review.rating,
                title: review.title,
                comment: review.comment,
                user: review.user,
                createdAt: review.createdAt,
                verifiedPurchase: review.verifiedPurchase,
                helpfulCount: 0
            }
        });

    } catch (error) {
        console.error('❌ Create review error:', error);
        console.error('❌ Error stack:', error.stack);
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

        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reviews'
            });
        }

        if (rating) review.rating = rating;
        if (title !== undefined) review.title = title;
        if (comment) review.comment = comment;

        await review.save();
        await review.populate('user', 'name');

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

        if (!review.helpfulUsers) {
            review.helpfulUsers = [];
        }

        const userIndex = review.helpfulUsers.indexOf(req.user._id);
        
        if (userIndex !== -1) {
            review.helpfulUsers.splice(userIndex, 1);
            review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
            await review.save();
            
            return res.json({
                success: true,
                message: 'Removed helpful mark',
                helpfulCount: review.helpfulCount || 0
            });
        }

        review.helpfulUsers.push(req.user._id);
        review.helpfulCount = (review.helpfulCount || 0) + 1;
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

// ============================================================
// GET ALL REVIEWS (ADMIN)
// ============================================================
exports.getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { comment: { $regex: search, $options: 'i' } },
                    { title: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const reviews = await Review.find(filter)
            .populate('user', 'name email')
            .populate('product', 'name price image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(filter);

        // Calculate stats
        const stats = await Review.aggregate([
            { $match: filter },
            { $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }}
        ]);

        res.json({
            success: true,
            count: reviews.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            reviews,
            stats: stats.length > 0 ? {
                averageRating: Math.round(stats[0].averageRating * 10) / 10,
                totalReviews: stats[0].totalReviews
            } : {
                averageRating: 0,
                totalReviews: 0
            }
        });
    } catch (error) {
        console.error('❌ Get all reviews error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get reviews'
        });
    }
};
// ============================================================
// GET REVIEW BY ID (ADMIN)
// ============================================================
exports.getReviewById = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId)
            .populate('user', 'name email phone')
            .populate('product', 'name price image category');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            review
        });
    } catch (error) {
        console.error('❌ Get review by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get review'
        });
    }
};