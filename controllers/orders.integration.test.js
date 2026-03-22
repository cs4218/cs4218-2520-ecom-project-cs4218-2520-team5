// Alyssa Ong, A0264663X
// Assisted by AI

// This suite verifies the real integration of route -> auth middleware -> controller -> DB.
// We avoid mocking app internals (route/controller/model) and only use a test database.

import express from "express";
import mongoose from "mongoose";
import request from "supertest";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

import authRoutes from "../routes/authRoute.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import { hashPassword } from "../helpers/authHelper.js";

const TEST_JWT_SECRET = "integration-test-secret";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", authRoutes);
  return app;
};

describe("orders.integration", () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = buildApp();
  });

  afterEach(async () => {
    await orderModel.deleteMany({});
    await productModel.deleteMany({});
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  const seedUser = async (overrides = {}) => {
    const baseUser = {
      name: "John Doe",
      email: "john@example.com",
      password: await hashPassword("oldpassword123"),
      phone: "91234567",
      address: "Old Address",
      answer: "blue",
      role: 0,
    };

    const user = await userModel.create({ ...baseUser, ...overrides });
    const token = JWT.sign({ _id: user._id }, TEST_JWT_SECRET);
    return { user, token };
  };

  const seedProduct = async (overrides = {}) => {
    const baseProduct = {
      name: "Integration Product",
      slug: `product-${new mongoose.Types.ObjectId().toString()}`,
      description: "Integration product description",
      price: 50,
      category: new mongoose.Types.ObjectId(),
      quantity: 10,
      photo: {
        data: Buffer.from("integration-photo"),
        contentType: "image/png",
      },
      shipping: true,
    };

    return productModel.create({ ...baseProduct, ...overrides });
  };

  const seedOrder = async ({
    buyer,
    products = [],
    payment = { success: true },
    status = "Processing",
    createdAt,
  }) => {
    const order = await orderModel.create({
      buyer,
      products,
      payment,
      status,
    });

    if (createdAt) {
      await orderModel.updateOne({ _id: order._id }, { $set: { createdAt } });
    }

    return order;
  };

  describe("update profile flow", () => {
    it("updates profile successfully with valid token and payload", async () => {
      // happy-path integration across HTTP, middleware, controller and persistence.
      const { user, token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Jane Doe",
          phone: "98765432",
          address: "New Address",
          password: "newpassword456",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Profile Updated Successfully");
      expect(response.body.updatedUser).toMatchObject({
        _id: user._id.toString(),
        name: "Jane Doe",
        phone: "98765432",
        address: "New Address",
        email: "john@example.com",
      });
      expect(response.body.updatedUser.password).toBeUndefined();

      const saved = await userModel.findById(user._id);
      expect(saved.name).toBe("Jane Doe");
      expect(saved.phone).toBe("98765432");
      expect(saved.address).toBe("New Address");
      expect(saved.password).not.toBe("newpassword456");
    });

    it("returns 401 when authorization token is missing", async () => {
      //middleware boundary check; request is rejected before data mutation.
      const { user } = await seedUser();

      const response = await request(app).put("/api/v1/auth/profile").send({
        name: "Unauthorized Update",
        phone: "90001111",
        address: "Should Not Persist",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      const unchanged = await userModel.findById(user._id);
      expect(unchanged.name).toBe("John Doe");
      expect(unchanged.phone).toBe("91234567");
      expect(unchanged.address).toBe("Old Address");
    });

    it("returns 404 when token is valid but user no longer exists", async () => {
      //middleware passes, controller and model integration handles missing user.
      const { user, token } = await seedUser();
      await userModel.findByIdAndDelete(user._id);

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Jane Doe",
          phone: "98765432",
          address: "New Address",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User not found");
    });

    it("returns 400 when name is an empty string", async () => {
      //controller validation branch exercised through the real HTTP route.
      const { token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "",
          phone: "98765432",
          address: "New Address",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Name cannot be empty");
    });

    it("returns 400 when phone is an empty string", async () => {
      //controller validation branch exercised through the real HTTP route.
      const { token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Jane Doe",
          phone: "",
          address: "New Address",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Phone cannot be empty");
    });

    it("returns 400 when address is an empty string", async () => {
      // controller validation branch exercised through the real HTTP route.
      const { token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Jane Doe",
          phone: "98765432",
          address: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Address cannot be empty");
    });

    it("returns 400 for short passwords", async () => {
      // happy-path integration across HTTP, middleware, controller and persistence.
      const { token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Jane Doe",
          phone: "98765432",
          address: "New Address",
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Password is required and 6 character long",
      );
    });

    it("supports partial update while preserving existing password", async () => {
      // happy-path integration across HTTP, middleware, controller and persistence.
      const { user, token } = await seedUser();
      const oldUser = await userModel.findById(user._id);
      const oldPasswordHash = oldUser.password;

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "John Updated",
          phone: "90000000",
          address: "Address Updated",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = await userModel.findById(user._id);
      expect(updated.password).toBe(oldPasswordHash);
      expect(updated.name).toBe("John Updated");
      expect(updated.phone).toBe("90000000");
      expect(updated.address).toBe("Address Updated");
    });

    it("returns 401 when authorization token is malformed", async () => {
      const { user } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", "this-is-not-a-jwt")
        .send({
          name: "Should Fail",
          phone: "98887777",
          address: "Should Not Persist",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      const unchanged = await userModel.findById(user._id);
      expect(unchanged.name).toBe("John Doe");
      expect(unchanged.phone).toBe("91234567");
      expect(unchanged.address).toBe("Old Address");
    });

    it("returns 401 when token is signed with a different secret", async () => {
      const { user } = await seedUser();
      const invalidToken = JWT.sign({ _id: user._id }, "wrong-secret");

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", invalidToken)
        .send({
          name: "Should Fail",
          phone: "98887777",
          address: "Should Not Persist",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      const unchanged = await userModel.findById(user._id);
      expect(unchanged.name).toBe("John Doe");
      expect(unchanged.phone).toBe("91234567");
      expect(unchanged.address).toBe("Old Address");
    });

    it("does not update non-whitelisted fields such as email and role", async () => {
      const { user, token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Whitelist Check",
          phone: "95556666",
          address: "Whitelist Address",
          email: "new-email@not-allowed.com",
          role: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = await userModel.findById(user._id);
      expect(updated.name).toBe("Whitelist Check");
      expect(updated.phone).toBe("95556666");
      expect(updated.address).toBe("Whitelist Address");
      expect(updated.email).toBe("john@example.com");
      expect(updated.role).toBe(0);
    });

    it("accepts password of length exactly 6 and updates stored hash", async () => {
      const { user, token } = await seedUser();
      const before = await userModel.findById(user._id);

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Boundary Password",
          phone: "97776666",
          address: "Boundary Address",
          password: "123456",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const after = await userModel.findById(user._id);
      expect(after.password).not.toBe(before.password);
      expect(after.password).not.toBe("123456");
    });

    it("keeps existing values when payload omits all updatable fields", async () => {
      const { user, token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = await userModel.findById(user._id);
      expect(updated.name).toBe("John Doe");
      expect(updated.phone).toBe("91234567");
      expect(updated.address).toBe("Old Address");
      expect(updated.email).toBe("john@example.com");
    });

    it("treats null fields as fallback-to-existing values", async () => {
      const { user, token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: null,
          phone: null,
          address: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = await userModel.findById(user._id);
      expect(updated.name).toBe("John Doe");
      expect(updated.phone).toBe("91234567");
      expect(updated.address).toBe("Old Address");
    });

    it("does not mutate persisted data when validation fails", async () => {
      const { user, token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Should Not Persist",
          phone: "90000000",
          address: "Should Not Persist",
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Password is required and 6 character long",
      );

      const unchanged = await userModel.findById(user._id);
      expect(unchanged.name).toBe("John Doe");
      expect(unchanged.phone).toBe("91234567");
      expect(unchanged.address).toBe("Old Address");
    });

    it("accepts Bearer token format for profile update", async () => {
      const { user, token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Bearer Format",
          phone: "92223333",
          address: "Should Not Persist",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = await userModel.findById(user._id);
      expect(updated.name).toBe("Bearer Format");
    });

    it("returns 401 when token is expired", async () => {
      const { user } = await seedUser();
      const expiredToken = JWT.sign({ _id: user._id }, TEST_JWT_SECRET, {
        expiresIn: -1,
      });

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", expiredToken)
        .send({
          name: "Expired Token",
          phone: "93334444",
          address: "Should Not Persist",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      const unchanged = await userModel.findById(user._id);
      expect(unchanged.name).toBe("John Doe");
    });

    it("returns 400 when token contains a non-ObjectId user id", async () => {
      const invalidIdToken = JWT.sign(
        { _id: "not-an-objectid" },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", invalidIdToken)
        .send({
          name: "Invalid Id",
          phone: "94445555",
          address: "Invalid Id Address",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error while updating profile");
    });

    it("updates address only and keeps name and phone unchanged", async () => {
      const { user, token } = await seedUser();

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          address: "Address Only Update",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updated = await userModel.findById(user._id);
      expect(updated.address).toBe("Address Only Update");
      expect(updated.name).toBe("John Doe");
      expect(updated.phone).toBe("91234567");
    });

    it("treats empty password as no password change", async () => {
      const { user, token } = await seedUser();
      const before = await userModel.findById(user._id);

      const response = await request(app)
        .put("/api/v1/auth/profile")
        .set("Authorization", token)
        .send({
          name: "Empty Password User",
          phone: "96667777",
          address: "Empty Password Address",
          password: "",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const after = await userModel.findById(user._id);
      expect(after.password).toBe(before.password);
      expect(after.name).toBe("Empty Password User");
      expect(after.phone).toBe("96667777");
      expect(after.address).toBe("Empty Password Address");
    });
  });

  // getOrders integration flows
  describe("get orders flow", () => {
    it("returns user orders successfully for valid token", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "Single Order Product" });
      await seedOrder({
        buyer: user._id,
        products: [product._id],
        status: "Shipped",
        payment: { success: true },
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].status).toBe("Shipped");
    });

    it("returns only orders that belong to the authenticated user", async () => {
      const { user: buyerA, token } = await seedUser();
      const { user: buyerB } = await seedUser({ email: "other@example.com" });
      const product = await seedProduct({ name: "Isolation Product" });

      await seedOrder({ buyer: buyerA._id, products: [product._id] });
      await seedOrder({ buyer: buyerB._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].buyer._id.toString()).toBe(
        buyerA._id.toString(),
      );
    });

    it("returns an empty orders array when user has no orders", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toEqual([]);
    });

    it("returns orders sorted by createdAt in descending order", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "Sort Product" });

      const older = await seedOrder({
        buyer: user._id,
        products: [product._id],
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      const newer = await seedOrder({
        buyer: user._id,
        products: [product._id],
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.orders[0]._id.toString()).toBe(newer._id.toString());
      expect(response.body.orders[1]._id.toString()).toBe(older._id.toString());
    });

    it("populates buyer name for returned orders", async () => {
      const { user, token } = await seedUser({ name: "Buyer Name" });
      const product = await seedProduct({ name: "Buyer Populate Product" });
      await seedOrder({ buyer: user._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].buyer.name).toBe("Buyer Name");
    });

    it("does not expose extra buyer fields beyond selected population", async () => {
      const { user, token } = await seedUser({
        name: "Restricted Buyer",
        phone: "81112222",
      });
      const product = await seedProduct({ name: "Buyer Restriction Product" });
      await seedOrder({ buyer: user._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].buyer.name).toBe("Restricted Buyer");
      expect(response.body.orders[0].buyer.phone).toBeUndefined();
    });

    it("populates products and excludes the photo field", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "No Photo Product" });
      await seedOrder({ buyer: user._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].products).toHaveLength(1);
      expect(response.body.orders[0].products[0].name).toBe("No Photo Product");
      expect(response.body.orders[0].products[0].photo).toBeUndefined();
    });

    it("returns accurate product quantity count per order", async () => {
      const { user, token } = await seedUser();
      const productA = await seedProduct({ name: "Quantity A" });
      const productB = await seedProduct({ name: "Quantity B" });
      await seedOrder({
        buyer: user._id,
        products: [productA._id, productB._id],
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].products).toHaveLength(2);
    });

    it("preserves status and payment fields in getOrders response", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "Status Payment Product" });
      await seedOrder({
        buyer: user._id,
        products: [product._id],
        status: "Delivered",
        payment: { success: false, transactionId: "txn_123" },
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].status).toBe("Delivered");
      expect(response.body.orders[0].payment.success).toBe(false);
      expect(response.body.orders[0].payment.transactionId).toBe("txn_123");
    });

    it("returns 401 for getOrders when token is missing", async () => {
      const response = await request(app).get("/api/v1/auth/orders");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 for getOrders when token is malformed", async () => {
      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", "not-a-jwt");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 for getOrders when token has no _id claim", async () => {
      const tokenWithoutId = JWT.sign({ role: 0 }, TEST_JWT_SECRET);

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", tokenWithoutId);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User ID not found in request");
    });

    it("accepts Bearer token format for getOrders", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(0);
    });

    it("returns 500 for getOrders when token _id is not a valid ObjectId", async () => {
      const invalidIdToken = JWT.sign(
        { _id: "not-an-objectid" },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", invalidIdToken);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error While Getting Orders");
    });

    it("returns 401 for getOrders when token is signed with wrong secret", async () => {
      const { user } = await seedUser();
      const wrongSecretToken = JWT.sign({ _id: user._id }, "wrong-secret");

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", wrongSecretToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 for getOrders when token is expired", async () => {
      const { user } = await seedUser();
      const expiredToken = JWT.sign({ _id: user._id }, TEST_JWT_SECRET, {
        expiresIn: -1,
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", expiredToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 for getOrders when token _id is null", async () => {
      const nullIdToken = JWT.sign({ _id: null }, TEST_JWT_SECRET);

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", nullIdToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("User ID not found in request");
    });

    it("returns 404 for unsupported POST method on /orders", async () => {
      const { token } = await seedUser();

      const response = await request(app)
        .post("/api/v1/auth/orders")
        .set("Authorization", token)
        .send({});

      expect(response.status).toBe(404);
    });

    it("returns 200 with empty orders for valid ObjectId token not tied to an existing user", async () => {
      const nonExistingUserToken = JWT.sign(
        { _id: new mongoose.Types.ObjectId() },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", nonExistingUserToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toEqual([]);
    });

    it("returns all matching orders for user in larger datasets", async () => {
      const { user, token } = await seedUser();
      const { user: otherUser } = await seedUser({
        email: "bulk-other@example.com",
      });
      const product = await seedProduct({ name: "Bulk Product" });

      await seedOrder({ buyer: user._id, products: [product._id] });
      await seedOrder({ buyer: user._id, products: [product._id] });
      await seedOrder({ buyer: user._id, products: [product._id] });
      await seedOrder({ buyer: user._id, products: [product._id] });
      await seedOrder({ buyer: user._id, products: [product._id] });
      await seedOrder({ buyer: otherUser._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(5);
    });

    it("returns only own orders and keeps own orders sorted even with newer orders from other users", async () => {
      const { user, token } = await seedUser();
      const { user: otherUser } = await seedUser({
        email: "sort-other@example.com",
      });
      const product = await seedProduct({ name: "Sort Isolation Product" });

      const ownOlder = await seedOrder({
        buyer: user._id,
        products: [product._id],
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });
      const ownNewer = await seedOrder({
        buyer: user._id,
        products: [product._id],
        createdAt: new Date("2024-06-01T00:00:00.000Z"),
      });
      await seedOrder({
        buyer: otherUser._id,
        products: [product._id],
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.orders[0]._id.toString()).toBe(
        ownNewer._id.toString(),
      );
      expect(response.body.orders[1]._id.toString()).toBe(
        ownOlder._id.toString(),
      );
    });

    it("returns both orders when createdAt timestamps are identical", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "Tie Product" });
      const sameTime = new Date("2025-02-02T00:00:00.000Z");

      const orderA = await seedOrder({
        buyer: user._id,
        products: [product._id],
        status: "Processing",
        createdAt: sameTime,
      });
      const orderB = await seedOrder({
        buyer: user._id,
        products: [product._id],
        status: "Shipped",
        createdAt: sameTime,
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      const returnedIds = response.body.orders.map((o) => o._id.toString());
      expect(returnedIds).toEqual(
        expect.arrayContaining([orderA._id.toString(), orderB._id.toString()]),
      );
    });

    it("returns unique order ids without duplication", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "Unique Id Product" });

      await seedOrder({ buyer: user._id, products: [product._id] });
      await seedOrder({ buyer: user._id, products: [product._id] });
      await seedOrder({ buyer: user._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      const ids = response.body.orders.map((o) => o._id.toString());
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("handles orders that have empty products arrays", async () => {
      const { user, token } = await seedUser();
      await seedOrder({ buyer: user._id, products: [] });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].products).toEqual([]);
    });

    it("returns order even when buyer document was deleted after order creation", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "Deleted Buyer Product" });
      await seedOrder({ buyer: user._id, products: [product._id] });
      await userModel.findByIdAndDelete(user._id);

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].buyer).toBeNull();
    });

    it("preserves payment object even when success flag is missing", async () => {
      const { user, token } = await seedUser();
      const product = await seedProduct({ name: "Payment Shape Product" });
      await seedOrder({
        buyer: user._id,
        products: [product._id],
        payment: { method: "card", gateway: "braintree" },
      });

      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].payment.method).toBe("card");
      expect(response.body.orders[0].payment.gateway).toBe("braintree");
      expect(response.body.orders[0].payment.success).toBeUndefined();
    });
  });

  // getAllOrders integration flows
  describe("get all orders flow", () => {
    it("returns all orders for admin user", async () => {
      const { user: admin, token } = await seedUser({
        role: 1,
        email: "admin-all-orders@example.com",
      });
      const { user: buyerA } = await seedUser({ email: "buyer-a@example.com" });
      const { user: buyerB } = await seedUser({ email: "buyer-b@example.com" });
      const product = await seedProduct({ name: "All Orders Product" });

      await seedOrder({ buyer: buyerA._id, products: [product._id] });
      await seedOrder({ buyer: buyerB._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.orders.map((o) => o.buyer._id.toString())).toEqual(
        expect.arrayContaining([buyerA._id.toString(), buyerB._id.toString()]),
      );
      expect(admin.role).toBe(1);
    });

    it("returns an empty orders array for admin when no orders exist", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-empty@example.com",
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toEqual([]);
    });

    it("returns all orders sorted by createdAt descending", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-sort@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "sort-buyer@example.com",
      });
      const product = await seedProduct({ name: "Sort All Product" });

      const older = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
      });
      const newer = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0]._id.toString()).toBe(newer._id.toString());
      expect(response.body.orders[1]._id.toString()).toBe(older._id.toString());
    });

    it("populates buyer name and excludes buyer extra fields", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-buyer-pop@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-pop@example.com",
        name: "Buyer Pop",
        phone: "89990000",
      });
      const product = await seedProduct({ name: "Buyer Name Product" });
      await seedOrder({ buyer: buyer._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].buyer.name).toBe("Buyer Pop");
      expect(response.body.orders[0].buyer.phone).toBeUndefined();
    });

    it("populates products and excludes product photo field", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-product-pop@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "product-buyer@example.com",
      });
      const product = await seedProduct({ name: "Photo Hidden Product" });
      await seedOrder({ buyer: buyer._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].products[0].name).toBe(
        "Photo Hidden Product",
      );
      expect(response.body.orders[0].products[0].photo).toBeUndefined();
    });

    it("preserves status and payment payload in all-orders response", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-status-payment@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "status-buyer@example.com",
      });
      const product = await seedProduct({ name: "Status Payment All" });
      await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Delivered",
        payment: { success: false, gateway: "braintree" },
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].status).toBe("Delivered");
      expect(response.body.orders[0].payment.success).toBe(false);
      expect(response.body.orders[0].payment.gateway).toBe("braintree");
    });

    it("returns 401 when all-orders token is missing", async () => {
      const response = await request(app).get("/api/v1/auth/all-orders");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when all-orders token is malformed", async () => {
      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", "not-a-jwt");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when all-orders token is signed with wrong secret", async () => {
      const { user } = await seedUser({
        role: 1,
        email: "admin-wrong-secret@example.com",
      });
      const wrongSecretToken = JWT.sign({ _id: user._id }, "wrong-secret");

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", wrongSecretToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when all-orders token is expired", async () => {
      const { user } = await seedUser({
        role: 1,
        email: "admin-expired@example.com",
      });
      const expiredToken = JWT.sign({ _id: user._id }, TEST_JWT_SECRET, {
        expiresIn: -1,
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", expiredToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("accepts Bearer token format for all-orders", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-bearer@example.com",
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it("returns 401 for non-admin user on all-orders route", async () => {
      const { token } = await seedUser({
        role: 0,
        email: "non-admin-all-orders@example.com",
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("UnAuthorized Access");
    });

    it("returns 401 when all-orders token has no _id claim", async () => {
      const tokenWithoutId = JWT.sign({ role: 1 }, TEST_JWT_SECRET);

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", tokenWithoutId);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("returns 401 when all-orders token has null _id", async () => {
      const tokenWithNullId = JWT.sign({ _id: null }, TEST_JWT_SECRET);

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", tokenWithNullId);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("returns 401 when admin token references a user document that no longer exists", async () => {
      const deletedAdminId = new mongoose.Types.ObjectId();
      const deletedAdminToken = JWT.sign(
        { _id: deletedAdminId },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", deletedAdminToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("accepts lowercase authorization header key and returns all orders", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-lowercase-header@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "lowercase-buyer@example.com",
      });
      const product = await seedProduct({ name: "Lowercase Header Product" });
      await seedOrder({ buyer: buyer._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(1);
    });

    it("returns JSON content type for successful all-orders responses", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-json-content-type@example.com",
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("returns default status when order status is not explicitly provided", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-default-status@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "default-status-buyer@example.com",
      });
      const product = await seedProduct({ name: "Default Status Product" });

      await orderModel.create({
        buyer: buyer._id,
        products: [product._id],
        payment: { success: true },
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].status).toBe("Not Process");
    });

    it("handles orders that have empty products arrays in all-orders response", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-empty-products@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "empty-products-buyer@example.com",
      });
      await seedOrder({ buyer: buyer._id, products: [] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].products).toEqual([]);
    });

    it("returns order even when buyer was deleted after order creation", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-deleted-buyer@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "deleted-buyer@example.com",
      });
      const product = await seedProduct({ name: "Deleted Buyer All Orders" });
      await seedOrder({ buyer: buyer._id, products: [product._id] });
      await userModel.findByIdAndDelete(buyer._id);

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].buyer).toBeNull();
    });

    it("preserves payment object even when success flag is missing for all-orders", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-payment-shape@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "payment-shape-buyer@example.com",
      });
      const product = await seedProduct({ name: "Payment Shape All Product" });
      await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        payment: { method: "card", gateway: "braintree" },
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].payment.method).toBe("card");
      expect(response.body.orders[0].payment.gateway).toBe("braintree");
      expect(response.body.orders[0].payment.success).toBeUndefined();
    });

    it("populates multiple products and excludes photo from each item", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-multi-products@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "multi-products-buyer@example.com",
      });
      const productA = await seedProduct({ name: "Multi Product A" });
      const productB = await seedProduct({ name: "Multi Product B" });
      await seedOrder({
        buyer: buyer._id,
        products: [productA._id, productB._id],
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].products).toHaveLength(2);
      expect(response.body.orders[0].products[0].photo).toBeUndefined();
      expect(response.body.orders[0].products[1].photo).toBeUndefined();
    });

    it("returns all matching orders in larger datasets for admins", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-large-dataset@example.com",
      });
      const { user: buyerA } = await seedUser({
        email: "large-buyer-a@example.com",
      });
      const { user: buyerB } = await seedUser({
        email: "large-buyer-b@example.com",
      });
      const product = await seedProduct({ name: "Large Dataset Product" });

      await seedOrder({ buyer: buyerA._id, products: [product._id] });
      await seedOrder({ buyer: buyerA._id, products: [product._id] });
      await seedOrder({ buyer: buyerA._id, products: [product._id] });
      await seedOrder({ buyer: buyerB._id, products: [product._id] });
      await seedOrder({ buyer: buyerB._id, products: [product._id] });
      await seedOrder({ buyer: buyerB._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(6);
    });

    it("returns both orders when createdAt timestamps are identical", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-tie-created-at@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "tie-created-at-buyer@example.com",
      });
      const product = await seedProduct({ name: "Tie CreatedAt Product" });
      const sameTime = new Date("2025-03-03T00:00:00.000Z");

      const orderA = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Processing",
        createdAt: sameTime,
      });
      const orderB = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Shipped",
        createdAt: sameTime,
      });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      const returnedIds = response.body.orders.map((o) => o._id.toString());
      expect(returnedIds).toEqual(
        expect.arrayContaining([orderA._id.toString(), orderB._id.toString()]),
      );
    });

    it("returns unique order ids without duplication in all-orders response", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-unique-ids@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "unique-ids-buyer@example.com",
      });
      const product = await seedProduct({ name: "Unique Ids All Product" });

      await seedOrder({ buyer: buyer._id, products: [product._id] });
      await seedOrder({ buyer: buyer._id, products: [product._id] });
      await seedOrder({ buyer: buyer._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      const ids = response.body.orders.map((o) => o._id.toString());
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("does not expose extra buyer fields beyond selected population in all-orders", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-buyer-fields@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-fields-hidden@example.com",
        phone: "83334444",
      });
      const product = await seedProduct({
        name: "Buyer Fields Hidden Product",
      });
      await seedOrder({ buyer: buyer._id, products: [product._id] });

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body.orders[0].buyer.name).toBe("John Doe");
      expect(response.body.orders[0].buyer.phone).toBeUndefined();
      expect(response.body.orders[0].buyer.email).toBeUndefined();
      expect(response.body.orders[0].buyer.password).toBeUndefined();
    });

    it("returns 401 when all-orders token _id is not a valid ObjectId", async () => {
      const invalidIdToken = JWT.sign(
        { _id: "not-an-objectid" },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", invalidIdToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("returns 401 when all-orders authorization header is empty", async () => {
      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", "");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("authorizes admin token even with extra JWT claims", async () => {
      const { user: admin } = await seedUser({
        role: 1,
        email: "admin-extra-claims@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "extra-claims-buyer@example.com",
      });
      const product = await seedProduct({ name: "Extra Claims Product" });
      await seedOrder({ buyer: buyer._id, products: [product._id] });

      const tokenWithExtraClaims = JWT.sign(
        {
          _id: admin._id,
          role: 1,
          permission: "all-orders:read",
          sessionId: "session-integration-test",
        },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", tokenWithExtraClaims);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toHaveLength(1);
    });

    it("returns 404 for unsupported POST method on /all-orders", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-post-method@example.com",
      });

      const response = await request(app)
        .post("/api/v1/auth/all-orders")
        .set("Authorization", token)
        .send({});

      expect(response.status).toBe(404);
    });

    it("returns 500 when all-orders query throws unexpectedly", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-query-throw@example.com",
      });

      const originalFind = orderModel.find;
      orderModel.find = () => {
        throw new Error("Synthetic query failure");
      };

      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error While Getting Orders");

      orderModel.find = originalFind;
    });
  });

  // orderStatus integration flows
  describe("order status flow", () => {
    it("updates order status from Not Process to Processing for admin", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-processing@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-processing@example.com",
      });
      const product = await seedProduct({ name: "Order Status Processing" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Not Process",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Processing" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.order.status).toBe("Processing");

      const updated = await orderModel.findById(order._id);
      expect(updated.status).toBe("Processing");
    });

    it("updates order status to Shipped for admin", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-shipped@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-shipped@example.com",
      });
      const product = await seedProduct({ name: "Order Status Shipped" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Processing",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Shipped" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("Shipped");

      const updated = await orderModel.findById(order._id);
      expect(updated.status).toBe("Shipped");
    });

    it("updates order status to Delivered for admin", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-delivered@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-delivered@example.com",
      });
      const product = await seedProduct({ name: "Order Status Delivered" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Shipped",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Delivered" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("Delivered");

      const updated = await orderModel.findById(order._id);
      expect(updated.status).toBe("Delivered");
    });

    it("updates order status to Cancelled for admin", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-cancelled@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-cancelled@example.com",
      });
      const product = await seedProduct({ name: "Order Status Cancelled" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Processing",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Cancelled" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("Cancelled");

      const updated = await orderModel.findById(order._id);
      expect(updated.status).toBe("Cancelled");
    });

    it("updates order status explicitly to Not Process for admin", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-not-process@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-not-process@example.com",
      });
      const product = await seedProduct({ name: "Order Status Not Process" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Processing",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Not Process" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("Not Process");

      const updated = await orderModel.findById(order._id);
      expect(updated.status).toBe("Not Process");
    });

    it("returns populated buyer with name only after status update", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-buyer-populate@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-buyer-populate@example.com",
        name: "Order Buyer Pop",
        phone: "85556666",
      });
      const product = await seedProduct({ name: "Order Buyer Pop Product" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Shipped" });

      expect(response.status).toBe(200);
      expect(response.body.order.buyer.name).toBe("Order Buyer Pop");
      expect(response.body.order.buyer.phone).toBeUndefined();
    });

    it("returns populated products without photo field after status update", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-product-populate@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-product-populate@example.com",
      });
      const product = await seedProduct({ name: "Order Product Pop" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Delivered" });

      expect(response.status).toBe(200);
      expect(response.body.order.products[0].name).toBe("Order Product Pop");
      expect(response.body.order.products[0].photo).toBeUndefined();
    });

    it("preserves payment object while updating status", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-payment-preserve@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-payment-preserve@example.com",
      });
      const product = await seedProduct({ name: "Order Payment Preserve" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        payment: { success: false, transactionId: "txn_status_1" },
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Cancelled" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("Cancelled");
      expect(response.body.order.payment.success).toBe(false);
      expect(response.body.order.payment.transactionId).toBe("txn_status_1");
    });

    it("keeps multiple products populated when updating status", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-multiple-products@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-multiple-products@example.com",
      });
      const productA = await seedProduct({ name: "Order Status Product A" });
      const productB = await seedProduct({ name: "Order Status Product B" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [productA._id, productB._id],
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Processing" });

      expect(response.status).toBe(200);
      expect(response.body.order.products).toHaveLength(2);
    });

    it("supports idempotent status update when setting the same status", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-idempotent@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-idempotent@example.com",
      });
      const product = await seedProduct({ name: "Order Status Idempotent" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
        status: "Delivered",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Delivered" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("Delivered");

      const updated = await orderModel.findById(order._id);
      expect(updated.status).toBe("Delivered");
    });

    it("applies sequential status updates and persists the latest state", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-sequential@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-sequential@example.com",
      });
      const product = await seedProduct({ name: "Order Status Sequential" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
      });

      const first = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Processing" });
      expect(first.status).toBe(200);

      const second = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Shipped" });
      expect(second.status).toBe(200);
      expect(second.body.order.status).toBe("Shipped");

      const updated = await orderModel.findById(order._id);
      expect(updated.status).toBe("Shipped");
    });

    it("returns updated order even when buyer was deleted before status update", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-deleted-buyer@example.com",
      });
      const { user: buyer } = await seedUser({
        email: "buyer-order-status-deleted-buyer@example.com",
      });
      const product = await seedProduct({ name: "Order Status Deleted Buyer" });
      const order = await seedOrder({
        buyer: buyer._id,
        products: [product._id],
      });
      await userModel.findByIdAndDelete(buyer._id);

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${order._id}`)
        .set("Authorization", token)
        .send({ status: "Cancelled" });

      expect(response.status).toBe(200);
      expect(response.body.order.buyer).toBeNull();
      expect(response.body.order.status).toBe("Cancelled");
    });

    it("returns 401 when order-status token is missing", async () => {
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when order-status token is malformed", async () => {
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", "not-a-jwt")
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when order-status token is signed with wrong secret", async () => {
      const { user } = await seedUser({
        role: 1,
        email: "admin-order-status-wrong-secret@example.com",
      });
      const wrongSecretToken = JWT.sign({ _id: user._id }, "wrong-secret");

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", wrongSecretToken)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns 401 when order-status token is expired", async () => {
      const { user } = await seedUser({
        role: 1,
        email: "admin-order-status-expired@example.com",
      });
      const expiredToken = JWT.sign({ _id: user._id }, TEST_JWT_SECRET, {
        expiresIn: -1,
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", expiredToken)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("accepts Bearer token format for order-status route", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-bearer@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Processing" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Order not found");
    });

    it("returns 401 for non-admin user on order-status route", async () => {
      const { token } = await seedUser({
        role: 0,
        email: "non-admin-order-status@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("UnAuthorized Access");
    });

    it("returns 401 when order-status token has no _id claim", async () => {
      const tokenWithoutId = JWT.sign({ role: 1 }, TEST_JWT_SECRET);

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", tokenWithoutId)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("returns 401 when order-status token has null _id", async () => {
      const tokenWithNullId = JWT.sign({ _id: null }, TEST_JWT_SECRET);

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", tokenWithNullId)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("returns 401 when order-status token _id is not a valid ObjectId", async () => {
      const invalidIdToken = JWT.sign(
        { _id: "not-an-objectid" },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", invalidIdToken)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("returns 401 when order-status admin token references deleted user", async () => {
      const deletedAdminId = new mongoose.Types.ObjectId();
      const deletedAdminToken = JWT.sign(
        { _id: deletedAdminId },
        TEST_JWT_SECRET,
      );

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", deletedAdminToken)
        .send({ status: "Processing" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in admin middleware");
    });

    it("returns 400 when status is missing in request body", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-missing-status@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Status is required");
      expect(response.body.error).toBe("Status is required");
    });

    it("returns 400 when status is null", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-null-status@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: null });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Status is required");
    });

    it("returns 400 when status is an empty string", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-empty-status@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: "" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Status is required");
    });

    it("returns 400 when status is not in enum", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-invalid-enum@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: "Completed" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid status value");
    });

    it("returns 400 when status has casing mismatch", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-casing-mismatch@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: "delivered" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid status value");
    });

    it("returns 400 when status contains trailing spaces", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-trailing-spaces@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: "Delivered " });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid status value");
    });

    it("returns 404 when order id is valid but order is not found", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-not-found@example.com",
      });

      const response = await request(app)
        .put(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: "Shipped" });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Order not found");
      expect(response.body.error).toBe("Order not found");
    });

    it("returns 500 when order id is malformed", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-malformed-order-id@example.com",
      });

      const response = await request(app)
        .put("/api/v1/auth/order-status/not-an-objectid")
        .set("Authorization", token)
        .send({ status: "Shipped" });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error While Updating Order");
    });

    it("returns 404 for unsupported POST method on /order-status/:orderId", async () => {
      const { token } = await seedUser({
        role: 1,
        email: "admin-order-status-unsupported-method@example.com",
      });

      const response = await request(app)
        .post(`/api/v1/auth/order-status/${new mongoose.Types.ObjectId()}`)
        .set("Authorization", token)
        .send({ status: "Shipped" });

      expect(response.status).toBe(404);
    });
  });
});
