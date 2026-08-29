const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Product Tests', () => {
    let adminToken;
    let productId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/esparkle_test');
        
        // Create admin user and get token
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Admin',
                email: 'admin@test.com',
                password: 'admin123',
                role: 'admin'
            });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'admin123'
            });
        adminToken = loginRes.body.token;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    describe('POST /api/products', () => {
        it('should create a product (admin only)', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Product',
                    price: 99.99,
                    category: 'Necklaces',
                    description: 'A test product',
                    stock: 10
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.product).toHaveProperty('name', 'Test Product');
            productId = res.body.product._id;
        });

        it('should reject non-admin users', async () => {
            // Create regular user
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Regular User',
                    email: 'user@test.com',
                    password: 'user123'
                });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'user@test.com',
                    password: 'user123'
                });

            const userToken = loginRes.body.token;

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Test Product 2',
                    price: 49.99,
                    category: 'Rings'
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/products', () => {
        it('should get all products', async () => {
            const res = await request(app)
                .get('/api/products');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products).toBeInstanceOf(Array);
            expect(res.body.count).toBeGreaterThan(0);
        });

        it('should filter products by category', async () => {
            const res = await request(app)
                .get('/api/products?category=Necklaces');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products.every(p => p.category === 'Necklaces')).toBe(true);
        });

        it('should filter products by price range', async () => {
            const res = await request(app)
                .get('/api/products?minPrice=50&maxPrice=100');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.products.every(p => p.price >= 50 && p.price <= 100)).toBe(true);
        });
    });

    describe('GET /api/products/:id', () => {
        it('should get product by id', async () => {
            const res = await request(app)
                .get(`/api/products/${productId}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product).toHaveProperty('_id', productId);
        });

        it('should return 404 for non-existent product', async () => {
            const res = await request(app)
                .get('/api/products/123456789012');

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product (admin only)', async () => {
            const res = await request(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Product',
                    price: 149.99
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.product).toHaveProperty('name', 'Updated Product');
            expect(res.body.product).toHaveProperty('price', 149.99);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete product (admin only)', async () => {
            const res = await request(app)
                .delete(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('deleted');
        });

        it('should verify product is deleted', async () => {
            const res = await request(app)
                .get(`/api/products/${productId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });
});