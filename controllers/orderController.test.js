//Alyssa Ong, A0264663X (added test cases for the controllers for order)
// The test cases are generated with the help from AI.

import { updateProfileController } from "../controllers/orderController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

// Mock dependencies for isolation
jest.mock("../models/userModel.js");
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
