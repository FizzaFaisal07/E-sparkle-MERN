const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// ========== HELPER: Find product by ANY identifier ==========
async function findProductByIdentifier(identifier) {
    console.log('🔍 Looking for product with identifier:', identifier, 'Type:', typeof identifier);
    
    // If identifier is a number or looks like a number
    const numericId = parseInt(identifier);
    if (!isNaN(numericId)) {
        console.log('🔍 Searching by numeric ID:', numericId);
        
        // Method 1: Try to find by numeric id field
        let product = await Product.findOne({ id: numericId });
        if (product) {
            console.log('✅ Found product by numeric id field:', product.name);
            return product;
        }
        
        // Method 2: Try to find by _id if it's a number string
        try {
            product = await Product.findById(identifier);
            if (product) {
                console.log('✅ Found product by _id:', product.name);
                return product;
            }
        } catch (e) {
            // Invalid ObjectId format, continue
        }
    }
    
    // Try as MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        try {
            const product = await Product.findById(identifier);
            if (product) {
                console.log('✅ Found product by ObjectId:', product.name);
                return product;
            }
        } catch (e) {
            // Ignore
        }
    }
    
    // Try to find by name (if identifier is a string)
    if (typeof identifier === 'string' && identifier.length > 2) {
        const product = await Product.findOne({ 
            name: { $regex: identifier, $options: 'i' } 
        });
        if (product) {
            console.log('✅ Found product by name:', product.name);
            return product;
        }
    }
    
    // LAST RESORT: Get ALL products and find by the numeric id
    // This handles products that don't have an 'id' field
    console.log('🔍 Searching all products for matching id...');
    const allProducts = await Product.find({});
    console.log(`📊 Found ${allProducts.length} total products in database`);
    
    for (const p of allProducts) {
        // Check if product has an 'id' field
        if (p.id !== undefined && p.id !== null) {
            if (String(p.id) === String(identifier)) {
                console.log('✅ Found product by id field:', p.name);
                return p;
            }
        }
        // Check if _id string matches
        if (String(p._id) === String(identifier)) {
            console.log('✅ Found product by _id string:', p.name);
            return p;
        }
        // Check if name matches
        if (p.name && p.name.toLowerCase() === String(identifier).toLowerCase()) {
            console.log('✅ Found product by name match:', p.name);
            return p;
        }
    }
    
    console.log('❌ Product not found for identifier:', identifier);
    return null;
}

// ========== GET WISHLIST ==========
exports.getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate('products.product', 'name price image category status stock');

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user._id,
                products: []
            });
        }

        res.json({
            success: true,
            count: wishlist.products.length,
            wishlist: wishlist.products
        });
    } catch (error) {
        console.error('❌ Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get wishlist'
        });
    }
};

// ========== ADD TO WISHLIST ==========
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        console.log('📦 Adding to wishlist:', { productId, user: req.user._id });

        // Find product using helper function
        const product = await findProductByIdentifier(productId);
        
        if (!product) {
            console.log('❌ Product not found for ID:', productId);
            return res.status(404).json({
                success: false,
                message: `Product not found with ID: ${productId}`
            });
        }

        console.log('✅ Product found:', product.name, 'ID:', product._id);

        // Get or create wishlist
        let wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = new Wishlist({
                user: req.user._id,
                products: []
            });
        }

        // Check if product already in wishlist
        const exists = wishlist.products.some(
            item => item.product.toString() === product._id.toString()
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        // Add to wishlist
        wishlist.products.push({ product: product._id });
        await wishlist.save();

        // Populate product details
        await wishlist.populate('products.product', 'name price image category');

        res.json({
            success: true,
            message: 'Product added to wishlist',
            wishlist: wishlist.products
        });
    } catch (error) {
        console.error('❌ Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add to wishlist'
        });
    }
};

// ========== REMOVE FROM WISHLIST ==========
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // Find product using helper function
        const product = await findProductByIdentifier(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        wishlist.products = wishlist.products.filter(
            item => item.product.toString() !== product._id.toString()
        );
        await wishlist.save();

        await wishlist.populate('products.product', 'name price image category');

        res.json({
            success: true,
            message: 'Product removed from wishlist',
            wishlist: wishlist.products
        });
    } catch (error) {
        console.error('❌ Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove from wishlist'
        });
    }
};

// ========== CHECK IF IN WISHLIST ==========
exports.checkWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // Find product using helper function
        const product = await findProductByIdentifier(productId);
        
        if (!product) {
            return res.json({
                success: true,
                inWishlist: false
            });
        }

        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            return res.json({
                success: true,
                inWishlist: false
            });
        }

        const exists = wishlist.products.some(
            item => item.product.toString() === product._id.toString()
        );

        res.json({
            success: true,
            inWishlist: exists
        });
    } catch (error) {
        console.error('❌ Check wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to check wishlist'
        });
    }
};

// ========== CLEAR WISHLIST ==========
exports.clearWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        wishlist.products = [];
        await wishlist.save();

        res.json({
            success: true,
            message: 'Wishlist cleared',
            wishlist: []
        });
    } catch (error) {
        console.error('❌ Clear wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to clear wishlist'
        });
    }
};

// ========== MOVE WISHLIST TO CART ==========
exports.moveToCart = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate('products.product');

        if (!wishlist || wishlist.products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Wishlist is empty'
            });
        }

        const items = wishlist.products.map(item => ({
            productId: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image,
            quantity: 1
        }));

        res.json({
            success: true,
            message: 'Wishlist items ready for cart',
            items: items
        });
    } catch (error) {
        console.error('❌ Move to cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to move to cart'
        });
    }
};