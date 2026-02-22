import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js", () => {
  const mockModel = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.findByIdAndUpdate = jest.fn();
  return { __esModule: true, default: mockModel };
});

jest.mock("../helpers/authHelper.js", () => ({
  __esModule: true,
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── registerController ───────────────────────────────────────────

  describe("registerController", () => {
    const validBody = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      phone: "1234567890",
      address: "123 Main St",
      answer: "Football",
    };

    it("should return error when name is missing", async () => {
      req.body = { ...validBody, name: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Name is Required" });
    });

    it("should return error when email is missing", async () => {
      req.body = { ...validBody, email: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
    });

    it("should return error when password is missing", async () => {
      req.body = { ...validBody, password: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Password is Required",
      });
    });

    it("should return error when phone is missing", async () => {
      req.body = { ...validBody, phone: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Phone no is Required",
      });
    });

    it("should return error when address is missing", async () => {
      req.body = { ...validBody, address: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Address is Required",
      });
    });

    it("should return error when answer is missing", async () => {
      req.body = { ...validBody, answer: "" };

      await registerController(req, res);

      expect(res.send).toHaveBeenCalledWith({
        message: "Answer is Required",
      });
    });

    it("should return 200 with failure message when user already exists", async () => {
      req.body = validBody;
      userModel.findOne.mockResolvedValue({ _id: "existing-id" });

      await registerController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: validBody.email,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Already Register please login",
      });
    });

    it("should register a new user successfully and return 201", async () => {
      req.body = validBody;
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed_pw");
      const savedUser = { ...validBody, password: "hashed_pw", _id: "new-id" };
      const mockSave = jest.fn().mockResolvedValue(savedUser);
      userModel.mockImplementation(() => ({ save: mockSave }));

      await registerController(req, res);

      expect(hashPassword).toHaveBeenCalledWith(validBody.password);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "User Register Successfully",
        user: savedUser,
      });
    });

    it("should return 500 when an unexpected error occurs", async () => {
      req.body = validBody;
      const error = new Error("Database connection failed");
      userModel.findOne.mockRejectedValue(error);

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in Registration",
        error,
      });
    });
  });

  // ─── loginController ─────────────────────────────────────────────

  describe("loginController", () => {
    it("should return 404 when email is missing", async () => {
      req.body = { password: "pass123" };

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should return 404 when password is missing", async () => {
      req.body = { email: "test@test.com" };

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should return 404 when both email and password are missing", async () => {
      req.body = {};

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 404 when user is not found", async () => {
      req.body = { email: "nobody@test.com", password: "pass" };
      userModel.findOne.mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registerd",
      });
    });

    it("should return 200 with failure when password does not match", async () => {
      req.body = { email: "john@test.com", password: "wrong" };
      userModel.findOne.mockResolvedValue({
        _id: "u1",
        password: "hashed_pw",
      });
      comparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(comparePassword).toHaveBeenCalledWith("wrong", "hashed_pw");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid Password",
      });
    });

    it("should login successfully and return user with token", async () => {
      const mockUser = {
        _id: "u1",
        name: "John",
        email: "john@test.com",
        phone: "123",
        address: "Street",
        role: 0,
        password: "hashed_pw",
      };
      req.body = { email: "john@test.com", password: "pass123" };
      process.env.JWT_SECRET = "test-secret";
      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("jwt-token-abc");

      await loginController(req, res);

      expect(JWT.sign).toHaveBeenCalledWith(
        { _id: "u1" },
        "test-secret",
        { expiresIn: "7d" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "login successfully",
        user: {
          _id: "u1",
          name: "John",
          email: "john@test.com",
          phone: "123",
          address: "Street",
          role: 0,
        },
        token: "jwt-token-abc",
      });
    });

    it("should return 500 when an unexpected error occurs", async () => {
      req.body = { email: "test@test.com", password: "pass" };
      const error = new Error("DB failure");
      userModel.findOne.mockRejectedValue(error);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in login",
        error,
      });
    });
  });

  // ─── forgotPasswordController ─────────────────────────────────────

  describe("forgotPasswordController", () => {
    it("should return 400 when email is missing", async () => {
      req.body = { answer: "ans", newPassword: "newpass" };

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Email is required",
      });
    });

    it("should return 400 when answer is missing", async () => {
      req.body = { email: "test@test.com", newPassword: "newpass" };

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Answer is required",
      });
    });

    it("should return 400 when newPassword is missing", async () => {
      req.body = { email: "test@test.com", answer: "ans" };

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "New Password is required",
      });
    });

    it("should return 404 when email and answer combination is wrong", async () => {
      req.body = {
        email: "wrong@test.com",
        answer: "wrong",
        newPassword: "new123",
      };
      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "wrong@test.com",
        answer: "wrong",
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Wrong Email Or Answer",
      });
    });

    it("should reset password successfully", async () => {
      req.body = {
        email: "john@test.com",
        answer: "Football",
        newPassword: "newpass123",
      };
      userModel.findOne.mockResolvedValue({ _id: "u1" });
      hashPassword.mockResolvedValue("hashed_new");
      userModel.findByIdAndUpdate.mockResolvedValue({});

      await forgotPasswordController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("newpass123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("u1", {
        password: "hashed_new",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Password Reset Successfully",
      });
    });

    it("should return 500 when an unexpected error occurs", async () => {
      req.body = {
        email: "john@test.com",
        answer: "Football",
        newPassword: "new123",
      };
      const error = new Error("DB error");
      userModel.findOne.mockRejectedValue(error);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
        error,
      });
    });
  });

  // ─── testController ──────────────────────────────────────────────

  describe("testController", () => {
    it("should send Protected Routes message", () => {
      testController(req, res);

      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should return error when res.send throws", () => {
      const error = new Error("send failed");
      res.send.mockImplementationOnce(() => { throw error; });

      testController(req, res);

      expect(res.send).toHaveBeenCalledWith({ error });
    });
  });
});
