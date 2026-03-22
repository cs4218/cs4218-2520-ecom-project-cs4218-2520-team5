// MS2 Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI

/**
 * ROUTE-LEVEL INTEGRATION TESTS — Supertest + Express + REAL MongoDB
 *
 * Approach: HTTP requests via Supertest against the real `app.js`, exercising:
 *   route → controller → authHelper (bcrypt) / JWT → userModel → MongoDB.
 *
 * REAL (not mocked):
 *   - app.js, routes/authRoute.js, authController, authHelper, jsonwebtoken,
 *     requireSignIn middleware, userModel, Mongoose persistence.
 *
 * DATABASE:
 *   - Uses MONGO_URL_TEST if set, otherwise MONGO_URL with database name
 *     `cs4218_ecom_integration_test` (see tests/helpers/integrationMongo.js).
 *   - `users` collection is cleared before each test; no userModel mocking.
 *
 * ENV:
 *   - Loads JWT_SECRET and Mongo URL from .env via dotenv (same pattern as server).
 */

import "dotenv/config";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import request from "supertest";
import userModel from "../../models/userModel.js";
import app from "../../app.js";
import {
  connectIntegrationMongo,
  disconnectIntegrationMongo,
  clearUsersCollection,
} from "../helpers/integrationMongo.js";

const API = "/api/v1/auth";

const registerPayload = {
  name: "Mongo Integration User",
  email: "mongo.integration.user@example.com",
  password: "SecurePassw0rd!",
  phone: "5559876543",
  address: "100 Integration Street",
  answer: "Tennis",
};

jest.setTimeout(60000);

describe("Auth routes — Supertest + real MongoDB", () => {
  beforeAll(async () => {
    await connectIntegrationMongo();
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET must be set in environment for auth tests");
    }
  });

  afterAll(async () => {
    await clearUsersCollection();
    await disconnectIntegrationMongo();
  });

  beforeEach(async () => {
    await clearUsersCollection();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // A. POST /api/v1/auth/register
  // -------------------------------------------------------------------------
  describe("POST /api/v1/auth/register", () => {
    it("rejects missing required fields (name)", async () => {
      const res = await request(app)
        .post(`${API}/register`)
        .send({ ...registerPayload, name: "" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Name is Required" });

      const count = await userModel.countDocuments();
      expect(count).toBe(0);
    });

    it("rejects missing required fields (email)", async () => {
      const res = await request(app)
        .post(`${API}/register`)
        .send({ ...registerPayload, email: "" });

      expect(res.body).toEqual({ message: "Email is Required" });
    });

    it("creates a real user in MongoDB with 201 and correct response shape", async () => {
      const res = await request(app).post(`${API}/register`).send(registerPayload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        success: true,
        message: "User Register Successfully",
        user: expect.objectContaining({
          email: registerPayload.email,
          name: registerPayload.name,
        }),
      });

      const doc = await userModel.findOne({ email: registerPayload.email }).lean();
      expect(doc).toBeTruthy();
      expect(doc.name).toBe(registerPayload.name);
      expect(doc.password).not.toBe(registerPayload.password);
    });

    it("stores a bcrypt hash in MongoDB, not the plaintext password", async () => {
      await request(app).post(`${API}/register`).send(registerPayload);

      const doc = await userModel.findOne({ email: registerPayload.email }).lean();
      expect(doc.password).not.toBe(registerPayload.password);
      const match = await bcrypt.compare(registerPayload.password, doc.password);
      expect(match).toBe(true);
    });

    it("rejects duplicate email using real persisted data", async () => {
      const first = await request(app)
        .post(`${API}/register`)
        .send(registerPayload);
      expect(first.status).toBe(201);

      const second = await request(app)
        .post(`${API}/register`)
        .send({ ...registerPayload, name: "Someone Else" });

      expect(second.status).toBe(200);
      expect(second.body).toEqual({
        success: false,
        message: "Already Register please login",
      });

      const count = await userModel.countDocuments({ email: registerPayload.email });
      expect(count).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // B. POST /api/v1/auth/login
  // -------------------------------------------------------------------------
  describe("POST /api/v1/auth/login", () => {
    const loginEmail = "login.persisted@example.com";
    const loginPassword = "LoginSecret!234";

    beforeEach(async () => {
      await request(app).post(`${API}/register`).send({
        ...registerPayload,
        email: loginEmail,
        password: loginPassword,
        name: "Login Test User",
      });
    });

    it("succeeds against a real user in MongoDB and returns structured success", async () => {
      const res = await request(app).post(`${API}/login`).send({
        email: loginEmail,
        password: loginPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("login successfully");
      expect(res.body.user.email).toBe(loginEmail);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it("returns a verifiable JWT signed with JWT_SECRET", async () => {
      const res = await request(app).post(`${API}/login`).send({
        email: loginEmail,
        password: loginPassword,
      });

      const decoded = JWT.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded._id).toBeDefined();

      const fromDb = await userModel.findOne({ email: loginEmail }).lean();
      expect(String(decoded._id)).toBe(String(fromDb._id));
    });

    it("rejects wrong password with correct status and body", async () => {
      const res = await request(app).post(`${API}/login`).send({
        email: loginEmail,
        password: "wrong-password",
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: false,
        message: "Invalid Password",
      });
    });

    it("rejects non-existent email", async () => {
      const res = await request(app).post(`${API}/login`).send({
        email: "nobody-here@example.com",
        password: loginPassword,
      });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        success: false,
        message: "Email is not registerd",
      });
    });

    it("rejects missing credentials with structured error", async () => {
      const res = await request(app)
        .post(`${API}/login`)
        .send({ email: "", password: "x" });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        success: false,
        message: "Invalid email or password",
      });
    });
  });

  // -------------------------------------------------------------------------
  // C. GET /api/v1/auth/user-auth
  // -------------------------------------------------------------------------
  describe("GET /api/v1/auth/user-auth", () => {
    async function loginAndGetToken() {
      await request(app).post(`${API}/register`).send(registerPayload);
      const loginRes = await request(app).post(`${API}/login`).send({
        email: registerPayload.email,
        password: registerPayload.password,
      });
      return loginRes.body.token;
    }

    it("allows access with a valid raw JWT from login", async () => {
      const token = await loginAndGetToken();
      const res = await request(app)
        .get(`${API}/user-auth`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it("allows access with Authorization: Bearer <token>", async () => {
      const token = await loginAndGetToken();
      const res = await request(app)
        .get(`${API}/user-auth`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it("returns 401 when Authorization header is missing", async () => {
      const res = await request(app).get(`${API}/user-auth`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Unauthorized|authentication token/i);
    });

    it("returns 401 for a malformed JWT", async () => {
      const res = await request(app)
        .get(`${API}/user-auth`)
        .set("Authorization", "not-a-valid-jwt");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 401 for an expired JWT", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredToken = JWT.sign(
        { _id: "507f1f77bcf86cd799439011", exp: now - 120, iat: now - 3600 },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .get(`${API}/user-auth`)
        .set("Authorization", expiredToken);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 401 for a JWT signed with a different secret", async () => {
      const token = JWT.sign({ _id: "507f1f77bcf86cd799439011" }, "wrong-secret", {
        expiresIn: "1h",
      });

      const res = await request(app)
        .get(`${API}/user-auth`)
        .set("Authorization", token);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
