import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import categoryRoutes from '../routes/categoryRoutes';
import productRoutes from '../routes/productRoutes';
import Category from '../models/categoryModel';
import Product from '../models/productModel';

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

describe('Category API', () => {
  test('GET /api/v1/category/get-category - success', async () => {
    const category = new Category({ name: 'Electronics' });
    await category.save();

    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(1);
    expect(response.body.category[0].name).toBe('Electronics');
  });

  test('GET /api/v1/category/get-category - no categories', async () => {
    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(0);
  });
});

describe('Product API', () => {
  test('GET /api/v1/product/product-list/:page - success', async () => {
    const product = new Product({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    await product.save();

    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('GET /api/v1/product/product-list/:page - no products', async () => {
    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(0);
  });

  test('GET /api/v1/product/product-count - success', async () => {
    const product = new Product({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    await product.save();

    const response = await request(app).get('/api/v1/product/product-count');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  test('POST /api/v1/product/product-filters - filter by category', async () => {
    const category = new Category({ name: 'Electronics' });
    await category.save();
    const product = new Product({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop', category: category._id });
    await product.save();

    const response = await request(app).post('/api/v1/product/product-filters').send({ checked: [category._id], radio: [] });
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('POST /api/v1/product/product-filters - filter by price', async () => {
    const product1 = new Product({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    const product2 = new Product({ name: 'Phone', price: 500, description: 'A smart phone', slug: 'phone' });
    await product1.save();
    await product2.save();

    const response = await request(app).post('/api/v1/product/product-filters').send({ checked: [], radio: [[0, 600]] });
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].name).toBe('Phone');
  });
});
