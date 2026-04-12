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

    it("displays expected UI elements", () => {
      renderHomePage();
      expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
      expect(screen.getByText(/Featured Products/i)).toBeInTheDocument();
    });
  });

  describe("API interactions", () => {
    it("fetches featured products on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/featured"));
    });

    it("handles API error gracefully", async () => {
      const error = new Error("Network error");
      axios.get.mockRejectedValueOnce(error);
      renderHomePage();
      await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
    });
  });

  describe("User interactions", () => {
    it("navigates to product details when a product is clicked", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", slug: "product-1" },
      ];
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("Product 1")).toBeInTheDocument());
      fireEvent.click(screen.getByText("Product 1"));
      expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
    });
  });

  describe("Boundary value analysis", () => {
    it("displays 'No Featured Products' when there are no products", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("No Featured Products")).toBeInTheDocument());
    });

    it("displays products when there are featured products", async () => {
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
