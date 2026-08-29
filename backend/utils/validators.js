// Validate email
const isValidEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{8,15}$/;
    return phoneRegex.test(phone);
};

// Validate URL
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Validate product category
const isValidCategory = (category) => {
    const categories = ['Necklaces', 'Rings', 'Earrings', 'Bangles', 'Watches', 'Sale'];
    return categories.includes(category);
};

// Validate order status
const isValidOrderStatus = (status) => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    return statuses.includes(status);
};

// Validate payment method
const isValidPaymentMethod = (method) => {
    const methods = ['cash_on_delivery', 'card', 'bank_transfer', 'stripe'];
    return methods.includes(method);
};

// Validate payment status
const isValidPaymentStatus = (status) => {
    const statuses = ['pending', 'paid', 'failed', 'refunded'];
    return statuses.includes(status);
};

// Sanitize input
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove HTML tags
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/"/g, '\\"') // Escape quotes
            .replace(/\n/g, '\\n') // Escape newlines
            .replace(/\r/g, '\\r'); // Escape carriage returns
    }
    return input;
};

// Validate object properties
const validateObject = (obj, requiredFields = []) => {
    const errors = [];
    
    for (const field of requiredFields) {
        if (!obj[field]) {
            errors.push(`${field} is required`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidUrl,
    isValidCategory,
    isValidOrderStatus,
    isValidPaymentMethod,
    isValidPaymentStatus,
    sanitizeInput,
    validateObject
};