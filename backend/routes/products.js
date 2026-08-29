const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { validate, productValidation } = require('../middleware/validation');

// ========== PUBLIC ROUTES ==========

// Get all products with filters
router.get('/', productController.getAllProducts);

// Get featured products
router.get('/featured', productController.getFeaturedProducts);

// Get products by category
router.get('/category/:category', productController.getProductsByCategory);

// Get single product
router.get('/:id', productController.getProductById);

// Get related products
router.get('/:id/related', productController.getRelatedProducts);

// ========== ADMIN ROUTES ==========

// Create product
router.post(
    '/',
    verifyToken,
    isAdmin,
    validate(productValidation.create),
    productController.createProduct
);

// Update product
router.put(
    '/:id',
    verifyToken,
    isAdmin,
    validate(productValidation.update),
    productController.updateProduct
);

// Delete product
router.delete(
    '/:id',
    verifyToken,
    isAdmin,
    productController.deleteProduct
);

// Bulk sync products
router.post(
    '/sync',
    verifyToken,
    isAdmin,
    productController.syncProducts
);

// Bulk delete products
router.delete(
    '/bulk/delete',
    verifyToken,
    isAdmin,
    productController.bulkDeleteProducts
);

// Upload product image
router.post(
    '/:id/image',
    verifyToken,
    isAdmin,
    productController.uploadProductImage
);

// Delete product image
router.delete(
    '/:id/image/:publicId',
    verifyToken,
    isAdmin,
    productController.deleteProductImage
);

module.exports = router;