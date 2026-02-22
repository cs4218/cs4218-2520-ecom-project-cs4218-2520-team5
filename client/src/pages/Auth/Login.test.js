import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "./Login";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<div>Forgot Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("Login Component", () => {
  let mockSetAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    mockSetAuth = jest.fn();
    useAuth.mockReturnValue([null, mockSetAuth]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render the login form with email and password fields", () => {
    renderLogin();

    expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
  });

  it("should have inputs initially empty", () => {
    renderLogin();

    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe("");
  });

  it("should allow typing email and password", () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "password123" },
    });

    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      "test@example.com"
    );
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe(
      "password123"
    );
  });

  it("should login successfully, store auth data and navigate", async () => {
    const mockResponse = {
      data: {
        success: true,
        message: "login successfully",
        user: { _id: "u1", name: "John", email: "john@test.com" },
        token: "jwt-token",
      },
    };
    axios.post.mockResolvedValueOnce(mockResponse);
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "john@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/login", {
      email: "john@test.com",
      password: "pass123",
    });
    expect(toast.success).toHaveBeenCalledWith("login successfully", {
      duration: 5000,
      icon: "🙏",
      style: { background: "green", color: "white" },
    });
    expect(mockSetAuth).toHaveBeenCalledWith({
      user: mockResponse.data.user,
      token: "jwt-token",
    });
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "auth",
      JSON.stringify(mockResponse.data)
    );
  });

  it("should show error toast when server returns success false", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Invalid Password" },
    });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Invalid Password");
  });

  it("should show generic error toast when API call throws", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByText("LOGIN"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("should navigate to forgot-password page when Forgot Password is clicked", () => {
    renderLogin();

    fireEvent.click(screen.getByText("Forgot Password"));

    expect(screen.getByText("Forgot Page")).toBeInTheDocument();
  });

  it("should render the LOGIN submit button", () => {
    renderLogin();

    const loginBtn = screen.getByRole("button", { name: "LOGIN" });
    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn).toHaveAttribute("type", "submit");
  });
});
