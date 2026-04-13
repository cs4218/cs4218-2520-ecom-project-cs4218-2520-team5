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
}));

// Mock context hooks
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

jest.mock("../hooks/useCategory", () => jest.fn(() => []));

// Mock child components
jest.mock("../components/Layout", () => {
  return function Layout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

describe("HomePage Component", () => {
  let useAuthMock;
  let useCartMock;
  let useSearchMock;

  const renderHomePage = async () => {
    const result = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    await waitFor(() => {});
    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    useAuthMock = [null, jest.fn()];
    useCartMock = [[], jest.fn()];
    useSearchMock = [{}, jest.fn()];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);
    require("../context/search").useSearch.mockReturnValue(useSearchMock);

    axios.get.mockImplementation(() =>
      Promise.resolve({ data: { products: [] } }),
    );
  });

  // ===== RENDERING TESTS =====

  it("renders without crashing", async () => {
    await renderHomePage();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("displays expected UI elements", async () => {
    await renderHomePage();
    expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
  });

  // ===== USER INTERACTION TESTS =====

  it("navigates to product details on product click", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          { _id: "1", name: "Product 1", slug: "product-1" },
        ],
      },
    });

    await renderHomePage();

    const productLink = await screen.findByText("Product 1");
    fireEvent.click(productLink);

    expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
  });

  // ===== API SUCCESS AND ERROR HANDLING TESTS =====

  it("fetches products on component mount", async () => {
    await renderHomePage();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product");
  });

  it("handles API error gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    await renderHomePage();

    expect(screen.getByText(/Failed to load products/i)).toBeInTheDocument();
  });

  // ===== BOUNDARY VALUE ANALYSIS =====

  it("displays 'No products found' when API returns empty list", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    await renderHomePage();

    expect(screen.getByText(/No products found/i)).toBeInTheDocument();
  });

  it("displays products when API returns data", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          { _id: "1", name: "Product 1", slug: "product-1" },
          { _id: "2", name: "Product 2", slug: "product-2" },
        ],
      },
    });

    await renderHomePage();

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
  });
});
