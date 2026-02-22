import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const mockFindOne = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockUserModelConstructor = jest.fn();
const mockHashPassword = jest.fn();
const mockComparePassword = jest.fn();
const mockSign = jest.fn();
const mockVerify = jest.fn();

jest.unstable_mockModule("../models/userModel.js", () => {
  const model = function (...args) {
    return mockUserModelConstructor(...args);
  };
  model.findOne = mockFindOne;
  model.findById = mockFindById;
  model.findByIdAndUpdate = mockFindByIdAndUpdate;
  return { default: model };
});

jest.unstable_mockModule("../helpers/authHelper.js", () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: mockSign,
    verify: mockVerify,
  },
}));

const {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} = await import("./authController.js");

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
      mockFindOne.mockResolvedValue({ _id: "existing-id" });

      await registerController(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({
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
      mockFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue("hashed_pw");
      const savedUser = { ...validBody, password: "hashed_pw", _id: "new-id" };
      const mockSave = jest.fn().mockResolvedValue(savedUser);
      mockUserModelConstructor.mockReturnValue({ save: mockSave });

      await registerController(req, res);

      expect(mockHashPassword).toHaveBeenCalledWith(validBody.password);
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
      mockFindOne.mockRejectedValue(error);

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in Registration",
        error,
      });
    });
  });

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
      mockFindOne.mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Email is not registerd",
      });
    });

    it("should return 200 with failure when password does not match", async () => {
      req.body = { email: "john@test.com", password: "wrong" };
      mockFindOne.mockResolvedValue({
        _id: "u1",
        password: "hashed_pw",
      });
      mockComparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(mockComparePassword).toHaveBeenCalledWith("wrong", "hashed_pw");
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
      mockFindOne.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(true);
      mockSign.mockReturnValue("jwt-token-abc");

      await loginController(req, res);

      expect(mockSign).toHaveBeenCalledWith(
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
      mockFindOne.mockRejectedValue(error);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in login",
        error,
      });
    });
  });

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
      mockFindOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({
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
      mockFindOne.mockResolvedValue({ _id: "u1" });
      mockHashPassword.mockResolvedValue("hashed_new");
      mockFindByIdAndUpdate.mockResolvedValue({});

      await forgotPasswordController(req, res);

      expect(mockHashPassword).toHaveBeenCalledWith("newpass123");
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("u1", {
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
      mockFindOne.mockRejectedValue(error);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
        error,
      });
    });
  });

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
