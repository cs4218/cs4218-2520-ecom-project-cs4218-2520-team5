// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// Mock colors library by adding methods to String prototype
String.prototype.bgMagenta = { white: "" };
String.prototype.bgRed = { white: "" };

// Mock dependencies before import
jest.unstable_mockModule("mongoose", () => ({
  default: {
    connect: jest.fn(),
  },
}));

// Import after mocking
const mongoose = (await import("mongoose")).default;
const connectDB = (await import("./db.js")).default;

describe("Database Connection Unit Tests", () => {
  let consoleLogSpy;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Spy on console.log
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  // ===== CONNECTION SUCCESS TESTS =====
  // Testing Style: Communication-based (verify interactions)

  it("should call mongoose.connect with MONGO_URL from environment", async () => {
    // Arrange
    process.env.MONGO_URL = "mongodb://localhost:27017/testdb";
    const mockConnection = {
      connection: { host: "localhost" },
    };
    mongoose.connect.mockResolvedValue(mockConnection);

    // Act
    await connectDB();

    // Assert - verify mongoose.connect was called with correct URL
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/testdb",
    );
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it("should log success message when connection succeeds", async () => {
    // Arrange
    process.env.MONGO_URL = "mongodb://localhost:27017/testdb";
    const mockConnection = {
      connection: { host: "localhost" },
    };
    mongoose.connect.mockResolvedValue(mockConnection);

    // Act
    await connectDB();

    // Assert - verify success message is logged
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Connected To Mongodb Database"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("localhost"),
    );
  });

  // ===== CONNECTION FAILURE TESTS =====
  // Testing Style: Communication-based (verify error handling)

  it("should log error message when connection fails", async () => {
    // Arrange
    process.env.MONGO_URL = "mongodb://invalid:27017/testdb";
    const connectionError = new Error("Connection failed");
    mongoose.connect.mockRejectedValue(connectionError);

    // Act
    await connectDB();

    // Assert - verify error message is logged
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in Mongodb"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Connection failed"),
    );
  });

  it("should handle connection without throwing when error occurs", async () => {
    // Arrange
    process.env.MONGO_URL = "mongodb://invalid:27017/testdb";
    mongoose.connect.mockRejectedValue(new Error("Network error"));

    // Act & Assert - should not throw, just log error
    await expect(connectDB()).resolves.toBeUndefined();
  });
});
