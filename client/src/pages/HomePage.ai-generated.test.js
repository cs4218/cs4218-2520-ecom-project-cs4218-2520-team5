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

    it("displays expected UI elements", () => {
      renderHomePage();
      expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Shop Now/i })).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("navigates to products page when 'Shop Now' button is clicked", () => {
      renderHomePage();
      const shopNowButton = screen.getByRole("button", { name: /Shop Now/i });
      fireEvent.click(shopNowButton);
      expect(mockNavigate).toHaveBeenCalledWith("/products");
    });
  });

  describe("API Calls", () => {
    it("fetches featured products on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/featured"));
    });

    it("displays featured products on successful API call", async () => {
      const mockProducts = [
        { _id: "1", name: "Product 1", price: 100 },
        { _id: "2", name: "Product 2", price: 200 },
      ];
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      axios.get.mockRejectedValueOnce(new Error("Network Error"));
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText(/Error loading featured products/i)).toBeInTheDocument();
      });
    });
  });

  describe("Boundary Value Analysis", () => {
    it("displays 'No Featured Products' when API returns empty list", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText(/No Featured Products/i)).toBeInTheDocument();
      });
    });

    it("displays a single featured product correctly", async () => {
      const mockProduct = [{ _id: "1", name: "Single Product", price: 100 }];
      axios.get.mockResolvedValueOnce({ data: { products: mockProduct } });
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText("Single Product")).toBeInTheDocument();
      });
    });
  });
});
