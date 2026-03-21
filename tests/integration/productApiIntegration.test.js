// Integration tests for Product API - 5 Core Features

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import express from "express";
import productRoutes from "../../routes/productRoutes.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import userModel from "../../models/userModel.js";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/v1/product", productRoutes);
  return app;
};

let mongoServer;
let app;

beforeAll(async () => {
  process.env.JWT_SECRET = "testsecret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  await userModel.deleteMany({});
});

const createAdminWithToken = async () => {
  const admin = await userModel.create({
    name: "Admin",
    email: `admin-${Date.now()}@test.com`,
    password: "hashedpw",
    phone: "1234567890",
    address: "Test St",
    answer: "test",
    role: 1,
  });
  const token = jwt.sign({ _id: admin._id }, "testsecret");
  return { admin, token };
};

const createUserWithToken = async () => {
  const user = await userModel.create({
    name: "User",
    email: `user-${Date.now()}-${Math.random()}@test.com`,
    password: "hashedpw",
    phone: "1234567890",
    address: "Test St",
    answer: "test",
    role: 0,
  });
  const token = jwt.sign({ _id: user._id }, "testsecret");
  return { user, token };
};

const createCategory = async () => {
  return await categoryModel.create({
    name: "Electronics",
    slug: "electronics",
  });
};

// Product Creation with Media
describe("Product Creation with Media", () => {
  it("should create a product with all fields when admin is authenticated", async () => {
    const { token } = await createAdminWithToken();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", token)
      .field("name", "Laptop")
      .field("description", "High performance laptop")
      .field("price", "999")
      .field("category", category._id.toString())
      .field("quantity", "10")
      .field("shipping", "true");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.products.name).toBe("Laptop");

    const saved = await productModel.findOne({ name: "Laptop" });
    expect(saved).not.toBeNull();
  });

  it("should reject product creation by non-admin user", async () => {
    const { token } = await createUserWithToken();
    const category = await createCategory();

    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", token)
      .field("name", "Laptop")
      .field("category", category._id.toString());

    expect(res.status).toBe(401);
  });
});

// Product Search and Linguistic Logic
describe("Product Search and Linguistic Logic", () => {
  beforeEach(async () => {
    const category = await createCategory();

    await productModel.create({
      name: "Running Shoes",
      description: "Comfortable shoes for running",
      price: "100",
      category: category._id,
      quantity: "20",
      slug: "running-shoes",
    });

    await productModel.create({
      name: "Walking Shoes",
      description: "Best shoes for walking",
      price: "80",
      category: category._id,
      quantity: "15",
      slug: "walking-shoes",
    });
  });

  it("should find products by exact name match", async () => {
    const res = await request(app).get(
      "/api/v1/product/search/Running%20Shoes",
    );
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should find products by partial match (case-insensitive)", async () => {
    const res = await request(app).get("/api/v1/product/search/shoe");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should search in product description", async () => {
    const res = await request(app).get("/api/v1/product/search/comfortable");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should return empty array for no matches", async () => {
    const res = await request(app).get("/api/v1/product/search/nonexistent");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });
});

// Filtered Product Retrieval
describe("Filtered Product Retrieval", () => {
  beforeEach(async () => {
    const cat1 = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
    const cat2 = await categoryModel.create({
      name: "Books",
      slug: "books",
    });

    await productModel.create({
      name: "Budget Laptop",
      description: "Low cost laptop",
      price: "300",
      category: cat1._id,
      quantity: "5",
      slug: "budget-laptop",
    });

    await productModel.create({
      name: "Premium Laptop",
      description: "High-end laptop",
      price: "2000",
      category: cat1._id,
      quantity: "2",
      slug: "premium-laptop",
    });

    await productModel.create({
      name: "Science Book",
      description: "Book",
      price: "25",
      category: cat2._id,
      quantity: "50",
      slug: "science-book",
    });
  });

  it("should filter by single category", async () => {
    const cat1 = await categoryModel.findOne({ slug: "electronics" });

    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({
        checked: [cat1._id.toString()],
        radio: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(2);
  });

  it("should filter by price range", async () => {
    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({
        checked: [],
        radio: [[0, 500]],
      });

    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => parseInt(p.price) <= 500)).toBe(true);
  });

  it("should filter by category and price together", async () => {
    const cat1 = await categoryModel.findOne({ slug: "electronics" });

    const res = await request(app)
      .post("/api/v1/product/product-filters")
      .send({
        checked: [cat1._id.toString()],
        radio: [[0, 500]],
      });

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
  });
});

// Category-Product Relationships
describe("Category-Product Relationships", () => {
  it("should retrieve products by category slug", async () => {
    const category = await createCategory();
    await productModel.create({
      name: "Laptop",
      description: "A laptop",
      price: "999",
      category: category._id,
      quantity: "10",
      slug: "laptop",
    });

    const res = await request(app).get(
      "/api/v1/product/product-category/electronics",
    );

    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe("Electronics");
    expect(res.body.products.length).toBe(1);
  });

  it("should return null category for non-existent category", async () => {
    const res = await request(app).get(
      "/api/v1/product/product-category/nonexistent",
    );

    expect(res.status).toBe(200);
    expect(res.body.category).toBeNull();
    expect(res.body.products.length).toBe(0);
  });
});

// Related Products Logic
describe("Related Products Logic", () => {
  it("should retrieve related products in same category", async () => {
    const category = await createCategory();
    const laptop = await productModel.create({
      name: "Laptop",
      description: "A laptop",
      price: "999",
      category: category._id,
      quantity: "10",
      slug: "laptop",
    });
    const mouse = await productModel.create({
      name: "Mouse",
      description: "A mouse",
      price: "20",
      category: category._id,
      quantity: "50",
      slug: "mouse",
    });

    const res = await request(app).get(
      `/api/v1/product/related-product/${laptop._id}/${category._id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0]._id.toString()).toBe(mouse._id.toString());
  });

  it("should not include original product in related products", async () => {
    const category = await createCategory();
    const laptop = await productModel.create({
      name: "Laptop",
      description: "A laptop",
      price: "999",
      category: category._id,
      quantity: "10",
      slug: "laptop",
    });

    const res = await request(app).get(
      `/api/v1/product/related-product/${laptop._id}/${category._id}`,
    );

    expect(res.body.products.length).toBe(0);
  });

  it("should limit related products to 3", async () => {
    const category = await createCategory();
    const laptop = await productModel.create({
      name: "Laptop",
      description: "A laptop",
      price: "999",
      category: category._id,
      quantity: "10",
      slug: "laptop",
    });

    for (let i = 0; i < 5; i++) {
      await productModel.create({
        name: `Product ${i}`,
        description: "A product",
        price: "50",
        category: category._id,
        quantity: "10",
        slug: `product-${i}`,
      });
    }

    const res = await request(app).get(
      `/api/v1/product/related-product/${laptop._id}/${category._id}`,
    );

    expect(res.body.products.length).toBeLessThanOrEqual(3);
  });
});
