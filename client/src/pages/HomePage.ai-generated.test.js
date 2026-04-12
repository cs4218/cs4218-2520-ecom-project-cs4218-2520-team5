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

jest.mock("../components/Header", () => {
  return function Header() {
    return <div data-testid="header">Header</div>;
  };
});

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Renders without crashing
  it("renders without crashing", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  // Test 2: Displays expected UI elements
  it("displays the header component", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  // Test 3: Handles user interactions
  it("navigates to product details when a product is clicked", async () => {
    // Mock API response
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          { _id: "1", name: "Product 1", slug: "product-1" },
        ],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Wait for products to load
    await waitFor(() => expect(screen.getByText("Product 1")).toBeInTheDocument());

    // Simulate click on product
    fireEvent.click(screen.getByText("Product 1"));

    // Assert navigation
    expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
  });

  // Test 4: Handles API success and error states
  it("displays products when API call is successful", async () => {
    // Mock API response
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          { _id: "1", name: "Product 1", slug: "product-1" },
          { _id: "2", name: "Product 2", slug: "product-2" },
        ],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    // Mock API error
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText("Failed to load products")).toBeInTheDocument();
    });
  });

  // Test 5: Boundary value analysis
  it("displays 'No Products Found' when API returns empty list", async () => {
    // Mock API response with empty products
    axios.get.mockResolvedValueOnce({
      data: {
        products: [],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });
  });
});
