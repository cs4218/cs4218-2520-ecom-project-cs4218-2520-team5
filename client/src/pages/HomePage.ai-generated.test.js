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

  describe("Initial Render", () => {
    it("renders without crashing", () => {
      renderHomePage();
      expect(screen.getByTestId("homepage")).toBeInTheDocument();
    });

    it("displays expected UI elements", async () => {
      renderHomePage();
      expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
    });
  });

  describe("API Calls", () => {
    it("fetches featured products on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/featured"));
    });

    it("handles API error gracefully", async () => {
      axios.get.mockRejectedValueOnce(new Error("Network Error"));
      renderHomePage();
      await waitFor(() => expect(screen.getByText(/Error loading products/i)).toBeInTheDocument());
    });
  });

  describe("User Interactions", () => {
    it("navigates to product details on product click", async () => {
      const mockProduct = { _id: "1", name: "Product 1", slug: "product-1" };
      axios.get.mockResolvedValueOnce({ data: { products: [mockProduct] } });
      renderHomePage();
      await waitFor(() => screen.getByText("Product 1"));
      fireEvent.click(screen.getByText("Product 1"));
      expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
    });
  });

  describe("Boundary Value Analysis", () => {
    it("displays 'No Products Found' when no products are returned", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText(/No Products Found/i)).toBeInTheDocument());
    });

    it("displays products when at least one product is returned", async () => {
      const mockProduct = { _id: "1", name: "Product 1", slug: "product-1" };
      axios.get.mockResolvedValueOnce({ data: { products: [mockProduct] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("Product 1")).toBeInTheDocument());
    });
  });
});
