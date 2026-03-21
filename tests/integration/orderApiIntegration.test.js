// Integration tests for Order Controller
// Tested Admin Order API integration with routes, authMiddleware, controller, and models

/**
 * Integration Test: Admin Order API Integration
 *
 * Tests the full chain:
 *   route → requireSignIn (authMiddleware) → isAdmin (authMiddleware)
 *   → orderController → orderModel & userModel & productModel
 *
 * Approach: bottom-up integration.
 *   - Lower layers (orderModel, userModel, productModel) are exercised via real controller calls.
 *   - Routes and middleware are integrated on top.
 *   - Only external MongoDB is replaced with an in-memory server (mongodb-memory-server).
 *   - No mocking of controller or model layers.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import express from "express";
import authRoute from "../../routes/authRoute.js";
import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";

// Build Express app with real auth routes (which includes order endpoints)
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/v1/auth", authRoute);
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
  await orderModel.deleteMany({});
  await userModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
});

// ─── Helper Functions ───────────────────────────────────────────────────────

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

const createProduct = async (overrides = {}) => {
  const category = await categoryModel.create({
    name: "Test Category",
    slug: "test-category",
  });
  return await productModel.create({
    name: "Test Product",
    slug: "test-product",
    description: "Test Description",
    price: 99,
    category: category._id,
    quantity: 10,
    ...overrides,
  });
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Admin Order API Integration", () => {
  describe("GET /api/v1/auth/all-orders (getAllOrders)", () => {
    it("should allow admin to retrieve all orders", async () => {
      const { token: adminToken } = await createAdminWithToken();
      const { user } = await createUserWithToken();
      const product = await createProduct();

      // Create an order
      await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user._id,
        status: "Not Process",
      });

      const res = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", adminToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBeGreaterThan(0);
    });

    it("should deny non-admin users from retrieving all orders", async () => {
      const { token: userToken } = await createUserWithToken();

      const res = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", userToken);

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/v1/auth/order-status/:orderId (orderStatus)", () => {
    it("should update order status to 'Processing'", async () => {
      const { token: adminToken } = await createAdminWithToken();
      const { user } = await createUserWithToken();
      const product = await createProduct();

      const order = await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user._id,
        status: "Not Process",
      });

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", adminToken)
        .send({ status: "Processing" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedOrder = await orderModel.findById(order._id);
      expect(updatedOrder.status).toBe("Processing");
    });

    it("should update order status to 'Shipped'", async () => {
      const { token: adminToken } = await createAdminWithToken();
      const { user } = await createUserWithToken();
      const product = await createProduct();

      const order = await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user._id,
        status: "Not Process",
      });

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", adminToken)
        .send({ status: "Shipped" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedOrder = await orderModel.findById(order._id);
      expect(updatedOrder.status).toBe("Shipped");
    });

    it("should update order status to 'Delivered'", async () => {
      const { token: adminToken } = await createAdminWithToken();
      const { user } = await createUserWithToken();
      const product = await createProduct();

      const order = await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user._id,
        status: "Not Process",
      });

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", adminToken)
        .send({ status: "Delivered" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedOrder = await orderModel.findById(order._id);
      expect(updatedOrder.status).toBe("Delivered");
    });

    it("should update order status to 'Cancelled'", async () => {
      const { token: adminToken } = await createAdminWithToken();
      const { user } = await createUserWithToken();
      const product = await createProduct();

      const order = await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user._id,
        status: "Not Process",
      });

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", adminToken)
        .send({ status: "Cancelled" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedOrder = await orderModel.findById(order._id);
      expect(updatedOrder.status).toBe("Cancelled");
    });

    it("should deny non-admin users from updating order status", async () => {
      const { token: userToken } = await createUserWithToken();
      const { admin, token: adminToken } = await createAdminWithToken();
      const product = await createProduct();

      const order = await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: admin._id,
        status: "Not Process",
      });

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", userToken)
        .send({ status: "Processing" });

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent order", async () => {
      const { token: adminToken } = await createAdminWithToken();
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/auth/order-status/${fakeId}`)
        .set("Authorization", adminToken)
        .send({ status: "Processing" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/auth/orders (getOrders)", () => {
    it("should return user's own orders", async () => {
      const { token: userToken, user } = await createUserWithToken();
      const product = await createProduct();

      await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user._id,
        status: "Not Process",
      });

      const res = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", userToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBe(1);
      expect(res.body.orders[0].buyer._id.toString()).toBe(user._id.toString());
    });

    it("should return empty array when user has no orders", async () => {
      const { token: userToken } = await createUserWithToken();

      const res = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", userToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orders).toEqual([]);
    });

    it("should only return orders for the authenticated user", async () => {
      const { token: user1Token, user: user1 } = await createUserWithToken();
      const { user: user2 } = await createUserWithToken();
      const product = await createProduct();

      // Create order for user1
      await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user1._id,
        status: "Not Process",
      });

      // Create order for user2
      await orderModel.create({
        products: [{ _id: product._id, count: 1, price: 99 }],
        payment: { success: true },
        buyer: user2._id,
        status: "Not Process",
      });

      const res = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", user1Token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orders.length).toBe(1);
      expect(res.body.orders[0].buyer._id.toString()).toBe(user1._id.toString());
    });
  });
});
