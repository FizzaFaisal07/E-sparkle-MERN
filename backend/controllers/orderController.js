const Order = require('../models/Order');

// ========== CREATE ORDER ==========
exports.createOrder = async (req, res) => {
    try {
        console.log('📦 Creating order for user:', req.user?._id || 'Unknown');
        console.log('📦 Order data received:', req.body);
        
        const { items, shippingAddress, paymentMethod, notes } = req.body;

        // Validate required fields
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must have at least one item'
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address is required'
            });
        }

        // Process items
        let subtotal = 0;
        const orderItems = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Get product ID from various possible fields
            const productId = item.productId || item.id || item._id || null;
            
            // Use provided data
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            const productName = item.name || 'Product';
            const productImage = item.image || '';

            subtotal += price * quantity;

            // Add to order items
            orderItems.push({
                product: productId,
                productId: productId ? String(productId) : null,
                name: productName,
                price: price,
                quantity: quantity,
                image: productImage
            });
        }

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid items in order'
            });
        }

        // Calculate totals
        const shippingCost = subtotal > 100 ? 0 : 10;
        const tax = subtotal * 0.05;
        const totalAmount = subtotal + shippingCost + tax;

        // Create order object
        const orderData = {
            user: req.user._id,
            items: orderItems,
            subtotal,
            shippingCost,
            tax,
            totalAmount,
            shippingAddress: {
                fullName: shippingAddress.fullName || req.user.name || 'Customer',
                phone: shippingAddress.phone || req.user.phone || 'N/A',
                address: shippingAddress.address || 'N/A',
                city: shippingAddress.city || 'N/A',
                state: shippingAddress.state || '',
                zipCode: shippingAddress.zipCode || 'N/A',
                country: shippingAddress.country || 'Pakistan'
            },
            paymentMethod: paymentMethod || 'cash_on_delivery',
            notes: notes || ''
        };

        // Create and save order
        const order = new Order(orderData);
        await order.save();
        
        // Populate order for response
        await order.populate('user', 'name email phone');
        
        console.log('✅ Order created successfully:', order.orderNumber || order._id);

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: order
        });

    } catch (error) {
        console.error('❌ Create order error:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + errors.join(', ')
            });
        }
        
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ========== GET MY ORDERS ==========
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('❌ Get orders error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get orders'
        });
    }
};

// ========== GET ORDER BY ID ==========
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone address');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        return res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('❌ Get order error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get order'
        });
    }
};

// ========== CANCEL ORDER ==========
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a delivered order'
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled'
            });
        }

        order.status = 'cancelled';
        await order.save();

        return res.json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.error('❌ Cancel order error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel order'
        });
    }
};

// ========== GET ALL ORDERS (ADMIN) ==========
exports.getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name email phone');

        const total = await Order.countDocuments(filter);

        return res.json({
            success: true,
            count: orders.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            orders
        });
    } catch (error) {
        console.error('❌ Get all orders error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get orders'
        });
    }
};

// ========== UPDATE ORDER STATUS (ADMIN) ==========
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (status === 'delivered' && order.status !== 'delivered') {
            order.deliveredAt = new Date();
        }

        order.status = status;
        await order.save();

        return res.json({
            success: true,
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('❌ Update order status error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update order status'
        });
    }
};

// ========== UPDATE PAYMENT STATUS (ADMIN) ==========
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const validStatuses = ['pending', 'paid', 'failed', 'refunded'];

        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.paymentStatus = paymentStatus;
        if (paymentStatus === 'paid' && !order.paymentId) {
            order.paymentId = `PAY-${Date.now()}`;
        }
        await order.save();

        return res.json({
            success: true,
            message: 'Payment status updated successfully',
            order
        });
    } catch (error) {
        console.error('❌ Update payment status error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update payment status'
        });
    }
};

// ========== DELETE ORDER (ADMIN) ==========
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        await order.deleteOne();

        return res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete order error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete order'
        });
    }
};

// ========== GET ORDER STATS (ADMIN) ==========
exports.getOrderStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email');

        return res.json({
            success: true,
            stats: {
                totalOrders,
                totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                byStatus: stats,
                recentOrders
            }
        });
    } catch (error) {
        console.error('❌ Get order stats error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get order statistics'
        });
    }
};