// Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Profile from "./Profile";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
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
    getItem: jest.fn(() =>
      JSON.stringify({
        user: {
          name: "John",
          email: "john@test.com",
          phone: "1111111111",
          address: "Old Address",
        },
      })
    ),
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

describe("Profile Component", () => {
  let mockSetAuth;

  const mockUser = {
    name: "John",
    email: "john@test.com",
    phone: "1111111111",
    address: "Old Address",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    mockSetAuth = jest.fn();
    useAuth.mockReturnValue([{ user: mockUser }, mockSetAuth]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderProfile = () =>
    render(
      <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
        <Routes>
          <Route
            path="/dashboard/user/profile"
            element={<Profile />}
          />
        </Routes>
      </MemoryRouter>
    );

  it("should render the profile form with user data pre-filled", () => {
    renderProfile();

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("John");
    expect(screen.getByPlaceholderText("Enter Your Email").value).toBe(
      "john@test.com"
    );
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
      "1111111111"
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe(
      "Old Address"
    );
  });

  it("should have the email field disabled", () => {
    renderProfile();

    expect(screen.getByPlaceholderText("Enter Your Email")).toBeDisabled();
  });

  it("should allow editing profile fields", () => {
    renderProfile();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Email"), {
      target: { value: "jane@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "newpass123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "New Address" },
    });

    expect(screen.getByPlaceholderText("Enter Your Name").value).toBe("Jane");
    expect(screen.getByPlaceholderText("Enter Your Password").value).toBe(
      "newpass123"
    );
    expect(screen.getByPlaceholderText("Enter Your Phone").value).toBe(
      "9999999999"
    );
    expect(screen.getByPlaceholderText("Enter Your Address").value).toBe(
      "New Address"
    );
  });

  it("should update profile successfully and refresh auth context", async () => {
    const updatedUser = { ...mockUser, name: "Jane" };
    axios.put.mockResolvedValueOnce({
      data: { success: true, updatedUser },
    });
    renderProfile();

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Jane" },
    });
    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
      name: "Jane",
      email: "john@test.com",
      password: "",
      phone: "1111111111",
      address: "Old Address",
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Profile Updated Successfully"
    );
    expect(mockSetAuth).toHaveBeenCalledWith({
      user: updatedUser,
    });
  });

  it("should show error toast when API returns data.error", async () => {
    axios.put.mockResolvedValueOnce({
      data: { error: "Password is required and 6 character long" },
    });
    renderProfile();

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(
      "Password is required and 6 character long"
    );
  });

  it("should show generic error toast when API call throws", async () => {
    axios.put.mockRejectedValueOnce(new Error("Network Error"));
    renderProfile();

    fireEvent.click(screen.getByText("UPDATE"));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("should render the USER PROFILE heading and UPDATE button", () => {
    renderProfile();

    expect(screen.getByText("USER PROFILE")).toBeInTheDocument();
    expect(screen.getByText("UPDATE")).toBeInTheDocument();
  });
});
