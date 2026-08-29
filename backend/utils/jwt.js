const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
    try {
        const token = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );
        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Failed to generate token');
    }
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            success: true,
            data: decoded
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Decode JWT token (without verification)
const decodeToken = (token) => {
    try {
        const decoded = jwt.decode(token);
        return {
            success: true,
            data: decoded
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

// Get token expiration time
const getTokenExpiration = (token) => {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
    }
    return null;
};

// Check if token is expired
const isTokenExpired = (token) => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    return Date.now() >= expiration.getTime();
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    getTokenExpiration,
    isTokenExpired
};