// Koo Zhuo Hui, A0253417H
// Assisted with AI

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

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHomePage = () =>
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

  describe("Initial render", () => {
    it("renders without crashing", () => {
      renderHomePage();
      expect(screen.getByTestId("homepage")).toBeInTheDocument();
    });

    it("displays expected UI elements", async () => {
      renderHomePage();
      expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
    });
  });

  describe("API interactions", () => {
    it("fetches categories on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: { categories: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category"));
    });

    it("handles API error gracefully", async () => {
      const error = new Error("Network error");
      axios.get.mockRejectedValueOnce(error);
      renderHomePage();
      await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
    });
  });

  describe("User interactions", () => {
    it("navigates to product details on product click", async () => {
      const mockProduct = { _id: "1", name: "Product 1", slug: "product-1" };
      axios.get.mockResolvedValueOnce({ data: { products: [mockProduct] } });
      renderHomePage();
      await waitFor(() => screen.getByText("Product 1"));
      fireEvent.click(screen.getByText("Product 1"));
      expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
    });

    it("handles search input", async () => {
      renderHomePage();
      const searchInput = screen.getByPlaceholderText(/Search products/i);
      fireEvent.change(searchInput, { target: { value: "Laptop" } });
      expect(searchInput.value).toBe("Laptop");
    });
  });

  describe("Boundary value analysis", () => {
    it("displays 'No products found' when no products are returned", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("No products found")).toBeInTheDocument());
    });

    it("displays products when API returns data", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", slug: "product-1" },
        { _id: "2", name: "Product 2", slug: "product-2" },
      ];
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
      });
    });
  });
});
