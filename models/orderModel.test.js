// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import mongoose from "mongoose";
import Order from "./orderModel.js";

describe("Order Model Unit Tests", () => {
  // ===== SCHEMA VALIDATION TESTS =====
  // Testing Style: Output-based (verify validation behavior)

  it("should create order with default status 'Not Process'", () => {
    // Arrange
    const orderData = {
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
    };

    // Act
    const order = new Order(orderData);

    // Assert - verify default value is set
    expect(order.status).toBe("Not Process");
  });

  it("should accept valid status from enum", () => {
    // Arrange
    const validStatuses = [
      "Not Process",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    // Act & Assert - each valid status should be accepted
    validStatuses.forEach((status) => {
      const order = new Order({
        products: [new mongoose.Types.ObjectId()],
        buyer: new mongoose.Types.ObjectId(),
        payment: {},
        status: status,
      });

      expect(order.status).toBe(status);
    });
  });

  it("should reject invalid status value during validation", async () => {
    // Arrange
    const order = new Order({
      products: [new mongoose.Types.ObjectId()],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
      status: "InvalidStatus",
    });

    // Act & Assert - validation should fail
    const validationError = order.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError.errors.status).toBeDefined();
    expect(validationError.errors.status.kind).toBe("enum");
  });

  it("should store products as array of ObjectIds", () => {
    // Arrange
    const productId1 = new mongoose.Types.ObjectId();
    const productId2 = new mongoose.Types.ObjectId();

    // Act
    const order = new Order({
      products: [productId1, productId2],
      buyer: new mongoose.Types.ObjectId(),
      payment: {},
    });

    // Assert - verify array structure and types
    expect(Array.isArray(order.products)).toBe(true);
    expect(order.products).toHaveLength(2);
    expect(order.products[0]).toEqual(productId1);
    expect(order.products[1]).toEqual(productId2);
  });
});
