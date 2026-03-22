// MS2 Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI

/**
 * INTEGRATION TEST: Auth Controller + Auth Helper + JWT (Backend)
 *
 * Approach: Bottom-Up Partial Integration
 *
 * Modules integrated (REAL, not mocked):
 *   - controllers/authController.js  (registerController, loginController)
 *   - helpers/authHelper.js          (hashPassword / comparePassword — real bcrypt)
 *   - jsonwebtoken                   (real JWT.sign for token generation)
 *
 * Mocked (external boundary only):
 *   - models/userModel.js — MongoDB database layer. Mocked to keep the test
 *     deterministic without a running database.
 *
 * Why this is NOT a unit test:
 *   The companion unit test (authController.test.js) mocks BOTH authHelper and
 *   jsonwebtoken, testing the controller in complete isolation. This integration
 *   test uses real bcrypt hashing/comparison and real JWT signing so the entire
 *   controller → helper → crypto pipeline is exercised together.
 *
 * Stories covered:
 *   Story 1 — Registration workflow (backend): field validation, password
 *             hashing with real bcrypt, user persistence, duplicate rejection.
 *   Story 2 — Login flow (backend): credential validation, real bcrypt
 *             comparison, real JWT generation, error handling.
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";

/* ---------- mock ONLY the database model (external I/O boundary) ---------- */
const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockModelConstructor = jest.fn();

jest.unstable_mockModule("../models/userModel.js", () => {
  const model = function (...args) {
    return mockModelConstructor(...args);
  };
  model.findOne = mockFindOne;
  return { default: model };
});

/* authHelper and jsonwebtoken are NOT mocked — they are real */
const { registerController, loginController } = await import(
  "./authController.js"
);

describe("Auth Controller Integration Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    process.env.JWT_SECRET = "integration-test-secret";
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================================================================
  // STORY 1: Registration workflow integration
  // ==================================================================
  describe("Story 1: Registration workflow integration", () => {
    const validBody = {
      name: "Integration User",
      email: "integration@test.com",
      password: "securePassword123",
      phone: "9876543210",
      address: "456 Integration Ave",
      answer: "Basketball",
    };

    // Interaction 4 — Password is hashed before persistence
    it("should hash the password with real bcrypt before saving", async () => {
      req.body = validBody;
      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({ ...validBody, _id: "new-id" });
      mockModelConstructor.mockReturnValue({ save: mockSave });

      await registerController(req, res);

      const savedData = mockModelConstructor.mock.calls[0][0];
      expect(savedData.password).not.toBe(validBody.password);
      const matches = await bcrypt.compare(
        validBody.password,
        savedData.password
      );
      expect(matches).toBe(true);
    });

    // Interaction 5 — New user is saved successfully in the database
    it("should pass all registration fields through to the model and save", async () => {
      req.body = validBody;
      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue({ ...validBody, _id: "id1" });
      mockModelConstructor.mockReturnValue({ save: mockSave });

      await registerController(req, res);

      const savedData = mockModelConstructor.mock.calls[0][0];
      expect(savedData.name).toBe(validBody.name);
      expect(savedData.email).toBe(validBody.email);
      expect(savedData.phone).toBe(validBody.phone);
      expect(savedData.address).toBe(validBody.address);
      expect(savedData.answer).toBe(validBody.answer);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "User Register Successfully",
        })
      );
    });

    // Interaction 3 — Backend validates required fields
    it("should validate all required fields before hashing or saving", async () => {
      const checks = [
        { field: "name", message: "Name is Required" },
        { field: "email", message: "Email is Required" },
        { field: "password", message: "Password is Required" },
        { field: "phone", message: "Phone no is Required" },
        { field: "address", message: "Address is Required" },
        { field: "answer", message: "Answer is Required" },
      ];

      for (const { field, message } of checks) {
        jest.clearAllMocks();
        req.body = { ...validBody, [field]: "" };
        await registerController(req, res);

        expect(res.send).toHaveBeenCalledWith({ message });
        expect(mockModelConstructor).not.toHaveBeenCalled();
      }
    });

    // Interaction 6 — Duplicate email registration is rejected
    it("should reject duplicate email without hashing the password", async () => {
      req.body = validBody;
      mockFindOne.mockResolvedValue({ _id: "existing-id" });

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login",
      });
      expect(mockModelConstructor).not.toHaveBeenCalled();
    });

    // Error path — controller + helper integration under failure
    it("should return 500 when the database save throws", async () => {
      req.body = validBody;
      const dbError = new Error("DB write failed");
      mockFindOne.mockResolvedValue(null);
      mockSave.mockRejectedValue(dbError);
      mockModelConstructor.mockReturnValue({ save: mockSave });

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in Registration",
        })
      );
    });
  });

  // ==================================================================
  // STORY 2: Login flow integration
  // ==================================================================
  describe("Story 2: Login flow integration", () => {
    const testPassword = "correctPassword123";
    let hashedPassword;
    let mockUser;

    beforeEach(async () => {
      hashedPassword = await bcrypt.hash(testPassword, 10);
      mockUser = {
        _id: "user-123",
        name: "Login User",
        email: "login@example.com",
        phone: "1112223333",
        address: "789 Login St",
        role: 0,
        password: hashedPassword,
      };
    });

    // Interaction 2 — Backend validates email and password (success)
    it("should authenticate with correct password via real bcrypt comparison", async () => {
      req.body = { email: mockUser.email, password: testPassword };
      mockFindOne.mockResolvedValue(mockUser);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.send.mock.calls[0][0];
      expect(data.success).toBe(true);
      expect(data.message).toBe("login successfully");
    });

    // Interaction 3 — JWT token is returned on success
    it("should return a real JWT that can be verified", async () => {
      req.body = { email: mockUser.email, password: testPassword };
      mockFindOne.mockResolvedValue(mockUser);

      await loginController(req, res);

      const data = res.send.mock.calls[0][0];
      expect(data.token).toBeDefined();
      const decoded = JWT.verify(data.token, process.env.JWT_SECRET);
      expect(decoded._id).toBe(mockUser._id);
      expect(decoded.exp).toBeDefined();
    });

    // Interaction 2 — user details returned without password
    it("should return user details without the password field", async () => {
      req.body = { email: mockUser.email, password: testPassword };
      mockFindOne.mockResolvedValue(mockUser);

      await loginController(req, res);

      const data = res.send.mock.calls[0][0];
      expect(data.user).toEqual({
        _id: "user-123",
        name: "Login User",
        email: "login@example.com",
        phone: "1112223333",
        address: "789 Login St",
        role: 0,
      });
      expect(data.user.password).toBeUndefined();
    });

    // Interaction 2 — Backend rejects wrong password
    it("should reject login with incorrect password via real bcrypt", async () => {
      req.body = { email: mockUser.email, password: "wrongPassword" };
      mockFindOne.mockResolvedValue(mockUser);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });

    // Interaction 8 — Email not registered
    it("should reject login when email does not exist", async () => {
      req.body = { email: "nobody@test.com", password: "any" };
      mockFindOne.mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registerd",
      });
    });

    // Interaction 8 — Missing credentials
    it("should reject login when credentials are missing", async () => {
      req.body = { email: "", password: "pass" };

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });
  });
});
