// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import HomePage from "./HomePage";
import "@testing-library/jest-dom";

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

  describe("Initial Render", () => {
    it("renders without crashing", () => {
      renderHomePage();
      expect(screen.getByTestId("homepage")).toBeInTheDocument();
    });

    it("displays expected UI elements", () => {
      renderHomePage();
      expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
    });
  });

  describe("API Calls", () => {
    it("fetches products on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product"));
    });

    it("handles API error gracefully", async () => {
      const error = new Error("Network error");
      axios.get.mockRejectedValueOnce(error);
      renderHomePage();
      await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
    });
  });

  describe("User Interactions", () => {
    it("navigates to product details on product click", async () => {
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

  describe("Boundary Value Analysis", () => {
    it("displays 'No Products Found' when API returns empty list", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("No Products Found")).toBeInTheDocument());
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
