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
    axios.get.mockResolvedValueOnce({ data: { products: [] } });
    renderHomePage();
    await waitFor(() => {
      expect(screen.getByText(/Featured Products/i)).toBeInTheDocument();
    });
  });

  it("handles user interactions", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [
          { _id: "1", name: "Product 1", price: 100, description: "Test product" },
        ],
      },
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Product 1"));
    expect(mockNavigate).toHaveBeenCalledWith("/product/1");
  });

  it("handles API success state", async () => {
    const products = [
      { _id: "1", name: "Product 1", price: 100, description: "Test product" },
      { _id: "2", name: "Product 2", price: 200, description: "Another product" },
    ];

    axios.get.mockResolvedValueOnce({ data: { products } });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });
  });

  it("handles API error state", async () => {
    const error = new Error("Network error");
    axios.get.mockRejectedValueOnce(error);

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/Error loading products/i)).toBeInTheDocument();
    });
  });

  it("applies boundary value analysis for product display", async () => {
    const products = [
      { _id: "1", name: "Product 1", price: 100, description: "Test product" },
    ];

    axios.get.mockResolvedValueOnce({ data: { products } });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });

    expect(screen.queryByText("Product 2")).not.toBeInTheDocument();
  });
});
