// Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
import React from "react";
import { render, screen, renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { AuthProvider, useAuth } from "./auth";

describe("AuthContext", () => {
  let getItemSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy = jest.spyOn(Storage.prototype, "getItem");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render children within the AuthProvider", () => {
    // Arrange
    getItemSpy.mockReturnValue(null);

    // Act
    render(
      <AuthProvider>
        <div data-testid="child">Child Content</div>
      </AuthProvider>
    );

    // Assert
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should provide default auth state with null user and empty token", () => {
    // Arrange
    getItemSpy.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Assert
    const [auth] = result.current;
    expect(auth.user).toBeNull();
    expect(auth.token).toBe("");
  });

  it("should load auth data from localStorage on mount", async () => {
    // Arrange
    const storedAuth = {
      user: { name: "John", email: "john@test.com" },
      token: "stored-jwt-token",
    };
    getItemSpy.mockReturnValue(JSON.stringify(storedAuth));

    // Act
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Assert
    await waitFor(() => {
      const [auth] = result.current;
      expect(auth.user).toEqual(storedAuth.user);
      expect(auth.token).toBe("stored-jwt-token");
    });
    expect(getItemSpy).toHaveBeenCalledWith("auth");
  });

  it("should set axios default Authorization header with the token", async () => {
    // Arrange
    const storedAuth = {
      user: { name: "John" },
      token: "my-auth-token",
    };
    getItemSpy.mockReturnValue(JSON.stringify(storedAuth));

    // Act
    renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Assert
    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe(
        "my-auth-token"
      );
    });
  });

  it("should not update auth state when localStorage has no auth data", async () => {
    // Arrange
    getItemSpy.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Assert
    await waitFor(() => {
      expect(getItemSpy).toHaveBeenCalledWith("auth");
    });
    const [auth] = result.current;
    expect(auth.user).toBeNull();
    expect(auth.token).toBe("");
  });

  it("should set axios Authorization header to empty string initially", () => {
    // Arrange
    getItemSpy.mockReturnValue(null);

    // Act
    renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Assert
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });
});
