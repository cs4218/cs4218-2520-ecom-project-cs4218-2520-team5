// Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const mockHash = jest.fn();
const mockCompare = jest.fn();

jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
  },
}));

const { hashPassword, comparePassword } = await import("./authHelper.js");

describe("Auth Helper", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("hashPassword", () => {
    it("should return a hashed password using 10 salt rounds", async () => {
      mockHash.mockResolvedValue("hashed_result");

      const result = await hashPassword("mypassword");

      expect(mockHash).toHaveBeenCalledWith("mypassword", 10);
      expect(result).toBe("hashed_result");
    });

    it("should return undefined when bcrypt throws an error", async () => {
      mockHash.mockRejectedValue(new Error("hash failure"));

      const result = await hashPassword("mypassword");

      expect(result).toBeUndefined();
    });
  });

  describe("comparePassword", () => {
    it("should return true when passwords match", async () => {
      mockCompare.mockResolvedValue(true);

      const result = await comparePassword("plain", "hashed");

      expect(mockCompare).toHaveBeenCalledWith("plain", "hashed");
      expect(result).toBe(true);
    });

    it("should return false when passwords do not match", async () => {
      mockCompare.mockResolvedValue(false);

      const result = await comparePassword("wrong", "hashed");

      expect(result).toBe(false);
    });
  });
});
