const { body, validationResult } = require('express-validator');

// Validation rules
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    };
};

// User validation rules
const userValidation = {
    register: [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
            .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
            .isLength({ max: 50 }).withMessage('Password cannot exceed 50 characters'),
        body('phone')
            .optional()
            .trim()
            .matches(/^\+?[\d\s-]{8,15}$/).withMessage('Please enter a valid phone number')
    ],
    login: [
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please enter a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
    ],
    updateProfile: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
            .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
        body('phone')
            .optional()
            .trim()
            .matches(/^\+?[\d\s-]{8,15}$/).withMessage('Please enter a valid phone number'),
        body('address')
            .optional()
            .isObject().withMessage('Address must be an object')
    ],
    changePassword: [
        body('currentPassword')
            .notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    ]
};

// Product validation rules
const productValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty().withMessage('Product name is required')
            .isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
            .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
        body('price')
            .notEmpty().withMessage('Price is required')
            .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('category')
            .notEmpty().withMessage('Category is required')
            .isIn(['Necklaces', 'Rings', 'Earrings', 'Bangles', 'Watches', 'Sale'])
            .withMessage('Invalid category'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
        body('stock')
            .optional()
            .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
        body('status')
            .optional()
            .isIn(['active', 'inactive', 'draft']).withMessage('Invalid status'),
        body('isOnSale')
            .optional()
            .isBoolean().withMessage('isOnSale must be a boolean'),
        body('discountPercentage')
            .optional()
            .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
    ],
    update: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
            .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
        body('price')
            .optional()
            .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('category')
            .optional()
            .isIn(['Necklaces', 'Rings', 'Earrings', 'Bangles', 'Watches', 'Sale'])
            .withMessage('Invalid category'),
        body('stock')
            .optional()
            .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
        body('status')
            .optional()
            .isIn(['active', 'inactive', 'draft']).withMessage('Invalid status')
    ]
};

// Order validation rules
const orderValidation = {
    create: [
        body('items')
            .isArray({ min: 1 }).withMessage('Order must have at least one item'),
        body('items.*.productId')
            .notEmpty().withMessage('Product ID is required'),
        body('items.*.quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('shippingAddress')
            .isObject().withMessage('Shipping address is required'),
        body('shippingAddress.fullName')
            .notEmpty().withMessage('Full name is required'),
        body('shippingAddress.phone')
            .notEmpty().withMessage('Phone number is required'),
        body('shippingAddress.address')
            .notEmpty().withMessage('Address is required'),
        body('shippingAddress.city')
            .notEmpty().withMessage('City is required'),
        body('shippingAddress.zipCode')
            .notEmpty().withMessage('ZIP code is required'),
        body('paymentMethod')
            .optional()
            .isIn(['cash_on_delivery', 'card', 'stripe']).withMessage('Invalid payment method')
    ]
};

module.exports = {
    validate,
    userValidation,
    productValidation,
    orderValidation
};