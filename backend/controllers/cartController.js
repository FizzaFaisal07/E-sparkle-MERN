const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ========== GET CART ==========
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price image isOnSale discountPercentage');

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
            await cart.save();
        }

        // Calculate cart totals
        const subtotal = await cart.getSubtotal();
        const totalItems = cart.getTotalItems();

        res.json({
            success: true,
            cart: {
                items: cart.items,
                subtotal,
                totalItems
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get cart'
        });
    }
};

// ========== ADD TO CART ==========
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Validate product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Product is not available'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock`
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Add item
        cart.addItem(productId, quantity);
        await cart.save();

        // Get updated cart with populated products
        await cart.populate('items.product', 'name price image isOnSale discountPercentage');

        const subtotal = await cart.getSubtotal();
        const totalItems = cart.getTotalItems();

        res.json({
            success: true,
            message: 'Item added to cart',
            cart: {
                items: cart.items,
                subtotal,
                totalItems
            }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add item to cart'
        });
    }
};

// ========== UPDATE CART ITEM ==========
exports.updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Check if item exists in cart
        const itemExists = cart.items.some(
            item => item.product.toString() === productId
        );

        if (!itemExists) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Validate product stock
        if (quantity > 0) {
            const product = await Product.findById(productId);
            if (product && product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} items available in stock`
                });
            }
        }

        // Update or remove item
        if (quantity === 0) {
            cart.removeItem(productId);
        } else {
            cart.updateQuantity(productId, quantity);
        }

        await cart.save();
        await cart.populate('items.product', 'name price image isOnSale discountPercentage');

        const subtotal = await cart.getSubtotal();
        const totalItems = cart.getTotalItems();

        res.json({
            success: true,
            message: 'Cart updated successfully',
            cart: {
                items: cart.items,
                subtotal,
                totalItems
            }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update cart'
        });
    }
};

// ========== REMOVE FROM CART ==========
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.removeItem(productId);
        await cart.save();
        await cart.populate('items.product', 'name price image isOnSale discountPercentage');

        const subtotal = await cart.getSubtotal();
        const totalItems = cart.getTotalItems();

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart: {
                items: cart.items,
                subtotal,
                totalItems
            }
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove item from cart'
        });
    }
};

// ========== CLEAR CART ==========
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.clearCart();
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared successfully',
            cart: {
                items: [],
                subtotal: 0,
                totalItems: 0
            }
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to clear cart'
        });
    }
};

// ========== GET CART COUNT ==========
exports.getCartCount = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        const count = cart ? cart.getTotalItems() : 0;

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get cart count'
        });
    }
};

// ========== GET CART TOTAL ==========
exports.getCartTotal = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        let total = 0;
        
        if (cart) {
            await cart.populate('items.product');
            total = await cart.getSubtotal();
        }

        res.json({
            success: true,
            total
        });
    } catch (error) {
        console.error('Get cart total error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get cart total'
        });
    }
};