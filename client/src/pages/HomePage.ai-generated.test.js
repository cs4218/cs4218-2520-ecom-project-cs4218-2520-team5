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
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("displays expected UI elements", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("Featured Products")).toBeInTheDocument());
    });
  });

  describe("API interactions", () => {
    it("fetches products on mount", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product"));
    });

    it("displays products when API call is successful", async () => {
      const products = [
        { _id: "1", name: "Product 1", price: 100 },
        { _id: "2", name: "Product 2", price: 200 },
      ];
      axios.get.mockResolvedValueOnce({ data: { products } });
      renderHomePage();
      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
        expect(screen.getByText("Product 2")).toBeInTheDocument();
      });
    });

    it("handles API error gracefully", async () => {
      axios.get.mockRejectedValueOnce(new Error("Network Error"));
      renderHomePage();
      await waitFor(() => expect(screen.getByText("Error loading products")).toBeInTheDocument());
    });
  });

  describe("User interactions", () => {
    it("navigates to product details on product click", async () => {
      const products = [{ _id: "1", name: "Product 1", price: 100 }];
      axios.get.mockResolvedValueOnce({ data: { products } });
      renderHomePage();
      await waitFor(() => {
        fireEvent.click(screen.getByText("Product 1"));
        expect(mockNavigate).toHaveBeenCalledWith("/product/1");
      });
    });
  });

  describe("Boundary value analysis", () => {
    it("displays 'No Products Found' when no products are available", async () => {
      axios.get.mockResolvedValueOnce({ data: { products: [] } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("No Products Found")).toBeInTheDocument());
    });

    it("displays products correctly when exactly one product is available", async () => {
      const products = [{ _id: "1", name: "Product 1", price: 100 }];
      axios.get.mockResolvedValueOnce({ data: { products } });
      renderHomePage();
      await waitFor(() => expect(screen.getByText("Product 1")).toBeInTheDocument());
    });
  });
});
