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

describe("HomePage Component", () => {
  let useAuthMock;
  let useCartMock;
  let useSearchMock;

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    useAuthMock = [{}, jest.fn()];
    useCartMock = [[], jest.fn()];
    useSearchMock = [{}, jest.fn()];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);
    require("../context/search").useSearch.mockReturnValue(useSearchMock);

    axios.get.mockResolvedValue({ data: { products: [] } });
  });

  // ===== RENDERING TESTS =====

  it("renders without crashing", () => {
    renderHomePage();
    expect(screen.getByTestId("homepage")).toBeInTheDocument();
  });

  it("displays expected UI elements", async () => {
    renderHomePage();
    expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search products/i)).toBeInTheDocument();
  });

  // ===== USER INTERACTION TESTS =====

  it("navigates to product details on product click", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: "1", name: "Product 1", slug: "product-1" }] },
    });

    renderHomePage();
    await waitFor(() => expect(screen.getByText("Product 1")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Product 1"));
    expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
  });

  it("updates search context on search input", () => {
    renderHomePage();
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: "Laptop" } });

    expect(useSearchMock[1]).toHaveBeenCalledWith({ query: "Laptop" });
  });

  // ===== API HANDLING TESTS =====

  it("fetches products on component mount", async () => {
    renderHomePage();
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product"));
  });

  it("handles API error gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load products/i)).toBeInTheDocument();
    });
  });

  // ===== BOUNDARY VALUE ANALYSIS =====

  it("displays 'No products found' when API returns empty list", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    });
  });

  it("displays all products when API returns multiple items", async () => {
    const products = [
      { _id: "1", name: "Product 1", slug: "product-1" },
      { _id: "2", name: "Product 2", slug: "product-2" },
    ];
    axios.get.mockResolvedValueOnce({ data: { products } });

    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });
  });
});
