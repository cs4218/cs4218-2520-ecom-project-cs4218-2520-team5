// MS2 Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI

/**
 * INTEGRATION TEST: Auth Middleware + JWT (Backend)
 *
 * Approach: Bottom-Up Partial Integration
 *
 * Modules integrated (REAL, not mocked):
 *   - middlewares/authMiddleware.js  (requireSignIn)
 *   - jsonwebtoken                   (real JWT.sign and JWT.verify)
 *
 * Mocked (external boundary only):
 *   - models/userModel.js — database layer (not used by requireSignIn, but
 *     imported by the module; mocked to avoid loading mongoose).
 *
 * Why this is NOT a unit test:
 *   The companion unit test mocks JWT.verify entirely. This test signs real
 *   JWT tokens with JWT.sign, then passes them through the real requireSignIn
 *   middleware to verify the full cryptographic token-validation pipeline.
 *
 * Stories covered:
 *   Story 3 — Route protection (backend): valid-token authorization,
 *             invalid/expired/missing token rejection, user ID extraction.
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import JWT from "jsonwebtoken";

/* Mock only the database model (requireSignIn does not use it, but the
   module file imports it for isAdmin) */
jest.unstable_mockModule("../models/userModel.js", () => ({
  default: { findById: jest.fn() },
}));

const { requireSignIn } = await import("./authMiddleware.js");

describe("Auth Middleware Integration Tests — Story 3: Route Protection", () => {
  const JWT_SECRET = "integration-test-secret";
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    process.env.JWT_SECRET = JWT_SECRET;
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Interaction 1 — Authenticated user with valid token can access protected routes
  it("should call next and populate req.user for a valid real JWT", async () => {
    const userId = "user-abc-123";
    const realToken = JWT.sign({ _id: userId }, JWT_SECRET, {
      expiresIn: "1h",
    });
    req.headers.authorization = realToken;

    await requireSignIn(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user._id).toBe(userId);
  });

  // Interaction 2 — Invalid token blocks access
  it("should return 401 and not call next for an invalid/tampered JWT", async () => {
    req.headers.authorization = "invalid.jwt.token";

    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  });

  // Interaction 2 — Token signed with wrong secret is rejected
  it("should return 401 for a token signed with a different secret", async () => {
    const wrongSecretToken = JWT.sign({ _id: "u1" }, "wrong-secret", {
      expiresIn: "1h",
    });
    req.headers.authorization = wrongSecretToken;

    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  });

  // Interaction 4 — Expired token keeps user blocked
  it("should return 401 for an expired JWT", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = JWT.sign(
      { _id: "u1", iat: now - 20, exp: now - 10 },
      JWT_SECRET
    );
    req.headers.authorization = expiredToken;

    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  });

  // Interaction 3 — Missing token prevents authorization
  it("should return 401 when authorization header is missing", async () => {
    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Unauthorized: authentication token required",
    });
  });

  // Interaction 1 — Correct user ID is extracted from real JWT
  it("should extract the correct user ID and token metadata into req.user", async () => {
    const userId = "specific-user-456";
    const token = JWT.sign({ _id: userId }, JWT_SECRET, { expiresIn: "7d" });
    req.headers.authorization = token;

    await requireSignIn(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user._id).toBe(userId);
    expect(req.user.iat).toBeDefined();
    expect(req.user.exp).toBeDefined();
  });
});
