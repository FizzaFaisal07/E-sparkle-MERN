const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // REMOVED the deprecated options
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️  Retrying connection in 5 seconds...');
            setTimeout(connectDB, 5000);
        } else {
            console.log('❌ Failed to connect to MongoDB. Please check your connection string.');
            process.exit(1);
        }
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed through app termination');
    process.exit(0);
});

module.exports = connectDB;