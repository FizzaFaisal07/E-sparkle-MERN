const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

// ========== PUBLIC ROUTES ==========

// Register new user
router.post(
    '/register',
    validate(userValidation.register),
    authController.register
);

// Login user
router.post(
    '/login',
    validate(userValidation.login),
    authController.login
);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

// ========== PROTECTED ROUTES ==========

// Get current user profile
router.get('/me', verifyToken, authController.getProfile);

// Update user profile
router.put(
    '/me',
    verifyToken,
    validate(userValidation.updateProfile),
    authController.updateProfile
);

// Change password
router.put(
    '/change-password',
    verifyToken,
    validate(userValidation.changePassword),
    authController.changePassword
);

// Update avatar
router.put(
    '/avatar',
    verifyToken,
    authController.updateAvatar
);

// Logout (invalidate token - client side)
router.post('/logout', verifyToken, authController.logout);

module.exports = router;