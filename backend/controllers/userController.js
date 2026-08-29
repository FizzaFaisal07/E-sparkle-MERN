const User = require('../models/User');
const Order = require('../models/Order');

// ========== GET ALL USERS (ADMIN) ==========
exports.getAllUsers = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) filter.role = role;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            count: users.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get users'
        });
    }
};

// ========== GET USER BY ID (ADMIN) ==========
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user statistics
        const orderCount = await Order.countDocuments({ user: user._id });
        const totalSpent = await Order.aggregate([
            { $match: { user: user._id, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                stats: {
                    orderCount,
                    totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get user'
        });
    }
};

// ========== UPDATE USER (ADMIN) ==========
exports.updateUser = async (req, res) => {
    try {
        const { name, email, phone, role, isActive, address } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent changing admin role
        if (user.role === 'admin' && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change admin role'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (address) {
            user.address = {
                ...user.address,
                ...address
            };
        }

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update user'
        });
    }
};

// ========== DELETE USER (ADMIN) ==========
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting admin
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }

        // Check if user has orders
        const orderCount = await Order.countDocuments({ user: user._id });
        if (orderCount > 0) {
            // Soft delete - deactivate instead
            user.isActive = false;
            await user.save();
            return res.json({
                success: true,
                message: 'User has orders. Account deactivated instead of deleted.'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete user'
        });
    }
};

// ========== GET USER STATS (ADMIN) ==========
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const customerUsers = await User.countDocuments({ role: 'customer' });

        // Users joined in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsers = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                adminUsers,
                customerUsers,
                newUsersLast7Days: newUsers
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get user statistics'
        });
    }
};

// ========== BULK DELETE USERS (ADMIN) ==========
exports.bulkDeleteUsers = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs are required'
            });
        }

        // Prevent deleting admins
        const admins = await User.find({
            _id: { $in: ids },
            role: 'admin'
        });

        if (admins.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        const result = await User.deleteMany({
            _id: { $in: ids },
            role: { $ne: 'admin' }
        });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} users`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Bulk delete users error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete users'
        });
    }
};