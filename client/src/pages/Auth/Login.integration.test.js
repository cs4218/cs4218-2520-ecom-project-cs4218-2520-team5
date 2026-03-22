/**
 * INTEGRATION TEST: Login Flow (Frontend)
 *
 * Approach: Bottom-Up Partial Integration
 *
 * Modules integrated (REAL, not mocked):
 *   - pages/Auth/Login.js              — login form and submission logic
 *   - components/Layout.js             — page layout
 *   - components/Header.js / Footer.js — site chrome
 *   - context/auth.js   (AuthProvider)  — REAL auth state + localStorage hydration
 *                                         + axios Authorization header sync
 *   - context/cart.js   (CartProvider)  — real cart state
 *   - context/search.js (SearchProvider)— real search state
 *   - react-router-dom  (MemoryRouter)  — real routing with navigation
 *   - localStorage                      — real browser storage (jsdom)
 *
 * Mocked (external boundaries only):
 *   - axios           — HTTP transport layer
 *   - react-hot-toast — notification UI
 *   - hooks/useCategory — unrelated feature
 *
 * Why this differs from the unit test:
 *   The unit test mocks useAuth entirely and spies on localStorage.setItem.
 *   This integration test uses the REAL AuthProvider so that Login's setAuth
 *   call flows through the real context, updates the real axios Authorization
 *   header, and writes to real (jsdom) localStorage.
 *
 * Stories covered:
 *   Story 2 — Login flow (frontend): credential submission, auth context
 *             update, localStorage persistence, axios header sync,
 *             navigation, failure handling.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Login from "./Login";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";

/* ---------- mocks: only external boundaries ---------- */

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: { headers: { common: {} } },
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

/* ---------- test data ---------- */

const mockLoginResponse = {
  data: {
    success: true,
    message: "login successfully",
    user: {
      _id: "user-1",
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      address: "123 Test St",
      role: 0,
    },
    token: "real-jwt-token-123",
  },
};

/* ---------- helpers ---------- */

const renderLoginPage = (initialEntries = ["/login"]) =>
  render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/forgot-password"
                element={<div>Forgot Page</div>}
              />
              <Route
                path="/"
                element={
                  <div data-testid="home-page">Home Page</div>
                }
              />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );

const submitLogin = async (
  email = "test@example.com",
  password = "password123"
) => {
  fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByText("LOGIN"));
};

/* ---------- tests ---------- */

describe("Login Flow Integration — Story 2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults.headers.common = {};
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Interaction 1 — User submits valid login credentials
  it("should send login credentials to the backend API", async () => {
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    renderLoginPage();

    await submitLogin("test@example.com", "password123");

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  // Interaction 2 — Success toast
  it("should show a success toast on successful login", async () => {
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    renderLoginPage();

    await submitLogin();

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("login successfully", {
        duration: 5000,
        icon: "🙏",
        style: { background: "green", color: "white" },
      });
    });
  });

  // Interaction 4 — Auth Context updates with user and token (via real AuthProvider)
  // Interaction 6 — axios authorization header is synchronized
  it("should update axios Authorization header via real AuthProvider on login", async () => {
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    renderLoginPage();

    await submitLogin();

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe(
        "real-jwt-token-123"
      );
    });
  });

  // Interaction 5 — localStorage persists returned auth data
  it("should persist auth data to real localStorage on successful login", async () => {
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    renderLoginPage();

    await submitLogin();

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("auth"));
      expect(stored).toBeTruthy();
      expect(stored.user.name).toBe("Test User");
      expect(stored.user.email).toBe("test@example.com");
      expect(stored.token).toBe("real-jwt-token-123");
    });
  });

  // Interaction 1 — Navigate to home on success
  it("should navigate to home page after successful login", async () => {
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    renderLoginPage();

    await submitLogin();

    await waitFor(() => {
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  // Interaction 7 — Failed login does not update auth state
  it("should not update localStorage when login fails", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Invalid Password" },
    });
    renderLoginPage();

    await submitLogin("test@example.com", "wrongpassword");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid Password");
    });
    expect(localStorage.getItem("auth")).toBeNull();
  });

  // Interaction 7 — Failed login does not sync axios header
  it("should not update axios Authorization header on failed login", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Invalid Password" },
    });
    renderLoginPage();

    await submitLogin("test@example.com", "wrongpassword");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(axios.defaults.headers.common["Authorization"]).toBeFalsy();
  });

  // Interaction 8 — Error response is handled by frontend
  it("should show generic error toast when API throws", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));
    renderLoginPage();

    await submitLogin();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  // Interaction 7/8 — User stays on login page after failure
  it("should remain on login page when login fails", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Invalid Password" },
    });
    renderLoginPage();

    await submitLogin();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.queryByTestId("home-page")).not.toBeInTheDocument();
  });
});
