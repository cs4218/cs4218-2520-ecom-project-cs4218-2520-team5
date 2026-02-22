// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen, renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

describe("CartProvider", () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        }),
        removeItem: jest.fn((key) => {
          delete store[key];
        }),
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================
  // Initial State Tests
  // ============================================

  test("should initialize with empty cart when localStorage is empty", () => {
    // Arrange
    // localStorage is already empty from beforeEach

    // Act
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toEqual([]);
  });

  test("should load cart from localStorage on mount", () => {
    // Arrange
    const savedCart = [
      { id: 1, name: "Product 1", price: 100 },
      { id: 2, name: "Product 2", price: 200 },
    ];
    localStorageMock.setItem("cart", JSON.stringify(savedCart));

    // Act
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toEqual(savedCart);
  });

  test("should initialize with empty cart when localStorage has invalid JSON", () => {
    // Arrange
    localStorageMock.setItem("cart", "invalid-json{{{");

    // Act
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toEqual([]);
  });

  test("should initialize with empty cart when localStorage throws error", () => {
    // Arrange
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("Storage quota exceeded");
    });

    // Act
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toEqual([]);
  });

  // ============================================
  // State Update Tests
  // ============================================

  test("should update cart state when setCart is called", () => {
    // Arrange
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });
    const newCart = [{ id: 1, name: "New Product", price: 150 }];

    // Act
    act(() => {
      const [, setCart] = result.current;
      setCart(newCart);
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toEqual(newCart);
  });

  test("should update cart by adding new item to existing cart", () => {
    // Arrange
    const initialCart = [{ id: 1, name: "Product 1", price: 100 }];
    localStorageMock.setItem("cart", JSON.stringify(initialCart));
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Act
    act(() => {
      const [cart, setCart] = result.current;
      setCart([...cart, { id: 2, name: "Product 2", price: 200 }]);
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toHaveLength(2);
    expect(cart[1]).toEqual({ id: 2, name: "Product 2", price: 200 });
  });

  test("should update cart by removing an item", () => {
    // Arrange
    const initialCart = [
      { id: 1, name: "Product 1", price: 100 },
      { id: 2, name: "Product 2", price: 200 },
    ];
    localStorageMock.setItem("cart", JSON.stringify(initialCart));
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Act
    act(() => {
      const [cart, setCart] = result.current;
      setCart(cart.filter((item) => item.id !== 1));
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toHaveLength(1);
    expect(cart[0]).toEqual({ id: 2, name: "Product 2", price: 200 });
  });

  test("should clear cart when setCart is called with empty array", () => {
    // Arrange
    const initialCart = [{ id: 1, name: "Product 1", price: 100 }];
    localStorageMock.setItem("cart", JSON.stringify(initialCart));
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Act
    act(() => {
      const [, setCart] = result.current;
      setCart([]);
    });

    // Assert
    const [cart] = result.current;
    expect(cart).toEqual([]);
  });

  // ============================================
  // Context Usage Tests
  // ============================================

  test("should return array with cart state and setter when properly wrapped", () => {
    // Arrange & Act
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    // Assert
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(2);
    expect(Array.isArray(result.current[0])).toBe(true);
    expect(typeof result.current[1]).toBe("function");
  });

  // ============================================
  // Children Rendering Tests
  // ============================================

  test("should render children components correctly", () => {
    // Arrange
    const TestChild = () => <div>Test Child Component</div>;

    // Act
    render(
      <CartProvider>
        <TestChild />
      </CartProvider>,
    );

    // Assert
    expect(screen.getByText("Test Child Component")).toBeInTheDocument();
  });

  test("should provide context value to multiple children", () => {
    // Arrange
    const TestChild1 = () => {
      const [cart] = useCart();
      return <div>Cart Items: {cart.length}</div>;
    };
    const TestChild2 = () => {
      const [cart] = useCart();
      return <div>Total: {cart.length} items</div>;
    };

    // Act
    render(
      <CartProvider>
        <TestChild1 />
        <TestChild2 />
      </CartProvider>,
    );

    // Assert
    expect(screen.getByText("Cart Items: 0")).toBeInTheDocument();
    expect(screen.getByText("Total: 0 items")).toBeInTheDocument();
  });
});
