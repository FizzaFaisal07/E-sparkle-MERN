const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }]
}, {
    timestamps: true
});

// Calculate total items in cart
CartSchema.methods.getTotalItems = function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
};

// Calculate subtotal
CartSchema.methods.getSubtotal = async function() {
    await this.populate('items.product');
    return this.items.reduce((total, item) => {
        const price = item.product.isOnSale && item.product.discountPercentage > 0
            ? item.product.price * (1 - item.product.discountPercentage / 100)
            : item.product.price;
        return total + (price * item.quantity);
    }, 0);
};

// Add item to cart
CartSchema.methods.addItem = function(productId, quantity = 1) {
    const existingItem = this.items.find(
        item => item.product.toString() === productId.toString()
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        this.items.push({ product: productId, quantity });
    }
    return this;
};

// Remove item from cart
CartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(
        item => item.product.toString() !== productId.toString()
    );
    return this;
};

// Update item quantity
CartSchema.methods.updateQuantity = function(productId, quantity) {
    const item = this.items.find(
        item => item.product.toString() === productId.toString()
    );
    
    if (item) {
        if (quantity <= 0) {
            this.removeItem(productId);
        } else {
            item.quantity = quantity;
        }
    }
    return this;
};

// Clear cart
CartSchema.methods.clearCart = function() {
    this.items = [];
    return this;
};

// ✅ Check if model exists before creating
module.exports = mongoose.models.Cart || mongoose.model('Cart', CartSchema);