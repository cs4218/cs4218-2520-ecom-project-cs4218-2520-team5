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

  // ===== RENDERING TESTS =====

  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("displays expected UI elements", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  // ===== USER INTERACTION TESTS =====

  it("navigates to product details when a product is clicked", async () => {
    // Arrange
    const mockProducts = [
      { _id: "1", name: "Product 1", slug: "product-1" },
    ];
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Act
    await waitFor(() => expect(screen.getByText("Product 1")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Product 1"));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
  });

  // ===== API SUCCESS AND ERROR HANDLING TESTS =====

  it("fetches and displays products on successful API call", async () => {
    // Arrange
    const mockProducts = [
      { _id: "1", name: "Product 1", slug: "product-1" },
      { _id: "2", name: "Product 2", slug: "product-2" },
    ];
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    // Arrange
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Error loading products")).toBeInTheDocument();
    });
  });

  // ===== BOUNDARY VALUE ANALYSIS =====

  it("displays 'No products found' when API returns empty list", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText("No products found")).toBeInTheDocument();
    });
  });
});
