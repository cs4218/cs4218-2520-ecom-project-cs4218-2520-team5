// MS2 Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI

/**
 * INTEGRATION TEST: Registration Workflow (Frontend)
 *
 * Approach: Bottom-Up Partial Integration
 *
 * Modules integrated (REAL, not mocked):
 *   - pages/Auth/Register.js          — form UI and submission logic
 *   - components/Layout.js            — page layout wrapper
 *   - components/Header.js            — site header (reads auth/cart/search contexts)
 *   - components/Footer.js            — site footer
 *   - context/auth.js   (AuthProvider) — real authentication state management
 *   - context/cart.js   (CartProvider) — real cart state
 *   - context/search.js (SearchProvider) — real search state
 *   - react-router-dom  (MemoryRouter)  — real client-side routing
 *
 * Mocked (external boundaries only):
 *   - axios           — HTTP transport layer (network boundary)
 *   - react-hot-toast — browser notification UI
 *   - hooks/useCategory — unrelated feature that makes its own HTTP call
 *
 * Stories covered:
 *   Story 1 — Registration workflow (frontend): form fill, payload correctness,
 *             success/failure handling, navigation to login on success.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Register from "./Register";
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

/* ---------- helpers ---------- */

const renderRegisterPage = () =>
  render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/register"]}>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route
                path="/login"
                element={<div data-testid="login-page">Login Page</div>}
              />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );

const fillForm = () => {
  fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
    target: { value: "Jane Smith" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
    target: { value: "jane@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
    target: { value: "strongPassword1" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
    target: { value: "5551234567" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
    target: { value: "99 Test Lane" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter Your DOB"), {
    target: { value: "1995-06-15" },
  });
  fireEvent.change(
    screen.getByPlaceholderText("What is Your Favorite sports"),
    { target: { value: "Tennis" } }
  );
};

/* ---------- tests ---------- */

describe("Registration Workflow Integration — Story 1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Interaction 1 — User fills in all fields and submits
  it("should render the full registration form within the integrated layout", () => {
    renderRegisterPage();

    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Name")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter Your Email")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter Your Password")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter Your Phone")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter Your Address")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your DOB")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("What is Your Favorite sports")
    ).toBeInTheDocument();
  });

  // Interaction 2 — Frontend sends correct payload to backend
  it("should send the complete registration payload to the backend API", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    renderRegisterPage();

    fillForm();
    fireEvent.click(screen.getByText("REGISTER"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "strongPassword1",
        phone: "5551234567",
        address: "99 Test Lane",
        DOB: "1995-06-15",
        answer: "Tennis",
      });
    });
  });

  // Interaction 7 — Frontend handles success: toast + navigate to /login
  it("should show success toast and navigate to login page on successful registration", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    renderRegisterPage();

    fillForm();
    fireEvent.click(screen.getByText("REGISTER"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Register Successfully, please login"
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  // Interaction 7 — Frontend handles failure: error toast with server message
  it("should show server error message when backend returns success:false", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Already Register please login" },
    });
    renderRegisterPage();

    fillForm();
    fireEvent.click(screen.getByText("REGISTER"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Already Register please login"
      );
    });
  });

  // Interaction 7 — Frontend handles network error
  it("should show generic error toast on network failure", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));
    renderRegisterPage();

    fillForm();
    fireEvent.click(screen.getByText("REGISTER"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  // Interaction 7 — User stays on register page after failure
  it("should not navigate away from register page on failure", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Already Register please login" },
    });
    renderRegisterPage();

    fillForm();
    fireEvent.click(screen.getByText("REGISTER"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });
});
