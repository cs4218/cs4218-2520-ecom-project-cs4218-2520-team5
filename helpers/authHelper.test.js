import { hashPassword, comparePassword } from "./authHelper.js";
import bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("Auth Helper", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── hashPassword ────────────────────────────────────────────────

  describe("hashPassword", () => {
    it("should return a hashed password using 10 salt rounds", async () => {
      bcrypt.hash.mockResolvedValue("hashed_result");

      const result = await hashPassword("mypassword");

      expect(bcrypt.hash).toHaveBeenCalledWith("mypassword", 10);
      expect(result).toBe("hashed_result");
    });

    it("should return undefined when bcrypt throws an error", async () => {
      bcrypt.hash.mockRejectedValue(new Error("hash failure"));

      const result = await hashPassword("mypassword");

      expect(result).toBeUndefined();
    });
  });

  // ─── comparePassword ─────────────────────────────────────────────

  describe("comparePassword", () => {
    it("should return true when passwords match", async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword("plain", "hashed");

      expect(bcrypt.compare).toHaveBeenCalledWith("plain", "hashed");
      expect(result).toBe(true);
    });

    it("should return false when passwords do not match", async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword("wrong", "hashed");

      expect(result).toBe(false);
    });
  });
});
