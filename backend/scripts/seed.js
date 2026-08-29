const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const seedDatabase = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('📡 Using URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('📊 Database:', mongoose.connection.name);

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        console.log('🧹 Cleared existing data');

        // ========== CREATE ADMIN USER ==========
        console.log('👑 Creating admin user...');
        const admin = new User({
            name: 'Admin',
            email: 'admin@esparkle.com',
            password: 'admin123',
            role: 'admin',
            isActive: true,
            phone: '+92 304-7892953'
        });
        await admin.save();
        console.log('✅ Admin created: admin@esparkle.com / admin123');

        // ========== CREATE SAMPLE USERS ==========
        console.log('👤 Creating sample users...');
        const users = [
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'john123',
                role: 'customer',
                phone: '+92 300-1234567',
                address: {
                    street: '123 Main Street',
                    city: 'Lahore',
                    state: 'Punjab',
                    zipCode: '54000',
                    country: 'Pakistan'
                }
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: 'jane123',
                role: 'customer',
                phone: '+92 301-7654321',
                address: {
                    street: '456 Park Avenue',
                    city: 'Karachi',
                    state: 'Sindh',
                    zipCode: '75500',
                    country: 'Pakistan'
                }
            }
        ];

        const createdUsers = [];
        for (const userData of users) {
            const user = new User(userData);
            await user.save();
            createdUsers.push(user);
            console.log(`✅ User created: ${user.email}`);
        }

        // ========== CREATE SAMPLE PRODUCTS ==========
        console.log('📦 Creating sample products...');
        const products = [
            {
                name: 'Diamond Elegance Necklace',
                description: 'Stunning diamond necklace with 18K gold setting.',
                price: 299.99,
                category: 'Necklaces',
                status: 'active',
                stock: 10,
                rating: 4.8,
                isFeatured: true,
                tags: ['diamond', 'gold', 'luxury']
            },
            {
                name: 'Gold Perfection Ring',
                description: 'Classic gold ring with perfect finish.',
                price: 149.99,
                category: 'Rings',
                status: 'active',
                stock: 15,
                rating: 4.9,
                isFeatured: true,
                tags: ['gold', 'ring', 'classic']
            },
            {
                name: 'Silver Sparkle Earrings',
                description: 'Elegant silver earrings with cubic zirconia.',
                price: 79.99,
                category: 'Earrings',
                status: 'active',
                stock: 20,
                rating: 4.6,
                isOnSale: true,
                discountPercentage: 20,
                originalPrice: 99.99,
                tags: ['silver', 'earrings', 'sparkle']
            },
            {
                name: 'Royal Gold Bangles',
                description: 'Traditional gold bangles with intricate design.',
                price: 199.99,
                category: 'Bangles',
                status: 'active',
                stock: 8,
                rating: 4.7,
                isFeatured: true,
                tags: ['gold', 'bangles', 'royal']
            },
            {
                name: 'Luxury Diamond Watch',
                description: 'Premium watch with diamond bezel.',
                price: 399.99,
                category: 'Watches',
                status: 'active',
                stock: 5,
                rating: 4.9,
                isOnSale: true,
                discountPercentage: 15,
                originalPrice: 469.99,
                isFeatured: true,
                tags: ['watch', 'diamond', 'luxury']
            }
        ];

        for (const productData of products) {
            const product = new Product({
                ...productData,
                createdBy: admin._id
            });
            await product.save();
        }
        console.log(`✅ Created ${products.length} sample products`);

        console.log('\n' + '='.repeat(50));
        console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log('\n📊 Summary:');
        console.log(`   👑 1 Admin`);
        console.log(`   👤 ${createdUsers.length} Users`);
        console.log(`   📦 ${products.length} Products`);
        console.log('\n🔑 Login Credentials:');
        console.log(`   Admin: admin@esparkle.com / admin123`);
        console.log(`   User1: john@example.com / john123`);
        console.log(`   User2: jane@example.com / jane123`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        console.error('📝 Error details:', error.message);
        process.exit(1);
    }
};

seedDatabase();