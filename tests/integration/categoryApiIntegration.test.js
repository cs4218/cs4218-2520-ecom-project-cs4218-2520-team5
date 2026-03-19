// Ivan Ang, A0259256U
// Assisted with AI

/**
 * Integration Test: Category API Integration
 *
 * Tests the full chain:
 *   route → requireSignIn (authMiddleware) → isAdmin (authMiddleware)
 *   → categoryController → categoryModel
 *
 * Approach: bottom-up integration.
 *   - Lower layer (categoryModel) is exercised via real controller calls.
 *   - Routes and middleware are integrated on top.
 *   - Only external MongoDB is replaced with an in-memory server (mongodb-memory-server).
 *   - No mocking of controller or model layers.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import express from "express";
import categoryRoutes from "../../routes/categoryRoutes.js";
import categoryModel from "../../models/categoryModel.js";
import userModel from "../../models/userModel.js";

// Build Express app with real category routes — do NOT import server.js
// (server.js calls connectDB() and listen(), which we do not want in tests)
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/category", categoryRoutes);
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
  await userModel.deleteMany({});
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const createAdminWithToken = async () => {
  const admin = await userModel.create({
    name: "Admin",
    email: "admin@test.com",
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
    email: "user@test.com",
    password: "hashedpw",
    phone: "1234567890",
    address: "Test St",
    answer: "test",
    role: 0,
  });
  const token = jwt.sign({ _id: user._id }, "testsecret");
  return { user, token };
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("Category API Integration — Story 1", () => {
  describe("POST /api/v1/category/create-category", () => {
    it("should create a category when admin is authenticated", async () => {
      const { token } = await createAdminWithToken();

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", token)
        .send({ name: "Electronics" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.category.name).toBe("Electronics");

      // Verify persisted to DB (tests categoryModel integration)
      const saved = await categoryModel.findOne({ name: "Electronics" });
      expect(saved).not.toBeNull();
      expect(saved.slug).toBe("electronics");
    });

    it("should return 401 when name is missing", async () => {
      const { token } = await createAdminWithToken();

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", token)
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Name is required");
    });

    it("should return 200 when category name already exists", async () => {
      const { token } = await createAdminWithToken();
      await categoryModel.create({ name: "Electronics", slug: "electronics" });

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", token)
        .send({ name: "Electronics" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Category Already Exists");

      // Only one copy should exist in DB
      const count = await categoryModel.countDocuments({ name: "Electronics" });
      expect(count).toBe(1);
    });

    it("should return 401 when a regular user tries to create a category", async () => {
      const { token } = await createUserWithToken();

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", token)
        .send({ name: "Electronics" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("UnAuthorized Access");
    });
  });

  describe("PUT /api/v1/category/update-category/:id", () => {
    it("should update a category when admin is authenticated", async () => {
      const { token } = await createAdminWithToken();
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .set("Authorization", token)
        .send({ name: "Gadgets" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category.name).toBe("Gadgets");

      // Verify updated in DB
      const updated = await categoryModel.findById(category._id);
      expect(updated.name).toBe("Gadgets");
      expect(updated.slug).toBe("gadgets");
    });

    it("should return 404 when category does not exist", async () => {
      const { token } = await createAdminWithToken();
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/category/update-category/${nonExistentId}`)
        .set("Authorization", token)
        .send({ name: "Gadgets" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Category not found");
    });

    it("should return 401 when a regular user tries to update", async () => {
      const { token } = await createUserWithToken();
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .set("Authorization", token)
        .send({ name: "Gadgets" });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/category/delete-category/:id", () => {
    it("should delete a category when admin is authenticated", async () => {
      const { token } = await createAdminWithToken();
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${category._id}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify removed from DB
      const deleted = await categoryModel.findById(category._id);
      expect(deleted).toBeNull();
    });

    it("should return 404 when category does not exist", async () => {
      const { token } = await createAdminWithToken();
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${nonExistentId}`)
        .set("Authorization", token);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Category not found");
    });

    it("should return 401 when a regular user tries to delete", async () => {
      const { token } = await createUserWithToken();
      const category = await categoryModel.create({
        name: "Electronics",
        slug: "electronics",
      });

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${category._id}`)
        .set("Authorization", token);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/category/get-category (public)", () => {
    it("should return all categories without requiring authentication", async () => {
      await categoryModel.create([
        { name: "Electronics", slug: "electronics" },
        { name: "Books", slug: "books" },
      ]);

      const res = await request(app).get("/api/v1/category/get-category");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toHaveLength(2);
    });

    it("should return an empty array when no categories exist", async () => {
      const res = await request(app).get("/api/v1/category/get-category");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toHaveLength(0);
    });
  });

  describe("GET /api/v1/category/single-category/:slug (public)", () => {
    it("should return a category by slug", async () => {
      await categoryModel.create({ name: "Electronics", slug: "electronics" });

      const res = await request(app).get(
        "/api/v1/category/single-category/electronics"
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category.name).toBe("Electronics");
    });

    it("should return 404 for a non-existent slug", async () => {
      const res = await request(app).get(
        "/api/v1/category/single-category/nonexistent"
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
