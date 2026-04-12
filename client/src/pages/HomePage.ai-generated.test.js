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

  const renderHomePage = () =>
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

  describe("Initial render", () => {
    it("renders without crashing", () => {
      renderHomePage();
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    it("displays expected UI elements", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText(/Featured Products/i)).toBeInTheDocument());
    });
  });

  describe("API interactions", () => {
    it("fetches products on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product"));
    });

    it("handles API error gracefully", async () => {
      const error = new Error("Network Error");
      axios.get.mockRejectedValueOnce(error);
      renderHomePage();
      await waitFor(() => expect(screen.getByText(/Error loading products/i)).toBeInTheDocument());
    });
  });

  describe("Product display", () => {
    const mockProducts = [
      { _id: "1", name: "Product 1", price: 100, description: "Description 1" },
      { _id: "2", name: "Product 2", price: 200, description: "Description 2" },
    ];

    it("displays products when API returns data", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
      });
    });

    it("displays 'No products found' when API returns empty list", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText(/No products found/i)).toBeInTheDocument());
    });
  });

  describe("User interactions", () => {
    it("navigates to product details on product click", async () => {
      const mockProducts = [{ _id: "1", name: "Product 1", price: 100, description: "Description 1" }];
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });
      renderHomePage();
      await waitFor(() => {
        const productLink = screen.getByText("Product 1");
        fireEvent.click(productLink);
        expect(mockNavigate).toHaveBeenCalledWith("/product/1");
      });
    });
  });

  describe("Boundary value analysis", () => {
    it("displays correct number of products", async () => {
      const mockProducts = Array.from({ length: 10 }, (_, i) => ({
        _id: `${i}`,
        name: `Product ${i}`,
        price: i * 10,
        description: `Description ${i}`,
      }));
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });
      renderHomePage();
      await waitFor(() => {
        mockProducts.forEach((product) => {
          expect(screen.getByText(product.name)).toBeInTheDocument();
        });
      });
    });
  });
});
