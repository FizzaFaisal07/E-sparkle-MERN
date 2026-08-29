const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ========== ADMIN ROUTES ==========

// Get all users (admin)
router.get('/', verifyToken, isAdmin, userController.getAllUsers);

// Get single user (admin)
router.get('/:id', verifyToken, isAdmin, userController.getUserById);

// Update user (admin)
router.put('/:id', verifyToken, isAdmin, userController.updateUser);

// Delete user (admin)
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

// Get user statistics (admin)
router.get('/stats/overview', verifyToken, isAdmin, userController.getUserStats);

// Bulk delete users (admin)
router.delete(
    '/bulk/delete',
    verifyToken,
    isAdmin,
    userController.bulkDeleteUsers
);

module.exports = router;