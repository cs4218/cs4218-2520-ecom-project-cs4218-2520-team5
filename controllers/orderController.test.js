// Alyssa Ong, A0264663X (added test cases for the controllers for order)
// The test cases are generated with the help from AI.

import {
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../controllers/orderController.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword } from "../helpers/authHelper.js";

// Mock dependencies for isolation
jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../helpers/authHelper.js");

describe("updateProfileController", () => {
  // Mock request and response objects
  let req;
  let res;
  let mockUser;

  beforeEach(() => {
    // Arrange - Setup common test data
    req = {
      user: { _id: "validUserId123" },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockUser = {
      _id: "validUserId123",
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      address: "123 Main St",
      password: "hashedPassword123",
    };

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ===== AUTHENTICATION & AUTHORIZATION TESTS =====
  // Testing Style: State-based (verify response state)

  describe("Authentication validation", () => {
    it("should return 401 when req.user is missing", async () => {
      // Arrange
      req.user = undefined;

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
      expect(userModel.findById).not.toHaveBeenCalled();
    });

    it("should return 401 when req.user._id is missing", async () => {
      // Arrange
      req.user = {};

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
    });

    it("should return 401 when req.user._id is null", async () => {
      // Arrange
      req.user = { _id: null };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
    });
  });

  // ===== USER EXISTENCE TESTS =====
  // Testing Style: State-based

  describe("User existence validation", () => {
    it("should return 404 when user is not found in database", async () => {
      // Arrange
      userModel.findById.mockResolvedValue(null);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith("validUserId123");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });
  });

  // ===== INPUT VALIDATION TESTS =====
  // Testing Style: Output-based (input → expected output)

  describe("Empty string validation", () => {
    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
    });

    it("should return 400 when name is empty string", async () => {
      // Arrange
      req.body = { name: "" };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: "Name cannot be empty",
      });
    });

    it("should return 400 when phone is empty string", async () => {
      // Arrange
      req.body = { phone: "" };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: "Phone cannot be empty",
      });
    });

    it("should return 400 when address is empty string", async () => {
      // Arrange
      req.body = { address: "" };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: "Address cannot be empty",
      });
    });
  });

  // ===== PASSWORD VALIDATION TESTS =====
  // Testing Style: Output-based

  describe("Password validation", () => {
    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
    });

    it("should return 400 when password is less than 6 characters", async () => {
      // Arrange
      req.body = { password: "12345" };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: "Password is required and 6 character long",
      });
    });

    it("should accept password with exactly 6 characters", async () => {
      // Arrange
      req.body = { password: "123456" };
      hashPassword.mockResolvedValue("hashedPassword456");
      const mockUpdatedUser = { ...mockUser, password: "hashedPassword456" };
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith("123456");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should accept password with more than 6 characters", async () => {
      // Arrange
      req.body = { password: "1234567890" };
      hashPassword.mockResolvedValue("hashedPassword890");
      const mockUpdatedUser = { ...mockUser, password: "hashedPassword890" };
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith("1234567890");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ===== SUCCESSFUL UPDATE TESTS =====
  // Testing Style: State-based + Communication-based

  describe("Successful profile updates", () => {
    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
    });

    it("should successfully update all fields when provided", async () => {
      // Arrange
      req.body = {
        name: "Jane Smith",
        password: "newPassword123",
        phone: "9876543210",
        address: "456 Oak Ave",
      };
      hashPassword.mockResolvedValue("hashedNewPassword");
      const mockUpdatedUser = {
        _id: "validUserId123",
        name: "Jane Smith",
        phone: "9876543210",
        address: "456 Oak Ave",
      };
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert - Verify communication (mock verification)
      expect(userModel.findById).toHaveBeenCalledWith("validUserId123");
      expect(hashPassword).toHaveBeenCalledWith("newPassword123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "validUserId123",
        {
          name: "Jane Smith",
          password: "hashedNewPassword",
          phone: "9876543210",
          address: "456 Oak Ave",
        },
        { new: true },
      );
      expect(mockChain.select).toHaveBeenCalledWith("-password");

      // Assert - Verify state (response)
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: mockUpdatedUser,
      });
    });

    it("should update only name when only name is provided", async () => {
      // Arrange
      req.body = { name: "Jane Smith" };
      const mockUpdatedUser = {
        ...mockUser,
        name: "Jane Smith",
      };
      delete mockUpdatedUser.password;
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "validUserId123",
        {
          name: "Jane Smith",
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
        },
        { new: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should keep existing values when no fields are provided", async () => {
      // Arrange
      req.body = {};
      const mockUpdatedUserWithoutPassword = { ...mockUser };
      delete mockUpdatedUserWithoutPassword.password;
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUserWithoutPassword),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "validUserId123",
        {
          name: mockUser.name,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
        },
        { new: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should not hash password when password is not provided", async () => {
      // Arrange
      req.body = { name: "Jane Smith" };
      const mockUpdatedUser = { ...mockUser, name: "Jane Smith" };
      delete mockUpdatedUser.password;
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert - Communication-based: verify hashPassword was NOT called
      expect(hashPassword).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should exclude password from response using select", async () => {
      // Arrange
      req.body = { name: "Jane Smith" };
      const mockUpdatedUser = {
        _id: "validUserId123",
        name: "Jane Smith",
        phone: "1234567890",
        address: "123 Main St",
        // password should NOT be here
      };
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert - Verify select was called to exclude password
      expect(mockChain.select).toHaveBeenCalledWith("-password");
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: mockUpdatedUser,
      });
      // Verify password is not in response
      expect(mockUpdatedUser.password).toBeUndefined();
    });
  });

  // ===== PASSWORD HASHING TESTS =====
  // Testing Style: Communication-based (verify interaction with hashPassword)

  describe("Password hashing behavior", () => {
    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
    });

    it("should hash password before updating", async () => {
      // Arrange
      req.body = { password: "newPassword123" };
      hashPassword.mockResolvedValue("hashedNewPassword");
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert - Verify hashPassword was called with correct argument
      expect(hashPassword).toHaveBeenCalledWith("newPassword123");
      expect(hashPassword).toHaveBeenCalledTimes(1);

      // Verify the hashed password was used in update
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          password: "hashedNewPassword",
        }),
        expect.any(Object),
      );
    });
  });

  // ===== ERROR HANDLING TESTS =====
  // Testing Style: State-based

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");
      userModel.findById.mockRejectedValue(dbError);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while updating profile",
        error: dbError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle hashPassword failure", async () => {
      // Arrange
      req.body = { password: "newPassword123" };
      userModel.findById.mockResolvedValue(mockUser);
      const hashError = new Error("Hashing failed");
      hashPassword.mockRejectedValue(hashError);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(hashError);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while updating profile",
        error: hashError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle findByIdAndUpdate failure", async () => {
      // Arrange
      req.body = { name: "Jane Smith" };
      userModel.findById.mockResolvedValue(mockUser);
      const updateError = new Error("Update failed");
      userModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockRejectedValue(updateError),
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(updateError);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while updating profile",
        error: updateError,
      });

      consoleSpy.mockRestore();
    });
  });

  // ===== EDGE CASES & BOUNDARY TESTS =====
  // Testing Style: Output-based

  describe("Edge cases and boundary conditions", () => {
    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
    });

    it("should handle undefined values in body (keep existing)", async () => {
      // Arrange
      req.body = {
        name: undefined,
        phone: undefined,
        address: undefined,
      };
      const mockUpdatedUser = { ...mockUser };
      delete mockUpdatedUser.password;
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert - Should use existing values
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "validUserId123",
        {
          name: mockUser.name,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
        },
        { new: true },
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle password with exactly 5 characters (boundary)", async () => {
      // Arrange
      req.body = { password: "12345" };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: "Password is required and 6 character long",
      });
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it("should handle very long password", async () => {
      // Arrange
      const longPassword = "a".repeat(1000);
      req.body = { password: longPassword };
      hashPassword.mockResolvedValue("hashedLongPassword");
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith(longPassword);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle special characters in name", async () => {
      // Arrange
      req.body = { name: "O'Brien-Smith Jr." };
      const mockUpdatedUser = { ...mockUser, name: "O'Brien-Smith Jr." };
      delete mockUpdatedUser.password;
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({
            name: "O'Brien-Smith Jr.",
          }),
        }),
      );
    });

    it("should handle null values in body (keep existing)", async () => {
      // Arrange
      req.body = {
        name: null,
        phone: null,
        address: null,
      };
      const mockUpdatedUser = { ...mockUser };
      delete mockUpdatedUser.password;
      const mockChain = {
        select: jest.fn().mockResolvedValue(mockUpdatedUser),
      };
      userModel.findByIdAndUpdate.mockReturnValue(mockChain);

      // Act
      await updateProfileController(req, res);

      // Assert - Should use existing values (null is falsy)
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "validUserId123",
        {
          name: mockUser.name,
          password: mockUser.password,
          phone: mockUser.phone,
          address: mockUser.address,
        },
        { new: true },
      );
    });
  });
});

// ===== TEST SUITE FOR getOrdersController =====
describe("getOrdersController", () => {
  let req;
  let res;
  let mockOrders;
  let mockQueryChain;

  beforeEach(() => {
    // Arrange - Setup common test data
    req = {
      user: { _id: "user123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Mock orders data
    mockOrders = [
      {
        _id: "order1",
        buyer: { _id: "user123", name: "John Doe" },
        products: [
          { _id: "prod1", name: "Product 1", price: 100 },
          { _id: "prod2", name: "Product 2", price: 200 },
        ],
        status: "Processing",
        createdAt: new Date("2026-02-20"),
      },
      {
        _id: "order2",
        buyer: { _id: "user123", name: "John Doe" },
        products: [{ _id: "prod3", name: "Product 3", price: 150 }],
        status: "Shipped",
        createdAt: new Date("2026-02-19"),
      },
    ];

    // Setup query chain mock
    mockQueryChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockOrders),
    };

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ===== AUTHENTICATION & AUTHORIZATION TESTS =====
  // Testing Style: State-based (verify response state)

  describe("Authentication validation", () => {
    it("should return 401 when req.user is missing", async () => {
      // Arrange
      req.user = undefined;

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
      expect(orderModel.find).not.toHaveBeenCalled();
    });

    it("should return 401 when req.user is null", async () => {
      // Arrange
      req.user = null;

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
    });

    it("should return 401 when req.user._id is missing", async () => {
      // Arrange
      req.user = {};

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
    });

    it("should return 401 when req.user._id is null", async () => {
      // Arrange
      req.user = { _id: null };

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
    });

    it("should return 401 when req.user._id is undefined", async () => {
      // Arrange
      req.user = { _id: undefined };

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found in request",
      });
    });
  });

  // ===== SUCCESSFUL RETRIEVAL TESTS =====
  // Testing Style: State-based + Communication-based

  describe("Successful order retrieval", () => {
    it("should return all orders for authenticated user", async () => {
      // Arrange
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert - Communication-based: verify correct database calls
      expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
      expect(mockQueryChain.populate).toHaveBeenCalledWith(
        "products",
        "-photo",
      );
      expect(mockQueryChain.populate).toHaveBeenCalledWith("buyer", "name");
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });

      // Assert - State-based: verify response format
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: mockOrders,
      });
    });

    it("should return empty array when user has no orders", async () => {
      // Arrange
      const emptyOrders = [];
      mockQueryChain.sort.mockResolvedValue(emptyOrders);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: [],
      });
    });

    it("should return exactly one order when user has one order", async () => {
      // Arrange
      const singleOrder = [mockOrders[0]];
      mockQueryChain.sort.mockResolvedValue(singleOrder);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: singleOrder,
      });
      expect(singleOrder).toHaveLength(1);
    });

    it("should return multiple orders when user has multiple orders", async () => {
      // Arrange
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: mockOrders,
      });
      expect(mockOrders).toHaveLength(2);
    });
  });

  // ===== QUERY CHAINING TESTS =====
  // Testing Style: Communication-based (verify method calls)

  describe("Database query construction", () => {
    beforeEach(() => {
      orderModel.find.mockReturnValue(mockQueryChain);
    });

    it("should filter orders by buyer._id", async () => {
      // Arrange
      const userId = "user123";
      req.user._id = userId;

      // Act
      await getOrdersController(req, res);

      // Assert - Verify find called with correct filter
      expect(orderModel.find).toHaveBeenCalledWith({ buyer: userId });
      expect(orderModel.find).toHaveBeenCalledTimes(1);
    });

    it("should populate products excluding photo field", async () => {
      // Act
      await getOrdersController(req, res);

      // Assert - Verify populate called with correct parameters
      expect(mockQueryChain.populate).toHaveBeenCalledWith(
        "products",
        "-photo",
      );
    });

    it("should populate buyer with only name field", async () => {
      // Act
      await getOrdersController(req, res);

      // Assert - Verify populate called with correct parameters
      expect(mockQueryChain.populate).toHaveBeenCalledWith("buyer", "name");
    });

    it("should sort orders by createdAt in descending order", async () => {
      // Act
      await getOrdersController(req, res);

      // Assert - Verify sort called with correct parameter
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQueryChain.sort).toHaveBeenCalledTimes(1);
    });

    it("should call populate twice (for products and buyer)", async () => {
      // Act
      await getOrdersController(req, res);

      // Assert - Verify populate called exactly twice
      expect(mockQueryChain.populate).toHaveBeenCalledTimes(2);
    });

    it("should chain methods in correct order", async () => {
      // Arrange
      const callOrder = [];
      orderModel.find.mockImplementation(() => {
        callOrder.push("find");
        return mockQueryChain;
      });
      mockQueryChain.populate.mockImplementation(function () {
        callOrder.push("populate");
        return this;
      });
      mockQueryChain.sort.mockImplementation(() => {
        callOrder.push("sort");
        return Promise.resolve(mockOrders);
      });

      // Act
      await getOrdersController(req, res);

      // Assert - Verify call order
      expect(callOrder).toEqual(["find", "populate", "populate", "sort"]);
    });
  });

  // ===== DATA FILTERING TESTS =====
  // Testing Style: Output-based

  describe("User isolation and data filtering", () => {
    it("should only return orders for the authenticated user", async () => {
      // Arrange
      const user1Id = "user123";
      const user2Id = "user456";
      req.user._id = user1Id;

      const user1Orders = [
        { _id: "order1", buyer: { _id: user1Id } },
        { _id: "order2", buyer: { _id: user1Id } },
      ];

      mockQueryChain.sort.mockResolvedValue(user1Orders);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert - Verify only user1's orders are queried
      expect(orderModel.find).toHaveBeenCalledWith({ buyer: user1Id });
      expect(orderModel.find).not.toHaveBeenCalledWith({ buyer: user2Id });

      const returnedOrders = res.send.mock.calls[0][0].orders;
      returnedOrders.forEach((order) => {
        expect(order.buyer._id).toBe(user1Id);
      });
    });

    it("should handle different user IDs correctly", async () => {
      // Arrange
      const differentUserId = "differentUser789";
      req.user._id = differentUserId;
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(orderModel.find).toHaveBeenCalledWith({ buyer: differentUserId });
    });
  });

  // ===== EDGE CASES WITH POPULATED DATA =====
  // Testing Style: State-based

  describe("Populated data edge cases", () => {
    it("should handle orders with deleted products (null references)", async () => {
      // Arrange
      const ordersWithDeletedProducts = [
        {
          _id: "order1",
          buyer: { _id: "user123", name: "John Doe" },
          products: [null, { _id: "prod2", name: "Product 2" }, null],
          status: "Processing",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithDeletedProducts);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert - Should still return the orders
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: ordersWithDeletedProducts,
      });
    });

    it("should handle orders with empty products array", async () => {
      // Arrange
      const ordersWithNoProducts = [
        {
          _id: "order1",
          buyer: { _id: "user123", name: "John Doe" },
          products: [],
          status: "Cancelled",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithNoProducts);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: ordersWithNoProducts,
      });
    });

    it("should handle orders with deleted buyer (null reference)", async () => {
      // Arrange
      const ordersWithDeletedBuyer = [
        {
          _id: "order1",
          buyer: null,
          products: [{ _id: "prod1", name: "Product 1" }],
          status: "Processing",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithDeletedBuyer);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert - Should still return the orders
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: ordersWithDeletedBuyer,
      });
    });

    it("should verify photo field is excluded from products", async () => {
      // Arrange
      const ordersWithProductsNoPhoto = [
        {
          _id: "order1",
          buyer: { _id: "user123", name: "John Doe" },
          products: [
            {
              _id: "prod1",
              name: "Product 1",
              price: 100,
              // photo field should not be present
            },
          ],
          status: "Processing",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithProductsNoPhoto);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert - Verify populate was called to exclude photo
      expect(mockQueryChain.populate).toHaveBeenCalledWith(
        "products",
        "-photo",
      );

      const returnedOrders = res.send.mock.calls[0][0].orders;
      returnedOrders.forEach((order) => {
        order.products.forEach((product) => {
          expect(product).not.toHaveProperty("photo");
        });
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====
  // Testing Style: State-based

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");
      orderModel.find.mockImplementation(() => {
        throw dbError;
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: dbError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle errors during populate operation", async () => {
      // Arrange
      const populateError = new Error("Populate failed");
      mockQueryChain.populate.mockImplementation(function () {
        throw populateError;
      });
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(populateError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: populateError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle errors during sort operation", async () => {
      // Arrange
      const sortError = new Error("Sort operation failed");
      mockQueryChain.sort.mockRejectedValue(sortError);
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(sortError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: sortError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle database timeout errors", async () => {
      // Arrange
      const timeoutError = new Error("Query timeout");
      mockQueryChain.sort.mockRejectedValue(timeoutError);
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(timeoutError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: timeoutError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle generic errors gracefully", async () => {
      // Arrange
      const genericError = new Error("Something went wrong");
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(genericError),
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: genericError,
      });

      consoleSpy.mockRestore();
    });
  });

  // ===== RESPONSE FORMAT TESTS =====
  // Testing Style: State-based

  describe("Response format consistency", () => {
    beforeEach(() => {
      orderModel.find.mockReturnValue(mockQueryChain);
    });

    it("should return consistent success response structure", async () => {
      // Act
      await getOrdersController(req, res);

      // Assert
      const response = res.send.mock.calls[0][0];
      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("orders");
      expect(response.success).toBe(true);
      expect(Array.isArray(response.orders)).toBe(true);
    });

    it("should use 200 status code for successful retrieval", async () => {
      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status).toHaveBeenCalledTimes(1);
    });

    it("should use 500 status code for errors", async () => {
      // Arrange
      const error = new Error("Test error");
      orderModel.find.mockImplementation(() => {
        throw error;
      });
      jest.spyOn(console, "log").mockImplementation();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      console.log.mockRestore();
    });

    it("should include error details in error response", async () => {
      // Arrange
      const error = new Error("Specific error message");
      mockQueryChain.sort.mockRejectedValue(error);
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getOrdersController(req, res);

      // Assert
      const response = res.send.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("error");
      expect(response.error).toBe(error);

      consoleSpy.mockRestore();
    });
  });

  // ===== SORTING BEHAVIOR TESTS =====
  // Testing Style: Communication-based + Output-based

  describe("Sorting behavior", () => {
    it("should sort orders by createdAt in descending order (newest first)", async () => {
      // Arrange
      const ordersNewestFirst = [
        {
          _id: "order1",
          createdAt: new Date("2026-02-22"),
          status: "Processing",
        },
        {
          _id: "order2",
          createdAt: new Date("2026-02-21"),
          status: "Shipped",
        },
        {
          _id: "order3",
          createdAt: new Date("2026-02-20"),
          status: "Delivered",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersNewestFirst);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert - Verify sort parameter
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });

      // Assert - Verify orders are in correct order
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders[0].createdAt >= returnedOrders[1].createdAt).toBe(
        true,
      );
      expect(returnedOrders[1].createdAt >= returnedOrders[2].createdAt).toBe(
        true,
      );
    });
  });

  // ===== EDGE CASES & BOUNDARY CONDITIONS =====
  // Testing Style: Output-based

  describe("Edge cases and boundary conditions", () => {
    it("should handle very long user ID", async () => {
      // Arrange
      req.user._id = "a".repeat(1000);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(orderModel.find).toHaveBeenCalledWith({ buyer: req.user._id });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle special characters in user ID", async () => {
      // Arrange
      req.user._id = "user@#$%^&*()123";
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(orderModel.find).toHaveBeenCalledWith({ buyer: req.user._id });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle empty string user ID (treated as falsy)", async () => {
      // Arrange
      req.user._id = "";

      // Act
      await getOrdersController(req, res);

      // Assert - Should be caught by authentication check
      expect(res.status).toHaveBeenCalledWith(401);
      expect(orderModel.find).not.toHaveBeenCalled();
    });

    it("should handle orders with all possible status values", async () => {
      // Arrange
      const ordersWithAllStatuses = [
        { _id: "o1", status: "Not Process" },
        { _id: "o2", status: "Processing" },
        { _id: "o3", status: "Shipped" },
        { _id: "o4", status: "Delivered" },
        { _id: "o5", status: "Cancelled" },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithAllStatuses);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(5);
    });

    it("should handle large number of orders", async () => {
      // Arrange
      const manyOrders = Array.from({ length: 1000 }, (_, i) => ({
        _id: `order${i}`,
        buyer: { _id: "user123" },
        products: [],
        status: "Processing",
      }));
      mockQueryChain.sort.mockResolvedValue(manyOrders);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(1000);
    });
  });
});

// ===== TEST SUITE FOR getAllOrdersController (ADMIN) =====
describe("getAllOrdersController", () => {
  let req;
  let res;
  let mockAllOrders;
  let mockQueryChain;

  beforeEach(() => {
    // Arrange - Setup common test data
    req = {
      user: { _id: "admin123", role: 1 }, // Admin user
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Mock orders from multiple users
    mockAllOrders = [
      {
        _id: "order1",
        buyer: { _id: "user1", name: "User One" },
        products: [{ _id: "prod1", name: "Product 1", price: 100 }],
        status: "Processing",
        createdAt: new Date("2026-02-22"),
      },
      {
        _id: "order2",
        buyer: { _id: "user2", name: "User Two" },
        products: [{ _id: "prod2", name: "Product 2", price: 200 }],
        status: "Shipped",
        createdAt: new Date("2026-02-21"),
      },
      {
        _id: "order3",
        buyer: { _id: "user3", name: "User Three" },
        products: [{ _id: "prod3", name: "Product 3", price: 150 }],
        status: "Delivered",
        createdAt: new Date("2026-02-20"),
      },
    ];

    // Setup query chain mock
    mockQueryChain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockAllOrders),
    };

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ===== SUCCESSFUL RETRIEVAL TESTS =====
  // Testing Style: State-based + Communication-based

  describe("Successful retrieval of all orders", () => {
    it("should return all orders from all users in the system", async () => {
      // Arrange
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Communication-based: verify correct database calls
      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(mockQueryChain.populate).toHaveBeenCalledWith(
        "products",
        "-photo",
      );
      expect(mockQueryChain.populate).toHaveBeenCalledWith("buyer", "name");
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });

      // Assert - State-based: verify response format
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: mockAllOrders,
      });
    });

    it("should return empty array when no orders exist in system", async () => {
      // Arrange
      const emptyOrders = [];
      mockQueryChain.sort.mockResolvedValue(emptyOrders);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: [],
      });
    });

    it("should return orders from multiple different users", async () => {
      // Arrange
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(3);

      // Verify orders are from different users
      const buyerIds = returnedOrders.map((order) => order.buyer._id);
      const uniqueBuyerIds = [...new Set(buyerIds)];
      expect(uniqueBuyerIds.length).toBe(3); // 3 different users
    });

    it("should return exactly one order when system has one order", async () => {
      // Arrange
      const singleOrder = [mockAllOrders[0]];
      mockQueryChain.sort.mockResolvedValue(singleOrder);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: singleOrder,
      });
      expect(singleOrder).toHaveLength(1);
    });
  });

  // ===== QUERY CONSTRUCTION TESTS =====
  // Testing Style: Communication-based (verify method calls)

  describe("Database query construction", () => {
    beforeEach(() => {
      orderModel.find.mockReturnValue(mockQueryChain);
    });

    it("should use empty filter to retrieve all orders", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify find called with empty object (no filter)
      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(orderModel.find).toHaveBeenCalledTimes(1);
    });

    it("should NOT filter by buyer (gets all orders)", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify no buyer filter
      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(orderModel.find).not.toHaveBeenCalledWith(
        expect.objectContaining({ buyer: expect.anything() }),
      );
    });

    it("should populate products excluding photo field", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify populate called with correct parameters
      expect(mockQueryChain.populate).toHaveBeenCalledWith(
        "products",
        "-photo",
      );
    });

    it("should populate buyer with only name field", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify populate called with correct parameters
      expect(mockQueryChain.populate).toHaveBeenCalledWith("buyer", "name");
    });

    it("should sort orders by createdAt in descending order", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify sort called with numeric -1, not string "-1"
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQueryChain.sort).toHaveBeenCalledTimes(1);
    });

    it("should call populate twice (for products and buyer)", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify populate called exactly twice
      expect(mockQueryChain.populate).toHaveBeenCalledTimes(2);
    });

    it("should chain methods in correct order", async () => {
      // Arrange
      const callOrder = [];
      orderModel.find.mockImplementation(() => {
        callOrder.push("find");
        return mockQueryChain;
      });
      mockQueryChain.populate.mockImplementation(function () {
        callOrder.push("populate");
        return this;
      });
      mockQueryChain.sort.mockImplementation(() => {
        callOrder.push("sort");
        return Promise.resolve(mockAllOrders);
      });

      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify call order
      expect(callOrder).toEqual(["find", "populate", "populate", "sort"]);
    });
  });

  // ===== NO USER FILTERING TESTS =====
  // Testing Style: Output-based

  describe("Admin access - no user filtering", () => {
    it("should return orders from all users, not just admin's orders", async () => {
      // Arrange
      const ordersFromDifferentUsers = [
        { _id: "o1", buyer: { _id: "user1", name: "User 1" } },
        { _id: "o2", buyer: { _id: "user2", name: "User 2" } },
        { _id: "o3", buyer: { _id: "admin123", name: "Admin" } },
        { _id: "o4", buyer: { _id: "user4", name: "User 4" } },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersFromDifferentUsers);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify all orders returned, including non-admin orders
      expect(orderModel.find).toHaveBeenCalledWith({}); // No buyer filter
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(4);

      // Verify we have orders from different buyers
      const buyerIds = returnedOrders.map((o) => o.buyer._id);
      expect(buyerIds).toContain("user1");
      expect(buyerIds).toContain("user2");
      expect(buyerIds).toContain("admin123");
      expect(buyerIds).toContain("user4");
    });

    it("should work regardless of req.user._id value", async () => {
      // Arrange
      req.user._id = "anyUserId789"; // Different user
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Still gets all orders, not filtered by this ID
      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ===== EDGE CASES WITH POPULATED DATA =====
  // Testing Style: State-based

  describe("Populated data edge cases", () => {
    it("should handle orders with deleted products (null references)", async () => {
      // Arrange
      const ordersWithDeletedProducts = [
        {
          _id: "order1",
          buyer: { _id: "user1", name: "User One" },
          products: [null, { _id: "prod2", name: "Product 2" }, null],
          status: "Processing",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithDeletedProducts);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Should still return the orders
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: ordersWithDeletedProducts,
      });
    });

    it("should handle orders with empty products array", async () => {
      // Arrange
      const ordersWithNoProducts = [
        {
          _id: "order1",
          buyer: { _id: "user1", name: "User One" },
          products: [],
          status: "Cancelled",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithNoProducts);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: ordersWithNoProducts,
      });
    });

    it("should handle orders with deleted buyer (null reference)", async () => {
      // Arrange
      const ordersWithDeletedBuyer = [
        {
          _id: "order1",
          buyer: null,
          products: [{ _id: "prod1", name: "Product 1" }],
          status: "Processing",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithDeletedBuyer);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Should still return the orders
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        orders: ordersWithDeletedBuyer,
      });
    });

    it("should verify photo field is excluded from products", async () => {
      // Arrange
      const ordersWithProductsNoPhoto = [
        {
          _id: "order1",
          buyer: { _id: "user1", name: "User One" },
          products: [
            {
              _id: "prod1",
              name: "Product 1",
              price: 100,
              // photo field should not be present
            },
          ],
          status: "Processing",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithProductsNoPhoto);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify populate was called to exclude photo
      expect(mockQueryChain.populate).toHaveBeenCalledWith(
        "products",
        "-photo",
      );

      const returnedOrders = res.send.mock.calls[0][0].orders;
      returnedOrders.forEach((order) => {
        order.products.forEach((product) => {
          expect(product).not.toHaveProperty("photo");
        });
      });
    });

    it("should handle orders with various statuses", async () => {
      // Arrange
      const ordersWithAllStatuses = [
        { _id: "o1", buyer: { _id: "u1" }, status: "Not Process" },
        { _id: "o2", buyer: { _id: "u2" }, status: "Processing" },
        { _id: "o3", buyer: { _id: "u3" }, status: "Shipped" },
        { _id: "o4", buyer: { _id: "u4" }, status: "Delivered" },
        { _id: "o5", buyer: { _id: "u5" }, status: "Cancelled" },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithAllStatuses);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(5);
    });
  });

  // ===== ERROR HANDLING TESTS =====
  // Testing Style: State-based

  describe("Error handling", () => {
    it("should handle database connection errors", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");
      orderModel.find.mockImplementation(() => {
        throw dbError;
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: dbError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle errors during populate operation", async () => {
      // Arrange
      const populateError = new Error("Populate failed");
      mockQueryChain.populate.mockImplementation(function () {
        throw populateError;
      });
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(populateError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: populateError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle errors during sort operation", async () => {
      // Arrange
      const sortError = new Error("Sort operation failed");
      mockQueryChain.sort.mockRejectedValue(sortError);
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(sortError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: sortError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle database timeout errors", async () => {
      // Arrange
      const timeoutError = new Error("Query timeout");
      mockQueryChain.sort.mockRejectedValue(timeoutError);
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(timeoutError);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: timeoutError,
      });

      consoleSpy.mockRestore();
    });

    it("should handle generic errors gracefully", async () => {
      // Arrange
      const genericError = new Error("Something went wrong");
      orderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(genericError),
      });
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Getting Orders",
        error: genericError,
      });

      consoleSpy.mockRestore();
    });
  });

  // ===== RESPONSE FORMAT TESTS =====
  // Testing Style: State-based

  describe("Response format consistency", () => {
    beforeEach(() => {
      orderModel.find.mockReturnValue(mockQueryChain);
    });

    it("should return consistent success response structure", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert
      const response = res.send.mock.calls[0][0];
      expect(response).toHaveProperty("success");
      expect(response).toHaveProperty("orders");
      expect(response.success).toBe(true);
      expect(Array.isArray(response.orders)).toBe(true);
    });

    it("should use 200 status code for successful retrieval", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status).toHaveBeenCalledTimes(1);
    });

    it("should use 500 status code for errors", async () => {
      // Arrange
      const error = new Error("Test error");
      orderModel.find.mockImplementation(() => {
        throw error;
      });
      jest.spyOn(console, "log").mockImplementation();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      console.log.mockRestore();
    });

    it("should include error details in error response", async () => {
      // Arrange
      const error = new Error("Specific error message");
      mockQueryChain.sort.mockRejectedValue(error);
      orderModel.find.mockReturnValue(mockQueryChain);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      const response = res.send.mock.calls[0][0];
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("error");
      expect(response.error).toBe(error);

      consoleSpy.mockRestore();
    });

    it("should have consistent response format with getOrdersController", async () => {
      // Act
      await getAllOrdersController(req, res);

      // Assert - Both should use same structure
      const response = res.send.mock.calls[0][0];
      expect(response).toEqual({
        success: true,
        orders: expect.any(Array),
      });
    });
  });

  // ===== SORTING BEHAVIOR TESTS =====
  // Testing Style: Communication-based + Output-based

  describe("Sorting behavior", () => {
    it("should sort orders by createdAt in descending order (newest first)", async () => {
      // Arrange
      const ordersNewestFirst = [
        {
          _id: "order1",
          createdAt: new Date("2026-02-22"),
          status: "Processing",
        },
        {
          _id: "order2",
          createdAt: new Date("2026-02-21"),
          status: "Shipped",
        },
        {
          _id: "order3",
          createdAt: new Date("2026-02-20"),
          status: "Delivered",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersNewestFirst);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify sort parameter is numeric -1
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });

      // Assert - Verify orders are in correct order
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders[0].createdAt >= returnedOrders[1].createdAt).toBe(
        true,
      );
      expect(returnedOrders[1].createdAt >= returnedOrders[2].createdAt).toBe(
        true,
      );
    });

    it("should use numeric -1, not string '-1' for sort", async () => {
      // Arrange
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Verify sort called with number, not string
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQueryChain.sort).not.toHaveBeenCalledWith({
        createdAt: "-1",
      });
    });
  });

  // ===== EDGE CASES & BOUNDARY CONDITIONS =====
  // Testing Style: Output-based

  describe("Edge cases and boundary conditions", () => {
    it("should handle very large number of orders", async () => {
      // Arrange
      const manyOrders = Array.from({ length: 5000 }, (_, i) => ({
        _id: `order${i}`,
        buyer: { _id: `user${i % 100}` }, // 100 different users
        products: [],
        status: "Processing",
      }));
      mockQueryChain.sort.mockResolvedValue(manyOrders);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(5000);
    });

    it("should handle orders with partial/missing fields", async () => {
      // Arrange
      const ordersWithMissingFields = [
        {
          _id: "order1",
          buyer: { _id: "user1", name: "User One" },
          // products missing
          status: "Processing",
        },
        {
          _id: "order2",
          // buyer missing
          products: [],
          status: "Shipped",
        },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithMissingFields);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - Should still return orders
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(2);
    });

    it("should handle orders with same createdAt timestamp", async () => {
      // Arrange
      const sameTimestamp = new Date("2026-02-22T10:00:00Z");
      const ordersWithSameTime = [
        { _id: "o1", createdAt: sameTimestamp },
        { _id: "o2", createdAt: sameTimestamp },
        { _id: "o3", createdAt: sameTimestamp },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithSameTime);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(3);
    });

    it("should handle mix of orders with different payment types", async () => {
      // Arrange
      const ordersWithDifferentPayments = [
        { _id: "o1", payment: { method: "card" }, buyer: { _id: "u1" } },
        { _id: "o2", payment: { method: "cash" }, buyer: { _id: "u2" } },
        { _id: "o3", payment: {}, buyer: { _id: "u3" } },
        { _id: "o4", payment: null, buyer: { _id: "u4" } },
      ];
      mockQueryChain.sort.mockResolvedValue(ordersWithDifferentPayments);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedOrders = res.send.mock.calls[0][0].orders;
      expect(returnedOrders).toHaveLength(4);
    });
  });

  // ===== PERFORMANCE & SCALABILITY =====
  // Testing Style: Output-based

  describe("Performance considerations", () => {
    it("should handle system with no orders efficiently", async () => {
      // Arrange
      mockQueryChain.sort.mockResolvedValue([]);
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      const startTime = Date.now();
      await getAllOrdersController(req, res);
      const endTime = Date.now();

      // Assert - Should complete quickly even with empty result
      expect(endTime - startTime).toBeLessThan(100); // Mock should be fast
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call database methods only once per operation", async () => {
      // Arrange
      orderModel.find.mockReturnValue(mockQueryChain);

      // Act
      await getAllOrdersController(req, res);

      // Assert - No redundant calls
      expect(orderModel.find).toHaveBeenCalledTimes(1);
      expect(mockQueryChain.populate).toHaveBeenCalledTimes(2);
      expect(mockQueryChain.sort).toHaveBeenCalledTimes(1);
    });
  });
});

// ===================================
// orderStatusController Test Suite
// ===================================
describe("orderStatusController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  // Helper function to create mock query chain
  const createMockQueryChain = (resolvedValue) => {
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(resolvedValue).then(resolve)),
    };
    return mockQuery;
  };

  // ===== INPUT VALIDATION TESTS (Communication-based) =====
  // These verify error responses when inputs are invalid
  describe("Input Validation - Order ID", () => {
    it("should return 400 when orderId is missing", async () => {
      // Arrange
      req.params = {};
      req.body = { status: "Processing" };

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order ID is required",
        error: "Order ID is required",
      });
    });

    it("should return 400 when orderId is undefined", async () => {
      // Arrange
      req.params = { orderId: undefined };
      req.body = { status: "Processing" };

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order ID is required",
        error: "Order ID is required",
      });
    });

    it("should return 400 when orderId is null", async () => {
      // Arrange
      req.params = { orderId: null };
      req.body = { status: "Processing" };

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order ID is required",
        error: "Order ID is required",
      });
    });

    it("should accept valid orderId and proceed to next validation", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = {}; // Missing status - will fail at status validation

      // Act
      await orderStatusController(req, res);

      // Assert - Should not fail at orderId validation
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Status is required", // Fails at next validation
        }),
      );
    });
  });

  describe("Input Validation - Status", () => {
    beforeEach(() => {
      req.params = { orderId: "507f1f77bcf86cd799439011" };
    });

    it("should return 400 when status is missing", async () => {
      // Arrange
      req.body = {};

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Status is required",
        error: "Status is required",
      });
    });

    it("should return 400 when status is undefined", async () => {
      // Arrange
      req.body = { status: undefined };

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Status is required",
        error: "Status is required",
      });
    });

    it("should return 400 when status is null", async () => {
      // Arrange
      req.body = { status: null };

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Status is required",
        error: "Status is required",
      });
    });
  });

  describe("Input Validation - Status Enum", () => {
    beforeEach(() => {
      req.params = { orderId: "507f1f77bcf86cd799439011" };
    });

    it("should return 400 for invalid status value", async () => {
      // Arrange
      req.body = { status: "InvalidStatus" };

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid status value",
        error:
          "Status must be one of: Not Process, Processing, Shipped, Delivered, Cancelled",
      });
    });

    it("should accept 'Not Process' as valid status", async () => {
      // Arrange
      req.body = { status: "Not Process" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Not Process",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Should not return validation error
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should accept 'Processing' as valid status", async () => {
      // Arrange
      req.body = { status: "Processing" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Processing",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should accept 'Shipped' as valid status", async () => {
      // Arrange
      req.body = { status: "Shipped" };
      const mockOrder = { _id: "507f1f77bcf86cd799439011", status: "Shipped" };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should accept 'Delivered' as valid status", async () => {
      // Arrange
      req.body = { status: "Delivered" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Delivered",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should accept 'Cancelled' as valid status", async () => {
      // Arrange
      req.body = { status: "Cancelled" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Cancelled",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject lowercase status values (case-sensitive)", async () => {
      // Arrange
      req.body = { status: "delivered" }; // lowercase

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid status value",
        }),
      );
    });

    it("should reject uppercase status values (case-sensitive)", async () => {
      // Arrange
      req.body = { status: "CANCELLED" }; // uppercase

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid status value",
        }),
      );
    });

    it("should reject old typo 'deliverd' (with typo)", async () => {
      // Arrange
      req.body = { status: "deliverd" }; // Old typo version

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid status value",
        }),
      );
    });

    it("should reject old typo 'cancel' (without 'led')", async () => {
      // Arrange
      req.body = { status: "cancel" }; // Old typo version

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid status value",
        }),
      );
    });
  });

  // ===== SUCCESSFUL UPDATE TESTS (Output-based + Communication-based) =====
  describe("Successful Status Updates", () => {
    beforeEach(() => {
      req.params = { orderId: "507f1f77bcf86cd799439011" };
    });

    it("should successfully update order status to Processing", async () => {
      // Arrange
      req.body = { status: "Processing" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Processing",
        buyer: { _id: "user123", name: "John Doe" },
        products: [{ _id: "prod1", name: "Product 1" }],
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Output-based: verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        order: mockOrder,
      });
    });

    it("should call findByIdAndUpdate with correct parameters", async () => {
      // Arrange
      req.body = { status: "Shipped" };
      const mockOrder = { _id: "507f1f77bcf86cd799439011", status: "Shipped" };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Communication-based: verify method call
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { status: "Shipped" },
        { new: true },
      );
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("should populate products field correctly", async () => {
      // Arrange
      req.body = { status: "Delivered" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Delivered",
        products: [
          { _id: "prod1", name: "Product 1", price: 100 },
          { _id: "prod2", name: "Product 2", price: 200 },
        ],
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Communication-based: verify populate was called correctly
      expect(mockQueryChain.populate).toHaveBeenCalledWith(
        "products",
        "-photo",
      );
      expect(mockQueryChain.populate).toHaveBeenCalledWith("buyer", "name");
      expect(mockQueryChain.populate).toHaveBeenCalledTimes(2);
    });

    it("should update status to Cancelled successfully", async () => {
      // Arrange
      req.body = { status: "Cancelled" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Cancelled",
        buyer: { _id: "user123", name: "Jane Smith" },
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        order: expect.objectContaining({
          status: "Cancelled",
        }),
      });
    });

    it("should return order with populated buyer name", async () => {
      // Arrange
      req.body = { status: "Delivered" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Delivered",
        buyer: { _id: "user123", name: "Alice Johnson" },
        products: [],
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - State-based: verify returned order structure
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        order: expect.objectContaining({
          buyer: expect.objectContaining({
            name: "Alice Johnson",
          }),
        }),
      });
    });

    it("should handle updating to same status (idempotent)", async () => {
      // Arrange
      req.body = { status: "Processing" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Processing", // Already in this status
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Should still succeed
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        order: mockOrder,
      });
    });
  });

  // ===== ORDER NOT FOUND TESTS (Communication-based) =====
  describe("Order Not Found Handling", () => {
    beforeEach(() => {
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Processing" };
    });

    it("should return 404 when order does not exist", async () => {
      // Arrange
      const mockQueryChain = createMockQueryChain(null);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Order not found",
        error: "Order not found",
      });
    });

    it("should verify findByIdAndUpdate was called before returning 404", async () => {
      // Arrange
      const mockQueryChain = createMockQueryChain(null);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Communication-based: verify DB was queried
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    });

    it("should return 404 for non-existent orderId with valid format", async () => {
      // Arrange
      req.params = { orderId: "000000000000000000000000" };
      const mockQueryChain = createMockQueryChain(null);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== ERROR HANDLING TESTS (Communication-based) =====
  describe("Error Handling", () => {
    beforeEach(() => {
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Processing" };
    });

    it("should handle database connection errors", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");
      const mockQueryChain = createMockQueryChain(null);
      mockQueryChain.then = jest.fn((resolve, reject) =>
        Promise.reject(dbError).then(resolve, reject),
      );
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Updating Order",
        error: dbError,
      });
    });

    it("should handle network timeout errors", async () => {
      // Arrange
      const timeoutError = new Error("Network timeout");
      timeoutError.code = "ETIMEDOUT";
      const mockQueryChain = createMockQueryChain(null);
      mockQueryChain.then = jest.fn((resolve, reject) =>
        Promise.reject(timeoutError).then(resolve, reject),
      );
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Updating Order",
        }),
      );
    });

    it("should handle MongoDB validation errors", async () => {
      // Arrange
      const validationError = new Error("Validation failed");
      validationError.name = "ValidationError";
      const mockQueryChain = createMockQueryChain(null);
      mockQueryChain.then = jest.fn((resolve, reject) =>
        Promise.reject(validationError).then(resolve, reject),
      );
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should log error to console", async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      const testError = new Error("Test error");
      const mockQueryChain = createMockQueryChain(null);
      mockQueryChain.then = jest.fn((resolve, reject) =>
        Promise.reject(testError).then(resolve, reject),
      );
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Communication-based: verify logging
      expect(consoleLogSpy).toHaveBeenCalledWith(testError);
      consoleLogSpy.mockRestore();
    });
  });

  // ===== EDGE CASES TESTS (Mixed styles) =====
  describe("Edge Cases", () => {
    it("should handle order with minimal data", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Processing" };
      const minimalOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Processing",
      };
      const mockQueryChain = createMockQueryChain(minimalOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        order: minimalOrder,
      });
    });

    it("should handle extra fields in request body", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = {
        status: "Shipped",
        extraField: "should be ignored",
        hackAttempt: "malicious data",
      };
      const mockOrder = { _id: "507f1f77bcf86cd799439011", status: "Shipped" };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Only status should be passed to update
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { status: "Shipped" }, // Only status field
        { new: true },
      );
    });

    it("should not mutate request object", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Delivered" };
      const originalParams = { ...req.params };
      const originalBody = { ...req.body };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Delivered",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Request should remain unchanged
      expect(req.params).toEqual(originalParams);
      expect(req.body).toEqual(originalBody);
    });

    it("should handle very long orderId", async () => {
      // Arrange
      const longOrderId = "a".repeat(500);
      req.params = { orderId: longOrderId };
      req.body = { status: "Processing" };
      const mockQueryChain = createMockQueryChain(null);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Should handle gracefully
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        longOrderId,
        { status: "Processing" },
        { new: true },
      );
    });

    it("should handle special characters in orderId", async () => {
      // Arrange
      req.params = { orderId: "507f-1f77_bcf8@6cd7" };
      req.body = { status: "Cancelled" };
      const mockQueryChain = createMockQueryChain(null);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Should pass through to DB layer
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f-1f77_bcf8@6cd7",
        { status: "Cancelled" },
        { new: true },
      );
    });
  });

  // ===== RESPONSE FORMAT CONSISTENCY TESTS (Output-based) =====
  describe("Response Format Consistency", () => {
    it("should always include success field in responses", async () => {
      // Arrange - Test error case
      req.params = {};
      req.body = { status: "Processing" };

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
        }),
      );
    });

    it("should include error and message fields in error responses", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = {};

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          error: expect.any(String),
        }),
      );
    });

    it("should include order field in success responses", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Delivered" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Delivered",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          order: expect.any(Object),
        }),
      );
    });

    it("should use appropriate HTTP status codes", async () => {
      // Arrange - Success case
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Processing" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Processing",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200); // Success = 200
    });
  });

  // ===== PERFORMANCE TESTS (Fast Feedback Pillar) =====
  describe("Performance Considerations", () => {
    it("should fail fast on validation errors without DB calls", async () => {
      // Arrange
      req.params = {};
      req.body = { status: "Processing" };
      orderModel.findByIdAndUpdate = jest.fn();

      // Act
      await orderStatusController(req, res);

      // Assert - No DB call should be made
      expect(orderModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should make minimal database calls", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Shipped" };
      const mockOrder = { _id: "507f1f77bcf86cd799439011", status: "Shipped" };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      await orderStatusController(req, res);

      // Assert - Only one findByIdAndUpdate call
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      // And two populate calls (chained)
      expect(mockQueryChain.populate).toHaveBeenCalledTimes(2);
    });

    it("should complete quickly with mocked dependencies", async () => {
      // Arrange
      req.params = { orderId: "507f1f77bcf86cd799439011" };
      req.body = { status: "Cancelled" };
      const mockOrder = {
        _id: "507f1f77bcf86cd799439011",
        status: "Cancelled",
      };
      const mockQueryChain = createMockQueryChain(mockOrder);
      orderModel.findByIdAndUpdate = jest.fn().mockReturnValue(mockQueryChain);

      // Act
      const startTime = Date.now();
      await orderStatusController(req, res);
      const endTime = Date.now();

      // Assert - Should complete in under 100ms with mocks
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
