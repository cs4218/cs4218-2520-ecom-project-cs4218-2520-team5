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

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
  };

  it("renders without crashing", () => {
    renderHomePage();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("displays expected UI elements", async () => {
    renderHomePage();
    expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Featured Products/i)).toBeInTheDocument();
  });

  it("handles navigation to product details on click", async () => {
    renderHomePage();
    const productLink = screen.getByText(/View Details/i);
    fireEvent.click(productLink);
    expect(mockNavigate).toHaveBeenCalledWith("/product/some-product-slug");
  });

  it("fetches featured products on load", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: "1", name: "Product 1", price: 100 }] },
    });

    renderHomePage();

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/featured"));
    expect(screen.getByText("Product 1")).toBeInTheDocument();
  });

  it("handles API error state gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    renderHomePage();

    await waitFor(() => expect(screen.getByText(/Error loading products/i)).toBeInTheDocument());
  });

  it("displays 'No Products Found' when API returns empty list", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: [] } });

    renderHomePage();

    await waitFor(() => expect(screen.getByText(/No Products Found/i)).toBeInTheDocument());
  });

  it("displays product details correctly", async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [{ _id: "1", name: "Product 1", price: 100 }] },
    });

    renderHomePage();

    await waitFor(() => expect(screen.getByText("Product 1")).toBeInTheDocument());
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("handles user interactions with search", async () => {
    renderHomePage();
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: "Laptop" } });
    expect(searchInput.value).toBe("Laptop");
  });

  it("navigates to search results on search submit", async () => {
    renderHomePage();
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: "Laptop" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("/search?query=Laptop");
  });
});
