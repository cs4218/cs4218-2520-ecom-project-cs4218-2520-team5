// Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const mockVerify = jest.fn();
const mockSign = jest.fn();
const mockFindById = jest.fn();

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: mockSign,
    verify: mockVerify,
  },
}));

jest.unstable_mockModule("../models/userModel.js", () => ({
  default: {
    findById: mockFindById,
  },
}));

const { requireSignIn, isAdmin } = await import("./authMiddleware.js");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    req = { headers: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("requireSignIn", () => {
    it("should decode token and call next for a valid token", async () => {
      req.headers.authorization = "valid-token";
      process.env.JWT_SECRET = "test-secret";
      mockVerify.mockReturnValue({ _id: "u1" });

      await requireSignIn(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith("valid-token", "test-secret");
      expect(req.user).toEqual({ _id: "u1" });
      expect(next).toHaveBeenCalled();
    });

    it("should not call next when token verification fails", async () => {
      req.headers.authorization = "bad-token";
      process.env.JWT_SECRET = "test-secret";
      mockVerify.mockImplementation(() => {
        throw new Error("invalid signature");
      });

      await requireSignIn(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it("should not call next when authorization header is missing", async () => {
      process.env.JWT_SECRET = "test-secret";
      mockVerify.mockImplementation(() => {
        throw new Error("jwt must be provided");
      });

      await requireSignIn(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin", () => {
    it("should call next when user has admin role", async () => {
      req.user = { _id: "admin-1" };
      mockFindById.mockResolvedValue({ role: 1 });

      await isAdmin(req, res, next);

      expect(mockFindById).toHaveBeenCalledWith("admin-1");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 when user does not have admin role", async () => {
      req.user = { _id: "user-1" };
      mockFindById.mockResolvedValue({ role: 0 });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "UnAuthorized Access",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when database lookup fails", async () => {
      req.user = { _id: "user-1" };
      const error = new Error("DB error");
      mockFindById.mockRejectedValue(error);

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error,
        message: "Error in admin middleware",
      });
    });
  });
});
