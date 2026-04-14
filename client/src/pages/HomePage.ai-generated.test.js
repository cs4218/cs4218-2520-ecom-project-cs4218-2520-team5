// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import HomePage from "./HomePage";

// Mock external dependencies for isolation
jest.mock("axios");
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ pathname: "/" }),
}));

// Mock context hooks
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{}, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{}, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

// Mock child components
jest.mock("../components/Layout", () => {
  return function Layout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it("renders without crashing", () => {
    renderHomePage();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("displays expected UI elements", async () => {
    renderHomePage();
    expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
  });

  it("handles user interactions", async () => {
    renderHomePage();
    const searchInput = screen.getByPlaceholderText("Search products...");
    fireEvent.change(searchInput, { target: { value: "Laptop" } });
    expect(searchInput.value).toBe("Laptop");
  });

  it("handles API success state", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: "1", name: "Laptop", price: 999 }] },
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("$999.00")).toBeInTheDocument();
    });
  });

  it("handles API error state", async () => {
    const error = new Error("Network Error");
    axios.get.mockRejectedValueOnce(error);

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/Error loading products/i)).toBeInTheDocument();
    });
  });

  it("navigates to product details on click", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: "1", name: "Laptop", price: 999 }] },
    });

    renderHomePage();

    await waitFor(() => {
      const productLink = screen.getByText("Laptop");
      fireEvent.click(productLink);
      expect(mockNavigate).toHaveBeenCalledWith("/product/1");
    });
  });

  it("applies boundary value analysis for search input", async () => {
    renderHomePage();
    const searchInput = screen.getByPlaceholderText("Search products...");

    fireEvent.change(searchInput, { target: { value: "" } });
    expect(searchInput.value).toBe("");

    fireEvent.change(searchInput, { target: { value: "a".repeat(100) } });
    expect(searchInput.value).toBe("a".repeat(100));
  });
});
