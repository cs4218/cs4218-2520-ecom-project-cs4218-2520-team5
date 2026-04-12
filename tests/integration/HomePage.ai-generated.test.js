import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import categoryRoutes from '../routes/categoryRoutes'; // Assuming you have category routes
import productRoutes from '../routes/productRoutes'; // Assuming you have product routes
import Category from '../models/categoryModel'; // Assuming you have a Category model
import Product from '../models/productModel'; // Assuming you have a Product model

let mongoServer, app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
  app = express();
  app.use(express.json());
  app.use('/api/v1/category', categoryRoutes);
  app.use('/api/v1/product', productRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Category.deleteMany({});
  await Product.deleteMany({});
});

describe('GET /api/v1/category/get-category', () => {
  test('should return all categories', async () => {
    const category = new Category({ name: 'Electronics' });
    await category.save();

    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(1);
    expect(response.body.category[0].name).toBe('Electronics');
  });

  test('should return an empty array if no categories exist', async () => {
    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(0);
  });
});

describe('GET /api/v1/product/product-list/:page', () => {
  test('should return products for the given page', async () => {
    const product = new Product({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    await product.save();

    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('should return an empty array if no products exist', async () => {
    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(0);
  });
});

describe('GET /api/v1/product/product-count', () => {
  test('should return the total count of products', async () => {
    const product1 = new Product({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    const product2 = new Product({ name: 'Phone', price: 500, description: 'A smartphone', slug: 'phone' });
    await product1.save();
    await product2.save();

    const response = await request(app).get('/api/v1/product/product-count');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  test('should return zero if no products exist', async () => {
    const response = await request(app).get('/api/v1/product/product-count');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
  });
});
