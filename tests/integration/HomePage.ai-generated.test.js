import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import routes from '../routes'; // Adjust the import based on your actual routes file

let mongoServer, app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
  app = express();
  app.use(express.json());
  app.use('/api/v1', routes); // Adjust the base path based on your actual API structure
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('GET /api/v1/category/get-category', () => {
  test('should return all categories', async () => {
    // Seed the database with test data
    await mongoose.connection.collection('categories').insertMany([
      { name: 'Electronics' },
      { name: 'Books' },
    ]);

    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(2);
  });

  test('should handle empty category list', async () => {
    const response = await request(app).get('/api/v1/category/get-category');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.length).toBe(0);
  });
});

describe('GET /api/v1/product/product-list/:page', () => {
  test('should return products for a given page', async () => {
    // Seed the database with test data
    await mongoose.connection.collection('products').insertMany([
      { name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' },
      { name: 'Book', price: 20, description: 'An interesting book', slug: 'book' },
    ]);

    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(2);
  });

  test('should handle no products for a given page', async () => {
    const response = await request(app).get('/api/v1/product/product-list/1');
    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(0);
  });
});

describe('GET /api/v1/product/product-count', () => {
  test('should return the total count of products', async () => {
    // Seed the database with test data
    await mongoose.connection.collection('products').insertMany([
      { name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop' },
      { name: 'Book', price: 20, description: 'An interesting book', slug: 'book' },
    ]);

    const response = await request(app).get('/api/v1/product/product-count');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  test('should return zero when no products exist', async () => {
    const response = await request(app).get('/api/v1/product/product-count');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
  });
});

describe('POST /api/v1/product/product-filters', () => {
  test('should return filtered products based on category and price', async () => {
    // Seed the database with test data
    await mongoose.connection.collection('products').insertMany([
      { name: 'Laptop', price: 1000, description: 'A powerful laptop', slug: 'laptop', category: 'Electronics' },
      { name: 'Book', price: 20, description: 'An interesting book', slug: 'book', category: 'Books' },
    ]);

    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({ checked: ['Electronics'], radio: [[500, 1500]] });

    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(1);
    expect(response.body.products[0].name).toBe('Laptop');
  });

  test('should return no products if filters do not match', async () => {
    const response = await request(app)
      .post('/api/v1/product/product-filters')
      .send({ checked: ['NonExistentCategory'], radio: [[5000, 10000]] });

    expect(response.status).toBe(200);
    expect(response.body.products.length).toBe(0);
  });
});
