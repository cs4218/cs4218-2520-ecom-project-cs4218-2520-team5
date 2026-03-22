// Ivan Ang, A0259256U
// Tests for braintreeTokenController and brainTreePaymentController when gateway is null
// (i.e., Braintree credentials not configured). Covers the !gateway guard branches.

import { jest } from "@jest/globals";

// Mock gateway as null to simulate unconfigured Braintree
jest.unstable_mockModule("../config/braintree.js", () => ({
  default: null,
}));

jest.unstable_mockModule("../models/productModel.js", () => ({
  default: {},
}));

jest.unstable_mockModule("../models/categoryModel.js", () => ({
  default: {},
}));

jest.unstable_mockModule("../models/orderModel.js", () => ({
  default: {},
}));

jest.unstable_mockModule("fs", () => ({
  default: { readFileSync: jest.fn() },
  readFileSync: jest.fn(),
}));

jest.unstable_mockModule("slugify", () => ({
  default: jest.fn((s) => s),
}));

const { braintreeTokenController, brainTreePaymentController } =
  await import("./productController.js");

describe("Braintree controllers — gateway not configured", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("braintreeTokenController: should return 503 when gateway is null", async () => {
    await braintreeTokenController(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Payment gateway not configured",
    });
  });

  it("brainTreePaymentController: should return 503 when gateway is null", async () => {
    req.body = { nonce: "test-nonce", cart: [{ price: 10 }] };
    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Payment gateway not configured",
    });
  });
});
