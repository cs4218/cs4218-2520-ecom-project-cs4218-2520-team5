import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import routes from '../routes'; // Assuming routes are exported from a file
import Category from '../models/Category'; // Assuming Category model is defined
import Product from '../models/Product'; // Assuming Product model is defined

let mongoServer, app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(express.json());
  app.use('/api/v1', routes);
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
    expect(response.body.category).toHaveLength(1);
    expect(response.body.category[0].name).toBe('Electronics');
  });

  test('should return empty array if no categories', async () => {
    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category).toHaveLength(0);
  });
});

describe('GET /api/v1/product/product-list/:page', () => {
  test('should return products for the given page', async () => {
    const product = new Product({ name: 'Laptop', price: 999, description: 'A powerful laptop', slug: 'laptop' });
    await product.save();

    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('should return empty array if no products', async () => {
    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(0);
  });
});

describe('GET /api/v1/product/product-count', () => {
  test('should return total count of products', async () => {
    const product1 = new Product({ name: 'Laptop', price: 999, description: 'A powerful laptop', slug: 'laptop' });
    const product2 = new Product({ name: 'Phone', price: 499, description: 'A smart phone', slug: 'phone' });
    await product1.save();
    await product2.save();

    const response = await request(app).get('/api/v1/product/product-count');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  test('should return zero if no products', async () => {
    const response = await request(app).get('/api/v1/product/product-count');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
  });
});

describe('POST /api/v1/product/product-filters', () => {
  test('should return filtered products by category and price', async () => {
    const category = new Category({ name: 'Electronics' });
    await category.save();
    const product = new Product({ name: 'Laptop', price: 999, description: 'A powerful laptop', slug: 'laptop', category: category._id });
    await product.save();

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({ checked: [category._id], radio: [[500, 1500]] });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('should return empty array if no products match filters', async () => {
    const category = new Category({ name: 'Electronics' });
    await category.save();

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({ checked: [category._id], radio: [[500, 1500]] });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(0);
  });
});
