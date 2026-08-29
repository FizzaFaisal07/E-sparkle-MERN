const Product = require('../models/Product');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// ========== GET ALL PRODUCTS ==========
exports.getAllProducts = async (req, res) => {
    try {
        const {
            category,
            status,
            isOnSale,
            search,
            minPrice,
            maxPrice,
            sort,
            page = 1,
            limit = 20
        } = req.query;

        // Build filter
        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (isOnSale !== undefined) filter.isOnSale = isOnSale === 'true';
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (search) {
            filter.$text = { $search: search };
        }

        // Build sort
        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort === 'name') sortOption = { name: 1 };
        else if (sort === 'rating') sortOption = { rating: -1 };

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email');

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            count: products.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get products'
        });
    }
};

// ========== GET PRODUCT BY ID ==========
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('reviews.user', 'name avatar');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get product'
        });
    }
};

// ========== CREATE PRODUCT ==========
exports.createProduct = async (req, res) => {
    try {
        const productData = {
            ...req.body,
            createdBy: req.user._id
        };

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create product'
        });
    }
};

// ========== UPDATE PRODUCT ==========
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update fields
        Object.assign(product, req.body);
        await product.save();

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update product'
        });
    }
};

// ========== DELETE PRODUCT ==========
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete images from Cloudinary if they exist
        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0];
            await deleteFromCloudinary(`esparkle/products/${publicId}`);
        }
        if (product.images && product.images.length > 0) {
            for (const img of product.images) {
                const publicId = img.split('/').pop().split('.')[0];
                await deleteFromCloudinary(`esparkle/products/${publicId}`);
            }
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete product'
        });
    }
};

// ========== SYNC PRODUCTS ==========
exports.syncProducts = async (req, res) => {
    try {
        const { products } = req.body;
        
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid products data'
            });
        }

        const results = {
            created: 0,
            updated: 0,
            errors: []
        };

        for (const productData of products) {
            try {
                const existing = await Product.findOne({
                    $or: [{ name: productData.name }, { id: productData.id }]
                });

                if (existing) {
                    Object.assign(existing, {
                        name: productData.name || existing.name,
                        price: productData.price || existing.price,
                        category: productData.category || existing.category,
                        status: productData.status || existing.status,
                        image: productData.image || existing.image,
                        isOnSale: productData.isOnSale || existing.isOnSale,
                        discountPercentage: productData.discountPercentage || existing.discountPercentage,
                        stock: productData.stock || existing.stock
                    });
                    await existing.save();
                    results.updated++;
                } else {
                    const newProduct = new Product({
                        name: productData.name,
                        price: productData.price,
                        category: productData.category || 'General',
                        status: productData.status || 'active',
                        image: productData.image || '',
                        isOnSale: productData.isOnSale || false,
                        discountPercentage: productData.discountPercentage || 0,
                        stock: productData.stock || 0,
                        createdBy: req.user._id
                    });
                    await newProduct.save();
                    results.created++;
                }
            } catch (err) {
                results.errors.push({
                    product: productData.name,
                    error: err.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Sync completed',
            results
        });
    } catch (error) {
        console.error('Sync products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to sync products'
        });
    }
};

// ========== GET FEATURED PRODUCTS ==========
exports.getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({
            isFeatured: true,
            status: 'active'
        })
            .limit(8)
            .populate('createdBy', 'name');

        res.json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get featured products'
        });
    }
};

// ========== GET PRODUCTS BY CATEGORY ==========
exports.getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20 } = req.query;

        const products = await Product.find({
            category,
            status: 'active'
        })
            .limit(parseInt(limit))
            .populate('createdBy', 'name');

        res.json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get products by category'
        });
    }
};

// ========== GET RELATED PRODUCTS ==========
exports.getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const related = await Product.find({
            category: product.category,
            status: 'active',
            _id: { $ne: product._id }
        })
            .limit(4)
            .populate('createdBy', 'name');

        res.json({
            success: true,
            count: related.length,
            products: related
        });
    } catch (error) {
        console.error('Get related products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get related products'
        });
    }
};

// ========== UPLOAD PRODUCT IMAGE ==========
exports.uploadProductImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'products');
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error || 'Failed to upload image'
            });
        }

        // Update product
        if (!product.image) {
            product.image = result.url;
        }
        product.images.push(result.url);
        await product.save();

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            url: result.url,
            publicId: result.publicId
        });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
};

// ========== DELETE PRODUCT IMAGE ==========
exports.deleteProductImage = async (req, res) => {
    try {
        const { id, publicId } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete from Cloudinary
        await deleteFromCloudinary(publicId);

        // Remove from product
        product.images = product.images.filter(img => {
            const pid = img.split('/').pop().split('.')[0];
            return pid !== publicId;
        });

        if (product.image && product.image.includes(publicId)) {
            product.image = product.images.length > 0 ? product.images[0] : '';
        }

        await product.save();

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete image'
        });
    }
};

// ========== BULK DELETE PRODUCTS ==========
exports.bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Product IDs are required'
            });
        }

        const result = await Product.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} products`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete products'
        });
    }
};