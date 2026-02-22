import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "./Register";

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

const renderRegister = () =>
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

const fillForm = (getByPlaceholderText, overrides = {}) => {
  const defaults = {
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    phone: "1234567890",
    address: "123 Main St",
    dob: "2000-01-01",
    answer: "Football",
  };
  const vals = { ...defaults, ...overrides };

  fireEvent.change(getByPlaceholderText("Enter Your Name"), {
    target: { value: vals.name },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Email"), {
    target: { value: vals.email },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Password"), {
    target: { value: vals.password },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Phone"), {
    target: { value: vals.phone },
  });
  fireEvent.change(getByPlaceholderText("Enter Your Address"), {
    target: { value: vals.address },
  });
  fireEvent.change(getByPlaceholderText("Enter Your DOB"), {
    target: { value: vals.dob },
  });
  fireEvent.change(getByPlaceholderText("What is Your Favorite sports"), {
    target: { value: vals.answer },
  });
};

describe("Register Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render the register form with all required fields", () => {
    const { getByText, getByPlaceholderText } = renderRegister();

    expect(getByText("REGISTER FORM")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Name")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Email")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Password")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Phone")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your Address")).toBeInTheDocument();
    expect(getByPlaceholderText("Enter Your DOB")).toBeInTheDocument();
    expect(
      getByPlaceholderText("What is Your Favorite sports")
    ).toBeInTheDocument();
  });

  it("should have all inputs initially empty", () => {
    const { getByPlaceholderText } = renderRegister();

    expect(getByPlaceholderText("Enter Your Name").value).toBe("");
    expect(getByPlaceholderText("Enter Your Email").value).toBe("");
    expect(getByPlaceholderText("Enter Your Password").value).toBe("");
    expect(getByPlaceholderText("Enter Your Phone").value).toBe("");
    expect(getByPlaceholderText("Enter Your Address").value).toBe("");
  });

  it("should allow typing in all form fields", () => {
    const { getByPlaceholderText } = renderRegister();

    fillForm(getByPlaceholderText);

    expect(getByPlaceholderText("Enter Your Name").value).toBe("John Doe");
    expect(getByPlaceholderText("Enter Your Email").value).toBe(
      "john@example.com"
    );
    expect(getByPlaceholderText("Enter Your Password").value).toBe(
      "password123"
    );
    expect(getByPlaceholderText("Enter Your Phone").value).toBe("1234567890");
    expect(getByPlaceholderText("Enter Your Address").value).toBe(
      "123 Main St"
    );
  });

  it("should register the user successfully and navigate to login", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    const { getByPlaceholderText, getByText } = renderRegister();

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/register", {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      phone: "1234567890",
      address: "123 Main St",
      DOB: "2000-01-01",
      answer: "Football",
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Register Successfully, please login"
    );
  });

  it("should show error toast when server returns success false", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Already Register please login" },
    });
    const { getByPlaceholderText, getByText } = renderRegister();

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(
      "Already Register please login"
    );
  });

  it("should show generic error toast when API call throws", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));
    const { getByPlaceholderText, getByText } = renderRegister();

    fillForm(getByPlaceholderText);
    fireEvent.click(getByText("REGISTER"));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("should render the REGISTER submit button", () => {
    const { getByText } = renderRegister();

    expect(getByText("REGISTER")).toBeInTheDocument();
    expect(getByText("REGISTER").closest("button")).toHaveAttribute(
      "type",
      "submit"
    );
  });
});
