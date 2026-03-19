// Ivan Ang, A0259256U
// Assisted with AI

/**
 * Integration Test: Category–Product Relationship
 *
 * Tests the full chain for slug-based category and product lookups:
 *   route → singleCategoryController → categoryModel
 *   route → productCategoryController → categoryModel + productModel
 *
 * Approach: bottom-up integration.
 *   - Lower layers (categoryModel, productModel) are exercised via real controller calls.
 *   - Routes are integrated on top.
 *   - Only external MongoDB is replaced with an in-memory server (mongodb-memory-server).
 *   - No mocking of controller or model layers.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import express from "express";
import categoryRoutes from "../../routes/categoryRoutes.js";
import productRoutes from "../../routes/productRoutes.js";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";

// Build Express app with real category and product routes
// Do NOT import server.js (it calls connectDB() and listen())
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/category", categoryRoutes);
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
  await categoryModel.deleteMany({});
  await productModel.deleteMany({});
  await userModel.deleteMany({});
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const createProduct = async (category, overrides = {}) =>
  productModel.create({
    name: "Test Product",
    slug: "test-product",
    description: "A test product",
    price: 99,
    category: category._id,
    quantity: 10,
    ...overrides,
  });

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("Category–Product Relationship Integration — Story 2", () => {
  describe(
    "GET /api/v1/category/single-category/:slug (singleCategoryController)",
    () => {
      it("should return the correct category by slug", async () => {
        await categoryModel.create({
          name: "Electronics",
          slug: "electronics",
        });

        const res = await request(app).get(
          "/api/v1/category/single-category/electronics"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.category.name).toBe("Electronics");
        expect(res.body.category.slug).toBe("electronics");
      });

      it("should return 404 for a non-existent slug", async () => {
        const res = await request(app).get(
          "/api/v1/category/single-category/nonexistent"
        );

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
      });

      it("should match categories whose slug is stored in lowercase", async () => {
        // categoryModel schema has `lowercase: true` on the slug field
        await categoryModel.create({
          name: "Smart Phones",
          slug: "smart-phones",
        });

        const res = await request(app).get(
          "/api/v1/category/single-category/smart-phones"
        );

        expect(res.status).toBe(200);
        expect(res.body.category.slug).toBe("smart-phones");
      });
    }
  );

  describe(
    "GET /api/v1/product/product-category/:slug (productCategoryController)",
    () => {
      it("should return the category and its products", async () => {
        const category = await categoryModel.create({
          name: "Electronics",
          slug: "electronics",
        });
        await createProduct(category, { name: "Laptop", slug: "laptop" });
        await createProduct(category, { name: "Tablet", slug: "tablet" });

        const res = await request(app).get(
          "/api/v1/product/product-category/electronics"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.category.name).toBe("Electronics");
        expect(res.body.products).toHaveLength(2);
      });

      it("should only return products belonging to the requested category", async () => {
        const electronics = await categoryModel.create({
          name: "Electronics",
          slug: "electronics",
        });
        const books = await categoryModel.create({
          name: "Books",
          slug: "books",
        });
        await createProduct(electronics, { name: "Laptop", slug: "laptop" });
        await createProduct(books, { name: "Novel", slug: "novel" });

        const res = await request(app).get(
          "/api/v1/product/product-category/electronics"
        );

        expect(res.status).toBe(200);
        expect(res.body.products).toHaveLength(1);
        expect(res.body.products[0].name).toBe("Laptop");
      });

      it("should return an empty products array for a category with no products", async () => {
        await categoryModel.create({
          name: "Electronics",
          slug: "electronics",
        });

        const res = await request(app).get(
          "/api/v1/product/product-category/electronics"
        );

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.products).toHaveLength(0);
      });

      it("should return products with populated category field", async () => {
        const category = await categoryModel.create({
          name: "Electronics",
          slug: "electronics",
        });
        await createProduct(category, { name: "Laptop", slug: "laptop" });

        const res = await request(app).get(
          "/api/v1/product/product-category/electronics"
        );

        expect(res.status).toBe(200);
        expect(res.body.products[0].category).toBeDefined();
        // populate("category") should resolve the ObjectId to the full category doc
        expect(res.body.products[0].category.name).toBe("Electronics");
      });

      it("should return 200 with empty products when slug does not match any category", async () => {
        // productCategoryController: findOne returns null → find({ category: null }) → []
        const res = await request(app).get(
          "/api/v1/product/product-category/nonexistent"
        );

        expect(res.status).toBe(200);
        expect(res.body.products).toHaveLength(0);
      });
    }
  );
});
