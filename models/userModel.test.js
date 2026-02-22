// Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
import { describe, it, expect } from "@jest/globals";

const { default: userModel } = await import("./userModel.js");

describe("User Model", () => {
  it("should have a name field of type String that is required and trimmed", () => {
    // Arrange
    const nameField = userModel.schema.path("name");

    // Act & Assert
    expect(nameField.instance).toBe("String");
    expect(nameField.options.required).toBe(true);
    expect(nameField.options.trim).toBe(true);
  });

  it("should have an email field of type String that is required and unique", () => {
    // Arrange
    const emailField = userModel.schema.path("email");

    // Act & Assert
    expect(emailField.instance).toBe("String");
    expect(emailField.options.required).toBe(true);
    expect(emailField.options.unique).toBe(true);
  });

  it("should have a password field of type String that is required", () => {
    // Arrange
    const passwordField = userModel.schema.path("password");

    // Act & Assert
    expect(passwordField.instance).toBe("String");
    expect(passwordField.options.required).toBe(true);
  });

  it("should have a phone field of type String that is required", () => {
    // Arrange
    const phoneField = userModel.schema.path("phone");

    // Act & Assert
    expect(phoneField.instance).toBe("String");
    expect(phoneField.options.required).toBe(true);
  });

  it("should have an address field that is required", () => {
    // Arrange
    const addressField = userModel.schema.path("address");

    // Act & Assert
    expect(addressField.options.required).toBe(true);
  });

  it("should have an answer field of type String that is required", () => {
    // Arrange
    const answerField = userModel.schema.path("answer");

    // Act & Assert
    expect(answerField.instance).toBe("String");
    expect(answerField.options.required).toBe(true);
  });

  it("should have a role field of type Number with default value 0", () => {
    // Arrange
    const roleField = userModel.schema.path("role");

    // Act & Assert
    expect(roleField.instance).toBe("Number");
    expect(roleField.options.default).toBe(0);
  });

  it("should have timestamps enabled", () => {
    // Arrange & Act
    const timestamps = userModel.schema.options.timestamps;

    // Assert
    expect(timestamps).toBe(true);
  });

  it("should be registered with the model name 'users'", () => {
    // Arrange & Act
    const modelName = userModel.modelName;

    // Assert
    expect(modelName).toBe("users");
  });
});
