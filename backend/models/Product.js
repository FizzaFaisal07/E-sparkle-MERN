const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            minlength: [2, 'Product name must be at least 2 characters'],
            maxlength: [100, 'Product name cannot exceed 100 characters']
        },

        description: {
            type: String,
            required: [true, 'Product description is required'],
            trim: true
        },

        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        },

        originalPrice: {
            type: Number,
            min: [0, 'Original price cannot be negative']
        },

        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true
        },

        stock: {
            type: Number,
            required: [true, 'Stock is required'],
            min: [0, 'Stock cannot be negative'],
            default: 0
        },

        status: {
            type: String,
            enum: ['active', 'inactive', 'out_of_stock'],
            default: 'active'
        },

        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },

        isFeatured: {
            type: Boolean,
            default: false
        },

        isOnSale: {
            type: Boolean,
            default: false
        },

        discountPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        tags: {
            type: [String],
            default: []
        },

        images: {
            type: [String],
            default: []
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.Product ||
    mongoose.model('Product', ProductSchema);