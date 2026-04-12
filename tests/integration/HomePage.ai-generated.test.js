import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import routes from '../routes'; // Assuming your routes are defined in a separate file
import Category from '../models/category'; // Assuming you have a Category model
import Product from '../models/product'; // Assuming you have a Product model

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
    await Category.create({ name: 'Books' });

    const res = await request(app).get('/api/v1/category/get-category');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category).toHaveLength(2);
  });

  test('should return an empty array if no categories exist', async () => {
    const res = await request(app).get('/api/v1/category/get-category');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.category).toHaveLength(0);
  });
});

describe('GET /api/v1/product/product-list/:page', () => {
  test('should return products for the given page', async () => {
    await Product.create({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    await Product.create({ name: 'Book', price: 20, description: 'An interesting book', slug: 'book' });

    const res = await request(app).get('/api/v1/product/product-list/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(2);
  });

  test('should return an empty array if no products exist', async () => {
    const res = await request(app).get('/api/v1/product/product-list/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });
});

describe('GET /api/v1/product/product-count', () => {
  test('should return the total count of products', async () => {
    await Product.create({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' });
    await Product.create({ name: 'Book', price: 20, description: 'An interesting book', slug: 'book' });

    const res = await request(app).get('/api/v1/product/product-count');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(2);
  });

  test('should return zero if no products exist', async () => {
    const res = await request(app).get('/api/v1/product/product-count');
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(0);
  });
});

describe('POST /api/v1/product/product-filters', () => {
  test('should return filtered products based on category and price', async () => {
    const category = await Category.create({ name: 'Electronics' });
    await Product.create({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop', category: category._id });
    await Product.create({ name: 'Book', price: 20, description: 'An interesting book', slug: 'book' });

    const res = await request(app).post('/api/v1/product/product-filters').send({
      checked: [category._id],
      radio: [[500, 1500]]
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Laptop');
  });

  test('should return an empty array if no products match the filters', async () => {
    const category = await Category.create({ name: 'Electronics' });
    await Product.create({ name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop', category: category._id });

    const res = await request(app).post('/api/v1/product/product-filters').send({
      checked: [category._id],
      radio: [[1500, 2000]]
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(0);
  });
});
