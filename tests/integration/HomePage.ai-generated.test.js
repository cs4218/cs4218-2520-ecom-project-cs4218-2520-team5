import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import routes from '../path/to/your/routes'; // Adjust the import to your routes file
import Category from '../models/Category'; // Adjust the import to your Category model
import Product from '../models/Product'; // Adjust the import to your Product model

let mongoServer, app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
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
    await Category.create({ name: 'Electronics' });
    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(1);
    expect(response.body.category[0].name).toBe('Electronics');
  });

  test('should return empty array if no categories exist', async () => {
    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(0);
  });
});

describe('GET /api/v1/product/product-list/:page', () => {
  test('should return products for the given page', async () => {
    await Product.create({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('should return empty array if no products exist', async () => {
    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(0);
  });
});

describe('POST /api/v1/product/product-filters', () => {
  test('should return filtered products based on category and price', async () => {
    const category = await Category.create({ name: 'Electronics' });
    await Product.create({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop', category: category._id });
    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({ checked: [category._id], radio: [[500, 1500]] });
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('should return empty array if no products match the filters', async () => {
    const category = await Category.create({ name: 'Electronics' });
    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({ checked: [category._id], radio: [[2000, 3000]] });
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(0);
  });
});
