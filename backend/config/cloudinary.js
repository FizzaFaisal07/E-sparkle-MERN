const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Test connection
const testConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary connected successfully');
        return result;
    } catch (error) {
        console.error('❌ Cloudinary connection error:', error.message);
        return null;
    }
};

// Upload image to Cloudinary
const uploadImage = async (file, options = {}) => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: options.folder || 'esparkle/products',
            resource_type: 'auto',
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
                { width: options.width || 800, crop: 'limit' }
            ],
            ...options
        });
        return {
            success: true,
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: true,
            result
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Get image URL with transformations
const getImageUrl = (publicId, options = {}) => {
    return cloudinary.url(publicId, {
        transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
            ...(options.transformation || [])
        ],
        ...options
    });
};

module.exports = {
    cloudinary,
    testConnection,
    uploadImage,
    deleteImage,
    getImageUrl
};