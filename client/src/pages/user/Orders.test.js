// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import Orders from "./Orders";

// Mock external dependencies to achieve isolation (unit test requirement)
jest.mock("axios");

// Mock context hooks - testing Orders in isolation
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

// Mock child components to maintain unit test isolation
jest.mock("../../components/UserMenu", () => {
  return function UserMenu() {
    return <div data-testid="user-menu">UserMenu</div>;
  };
});

jest.mock("../../components/Layout", () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock window.matchMedia (required for React components using media queries)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("Orders Component", () => {
  let useAuthMock;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock = require("../../context/auth").useAuth;
  });

  // Helper to render component with router wrapper
  const renderOrders = () => {
    return render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>,
    );
  };

  // ===== TEST 1: Component Rendering (Output-based) =====
  it("should render page heading and UserMenu when component mounts", () => {
    // Arrange
    useAuthMock.mockReturnValue([{ token: null }, jest.fn()]);

    // Act
    renderOrders();

    // Assert (verify user-visible behavior)
    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Your Orders",
    );
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
  });

  // ===== TEST 2: Empty State Display - No Token (Output-based) =====
  it("should not display orders when no token is present", () => {
    // Arrange - user not authenticated
    useAuthMock.mockReturnValue([{ token: null }, jest.fn()]);

    // Act
    renderOrders();

    // Assert (verify page renders with just heading, no orders table)
    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // ===== TEST 3: API Call Guard (Communication-based) =====
  it("should NOT call API when no auth token exists", async () => {
    // Arrange - user not authenticated
    useAuthMock.mockReturnValue([{ token: null }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { orders: [] } });

    // Act
    renderOrders();

    // Assert (verify behavior: no unnecessary API calls)
    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  // ===== TEST 4: Empty State Display - Empty Array (Output-based) =====
  it("should not display orders table when API returns empty array", async () => {
    // Arrange - authenticated but no orders
    useAuthMock.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { orders: [] } });

    // Act
    renderOrders();

    // Assert (verify page renders with just heading, no orders table)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // ===== TEST 5: API Call Trigger (Communication-based) =====
  it("should call API when auth token exists", async () => {
    // Arrange - authenticated user
    useAuthMock.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { orders: [] } });

    // Act
    renderOrders();

    // Assert (verify API is called with token)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });
  });

  // ===== TEST 6: Data Display - Single Order (State-based) =====
  it("should display orders when API returns data", async () => {
    // Arrange - mock successful API response
    const mockOrders = [
      {
        _id: "order123",
        status: "Processing",
        buyer: { name: "John Doe" },
        createAt: "2024-02-20T10:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "prod1",
            name: "Test Product",
            description: "Product description here",
            price: 99.99,
          },
        ],
      },
    ];
    useAuthMock.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { orders: mockOrders } });

    // Act
    renderOrders();

    // Assert (verify user can see their order data)
    await waitFor(() => {
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });
  });

  // ===== TEST 7: Multiple Products Display (State-based) =====
  it("should display multiple products and product count correctly", async () => {
    // Arrange - mock order with multiple products
    const mockOrders = [
      {
        _id: "order456",
        status: "Shipped",
        buyer: { name: "Alice Brown" },
        createdAt: new Date().toISOString(),
        payment: { success: true },
        products: [
          {
            _id: "productA",
            name: "Product A",
            description: "Description A",
            price: 50,
          },
          {
            _id: "productB",
            name: "Product B",
            description: "Description B",
            price: 75,
          },
        ],
      },
    ];
    useAuthMock.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { orders: mockOrders } });

    // Act
    renderOrders();

    // Assert (verify all products display with count)
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // Product count in Quantity column
      expect(screen.getByText("Product A")).toBeInTheDocument();
      expect(screen.getByText("Product B")).toBeInTheDocument();
      expect(screen.getByText("Description A")).toBeInTheDocument();
      expect(screen.getByText("Description B")).toBeInTheDocument();
      expect(screen.getByText("Price : 50")).toBeInTheDocument();
      expect(screen.getByText("Price : 75")).toBeInTheDocument();
    });
  });

  // ===== TEST 8: Failed Payment Display (Output-based) =====
  it("should display 'Failed' when payment is unsuccessful", async () => {
    // Arrange - mock order with failed payment
    const mockOrders = [
      {
        _id: "order789",
        status: "Cancelled",
        buyer: { name: "Jane Smith" },
        createAt: "2024-02-19T10:00:00Z",
        payment: { success: false },
        products: [
          {
            _id: "productC",
            name: "Product C",
            description: "Test description of product C",
            price: 100,
          },
        ],
      },
    ];
    useAuthMock.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { orders: mockOrders } });

    // Act
    renderOrders();

    // Assert (verify failed payment displays correctly with products)
    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Product C")).toBeInTheDocument();
      expect(screen.getByText("Price : 100")).toBeInTheDocument();
    });
  });

  // ===== TEST 9: Error Handling with Empty State (Communication-based) =====
  it("should log error and render page without orders on API failure", async () => {
    // Arrange - mock API failure
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    useAuthMock.mockReturnValue([{ token: "token123" }, jest.fn()]);
    const mockError = new Error("Network error");
    axios.get.mockRejectedValue(mockError);

    // Act
    renderOrders();

    // Assert (verify error is logged and component doesn't crash)
    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    });
    // Component should still render heading without orders after error
    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    consoleLogSpy.mockRestore();
  });
});
