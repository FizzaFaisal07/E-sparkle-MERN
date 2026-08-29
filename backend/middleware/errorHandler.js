const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('❌ Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = { status: 404, message };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `${field} already exists`;
        error = { status: 400, message };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error = { status: 400, message: messages.join(', ') };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = { status: 401, message: 'Invalid token' };
    }

    if (err.name === 'TokenExpiredError') {
        error = { status: 401, message: 'Token expired' };
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = { status: 400, message: 'File too large. Max size is 5MB.' };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = { status: 400, message: 'Unexpected file field' };
    }

    // Response
    const statusCode = error.status || 500;
    res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        })
    });
};

module.exports = { errorHandler };