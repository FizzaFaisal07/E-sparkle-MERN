const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        default: function() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `ESP-${year}${month}${day}-${random}`;
        }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'Product',
            required: false
        },
        productId: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        image: String
    }],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    shippingAddress: {
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: String,
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'Pakistan'
        }
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'card', 'bank_transfer', 'stripe'],
        default: 'cash_on_delivery'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: String,
    notes: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    deliveredAt: Date
}, {
    timestamps: true
});

// ============================================================
// SINGLE PRE-SAVE HOOK - Generate order number and calculate total
// ============================================================
OrderSchema.pre('save', async function() {
    // Generate order number for new orders
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');

        this.orderNumber = `ESP-${year}${month}${day}-${random}`;

        console.log('📦 Generated order number:', this.orderNumber);
    }

    // Calculate total amount
    if (
        this.isModified('subtotal') ||
        this.isModified('discountAmount') ||
        this.isModified('shippingCost') ||
        this.isModified('tax') ||
        !this.totalAmount
    ) {
        this.totalAmount =
            this.subtotal -
            this.discountAmount +
            this.shippingCost +
            this.tax;
    }
});

// Indexes
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'shippingAddress.phone': 1 });
OrderSchema.index({ orderNumber: 1 });

// Check if model exists before creating
module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);