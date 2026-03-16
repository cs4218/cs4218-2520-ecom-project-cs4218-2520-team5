// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI

import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import CartPage from "./CartPage";

// Mock external dependencies for isolation (Fast + Isolated principle)
jest.mock("axios");
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock context hooks
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Mock child components (maintain unit test isolation)
jest.mock("../components/Layout", () => {
  return function Layout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock Braintree DropIn
jest.mock("braintree-web-drop-in-react", () => {
  return function DropIn() {
    return null;
  };
});

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe("CartPage Component", () => {
  let useAuthMock;
  let useCartMock;
  let mockSetCart;

  // Helper to render and wait for async updates (eliminates act() warnings)
  const renderCartPage = async () => {
    const result = render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    );
    // Wait for async state updates from useEffect (getToken call)
    await waitFor(() => {});
    return result;
  };

  beforeEach(() => {
    // Arrange - Reset mocks before each test
    jest.clearAllMocks();
    mockSetCart = jest.fn();

    // Default mock implementations
    useAuthMock = [null, jest.fn()];
    useCartMock = [[], mockSetCart];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    // Mock localStorage
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
    Storage.prototype.getItem = jest.fn();

    // Default axios mock - resolve immediately with correct structure
    axios.get.mockImplementation(() =>
      Promise.resolve({ data: { clientToken: null } }),
    );
    axios.post.mockImplementation(() =>
      Promise.resolve({ data: { success: true } }),
    );
  });

  // ===== GUEST USER BEHAVIORS =====
  // Testing Style: Output-based (verify what renders)

  it("should display 'Hello Guest' when user is not authenticated", async () => {
    // Arrange - guest user with no auth
    useAuthMock[0] = null;
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    // Act
    await renderCartPage();

    // Assert - verify observable output
    expect(screen.getByText(/Hello Guest/i)).toBeInTheDocument();
  });

  it("should display 'Your Cart Is Empty' when cart has no items", async () => {
    // Arrange - empty cart
    useCartMock[0] = [];
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    // Act
    await renderCartPage();

    // Assert - verify empty cart message
    expect(screen.getByText(/Your Cart Is Empty/i)).toBeInTheDocument();
  });

  it("should display login prompt when guest user has items in cart", async () => {
    // Arrange - guest with items
    useAuthMock[0] = null;
    useCartMock[0] = [
      { _id: "1", name: "Product 1", price: 100, description: "Test product" },
    ];
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    // Act
    await renderCartPage();

    // Assert - verify login prompt appears
    expect(screen.getByText(/please login to checkout !/i)).toBeInTheDocument();
  });

  // ===== AUTHENTICATED USER BEHAVIORS =====
  // Testing Style: Output-based

  it("should display user name when authenticated", async () => {
    // Arrange - authenticated user
    useAuthMock[0] = {
      user: { name: "John Doe", address: "123 Main St" },
      token: "fake-token",
    };
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    // Act
    await renderCartPage();

    // Assert - verify user name displays
    expect(screen.getByText(/Hello\s+John Doe/i)).toBeInTheDocument();
  });

  it("should display cart item count when cart has items", async () => {
    // Arrange - cart with 2 items
    useCartMock[0] = [
      { _id: "1", name: "Product 1", price: 100, description: "Description 1" },
      { _id: "2", name: "Product 2", price: 200, description: "Description 2" },
    ];
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    // Act
    await renderCartPage();

    // Assert - verify count displays
    expect(
      screen.getByText(/You Have 2 items in your cart/i),
    ).toBeInTheDocument();
  });

  // ===== CART ITEM DISPLAY BEHAVIORS =====
  // Testing Style: Output-based (verify rendered data)

  it("should display all cart items with correct data", async () => {
    // Arrange - cart with multiple items
    const mockCart = [
      {
        _id: "prod1",
        name: "Laptop",
        description: "High performance laptop for gaming",
        price: 1200,
      },
      {
        _id: "prod2",
        name: "Mouse",
        description: "Wireless gaming mouse",
        price: 50,
      },
    ];
    useCartMock[0] = mockCart;
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    // Act
    await renderCartPage();

    // Assert - verify each item displays correctly
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText(/High performance laptop/i)).toBeInTheDocument();
    expect(screen.getByText(/Price : 1200/i)).toBeInTheDocument();

    expect(screen.getByText("Mouse")).toBeInTheDocument();
    expect(screen.getByText(/Wireless gaming mouse/i)).toBeInTheDocument();
    expect(screen.getByText(/Price : 50/i)).toBeInTheDocument();
  });

  it("should display correct total price for cart items", async () => {
    // Arrange - cart with known prices
    useCartMock[0] = [
      { _id: "1", name: "Item1", price: 100, description: "Desc 1" },
      { _id: "2", name: "Item2", price: 250, description: "Desc 2" },
      { _id: "3", name: "Item3", price: 50, description: "Desc 3" },
    ];
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    // Act
    await renderCartPage();

    // Assert - verify total calculation (100 + 250 + 50 = $400.00)
    expect(screen.getByText(/Total : \$400\.00/i)).toBeInTheDocument();
  });

  // ===== CART ITEM REMOVAL BEHAVIOR =====
  // Testing Style: Communication-based (verify interactions)

  it("should remove item from cart when remove button is clicked", async () => {
    // Arrange - cart with items (no async operations)
    const mockCart = [
      { _id: "prod1", name: "Product 1", price: 100, description: "Desc 1" },
      { _id: "prod2", name: "Product 2", price: 200, description: "Desc 2" },
    ];
    useCartMock[0] = mockCart;
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    await renderCartPage();

    // Act - click first remove button (synchronous)
    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    // Assert - verify setCart called with item removed (synchronous mock)
    expect(mockSetCart).toHaveBeenCalledWith([
      { _id: "prod2", name: "Product 2", price: 200, description: "Desc 2" },
    ]);
  });

  it("should update localStorage when item is removed", async () => {
    // Arrange (no async)
    const mockCart = [
      { _id: "prod1", name: "Product 1", price: 100, description: "Desc 1" },
    ];
    useCartMock[0] = mockCart;
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    await renderCartPage();

    // Act - remove the item
    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    // Assert - verify localStorage updated
    expect(localStorage.setItem).toHaveBeenCalledWith("cart", "[]");
  });

  // ===== ADDRESS DISPLAY BEHAVIORS =====
  // Testing Style: Output-based (conditional rendering)

  it("should display current address when user has address", async () => {
    // Arrange - user with address
    useAuthMock[0] = {
      user: { name: "John", address: "456 Oak Street" },
      token: "token",
    };
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    // Act
    await renderCartPage();

    // Assert
    expect(screen.getByText("Current Address")).toBeInTheDocument();
    expect(screen.getByText("456 Oak Street")).toBeInTheDocument();
  });

  it("should show update address button when authenticated", async () => {
    // Arrange
    useAuthMock[0] = {
      user: { name: "John", address: "123 Main" },
      token: "token",
    };
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    // Act
    await renderCartPage();

    // Assert
    expect(screen.getByText("Update Address")).toBeInTheDocument();
  });

  // ===== NAVIGATION BEHAVIORS =====
  // Testing Style: Communication-based (verify navigation calls)

  it("should navigate to profile when 'Update Address' clicked", async () => {
    // Arrange (no async)
    useAuthMock[0] = {
      user: { name: "John", address: "123 Main" },
      token: "token",
    };
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    await renderCartPage();

    // Act - click button (synchronous)
    const updateButton = screen.getByText("Update Address");
    fireEvent.click(updateButton);

    // Assert - verify navigation (synchronous mock)
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  it("should navigate to profile when user without address clicks 'Update Address'", async () => {
    // Arrange - authenticated user without address
    useAuthMock[0] = {
      user: { name: "John" }, // No address
      token: "token",
    };
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    await renderCartPage();

    // Act - click button
    const updateButton = screen.getByText("Update Address");
    fireEvent.click(updateButton);

    // Assert - verify navigation
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  it("should navigate to login with cart state when guest clicks login button", async () => {
    // Arrange - guest user (no async)
    useAuthMock[0] = null;
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    await renderCartPage();

    // Act - click login button
    const loginButton = screen.getByText(/Please Login to checkout/i);
    fireEvent.click(loginButton);

    // Assert - verify navigation with state
    expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
  });

  // ===== PAYMENT TOKEN BEHAVIOR =====
  // Testing Style: Communication-based (verify API interaction)

  it("should fetch payment token when component mounts with authenticated user", async () => {
    // Arrange
    useAuthMock[0] = {
      user: { name: "John" },
      token: "valid-token",
    };
    require("../context/auth").useAuth.mockReturnValue(useAuthMock);

    axios.get.mockResolvedValue({
      data: { clientToken: "braintree-token" },
    });

    // Act
    await renderCartPage();

    // Assert - verify API was called
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
  });

  // ===== PAYMENT UI DISPLAY BEHAVIOR =====
  // Testing Style: Output-based (conditional rendering based on state)

  it("should display payment button when all conditions are met", async () => {
    // Arrange - authenticated user with cart items and address
    useAuthMock[0] = {
      user: { name: "John", address: "123 Main St" },
      token: "valid-token",
    };
    useCartMock[0] = [
      { _id: "1", name: "Product", price: 100, description: "Test product" },
    ];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    axios.get.mockResolvedValue({
      data: { clientToken: "braintree-token" },
    });

    // Act
    await renderCartPage();

    // Assert - button appears after async operations complete
    await waitFor(
      () => expect(screen.getByText("Make Payment")).toBeInTheDocument(),
      { timeout: 500 },
    );
  });

  it("should not display payment drop-in when user has no address", async () => {
    // Arrange - user without address
    useAuthMock[0] = {
      user: { name: "John", address: null },
      token: "valid-token",
    };
    useCartMock[0] = [
      { _id: "1", name: "Product", price: 100, description: "Test product" },
    ];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    axios.get.mockResolvedValue({
      data: { clientToken: "braintree-token" },
    });

    // Act
    await renderCartPage();

    // Assert - payment button should be disabled
    await waitFor(
      () => {
        const buttons = screen.queryAllByText(/Make Payment/i);
        if (buttons.length > 0) {
          expect(buttons[0]).toBeDisabled();
        }
      },
      { timeout: 500 },
    );
  });

  it("should not display payment button when cart is empty", async () => {
    // Arrange - empty cart (no token fetch needed)
    useAuthMock[0] = {
      user: { name: "John", address: "123 Main" },
      token: "token",
    };
    useCartMock[0] = [];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    // Act
    await renderCartPage();

    // Assert - payment section should not be visible
    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
  });

  // ===== PAYMENT PROCESSING BEHAVIOR =====
  // Testing Style: Communication-based (verify API calls and state changes)

  it("should display 'Make Payment' button text when not processing", async () => {
    // Arrange
    useAuthMock[0] = {
      user: { name: "John", address: "123 Main" },
      token: "token",
    };
    useCartMock[0] = [
      { _id: "1", name: "Product", price: 100, description: "Test product" },
    ];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    axios.get.mockResolvedValue({
      data: { clientToken: "braintree-token" },
    });

    // Act
    await renderCartPage();

    // Assert - wait for button to appear after async token fetch
    await waitFor(
      () => expect(screen.getByText("Make Payment")).toBeInTheDocument(),
      { timeout: 500 },
    );
  });

  // ===== ERROR HANDLING TESTS =====
  // Testing Style: State-based (verify graceful error handling)

  it("should render page gracefully when payment token fetch fails", async () => {
    // Arrange
    useAuthMock[0] = {
      user: { name: "John", address: "123 Main" },
      token: "token",
    };
    useCartMock[0] = [
      { _id: "1", name: "Product", price: 100, description: "Test" },
    ];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    axios.get.mockRejectedValue(new Error("Token fetch failed"));

    // Act
    await renderCartPage();

    // Assert - component renders despite error, showing cart without payment option
    await waitFor(() => {
      expect(screen.getByText("Hello John")).toBeInTheDocument();
      expect(screen.getByText("Product")).toBeInTheDocument();
    });

    // Payment button should not appear when token fetch fails
    expect(screen.queryByText("Make Payment")).not.toBeInTheDocument();
  });

  it("should not modify cart when removeCartItem fails", async () => {
    // Arrange
    const cart = [
      { _id: "1", name: "Product", price: 100, description: "Test product" },
    ];

    // Mock findIndex to throw an error
    const originalFindIndex = Array.prototype.findIndex;
    Array.prototype.findIndex = jest.fn(() => {
      throw new Error("findIndex error");
    });

    useAuthMock[0] = { user: { name: "John" }, token: "token" };
    useCartMock[0] = cart;

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    axios.get.mockResolvedValue({ data: { clientToken: null } });

    // Act
    await renderCartPage();

    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);

    // Assert - cart should not be modified when error occurs
    expect(mockSetCart).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();

    // Cleanup
    Array.prototype.findIndex = originalFindIndex;
  });

  it("should render cart items even when price formatting fails", async () => {
    // Arrange
    // Mock toLocaleString to throw an error
    const originalToLocaleString = Number.prototype.toLocaleString;
    Number.prototype.toLocaleString = jest.fn(() => {
      throw new Error("toLocaleString error");
    });

    useAuthMock[0] = { user: { name: "John" }, token: "token" };
    useCartMock[0] = [
      { _id: "1", name: "Product", price: 100, description: "Test product" },
    ];

    require("../context/auth").useAuth.mockReturnValue(useAuthMock);
    require("../context/cart").useCart.mockReturnValue(useCartMock);

    axios.get.mockResolvedValue({ data: { clientToken: null } });

    // Act - rendering should trigger totalPrice calculation
    await renderCartPage();

    // Assert - component renders successfully with cart item visible
    expect(screen.getByText("Hello John")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    // Total price section still renders (even if formatting failed)
    expect(screen.getByText(/Cart Summary/i)).toBeInTheDocument();

    // Cleanup
    Number.prototype.toLocaleString = originalToLocaleString;
  });
});
