// Alyssa Ong, A0264663X
// Integration Tests for HomePage — Bottom-Up Approach
// Assisted with AI
//
// Bottom-Up Integration Strategy:
//   Level 1: HomePage + real CartProvider (cart context is the lowest shared-state dependency)
//   Level 2: HomePage + real CartProvider + real AuthProvider + real routing
//   Level 3: HomePage + CartProvider + AuthProvider + cross-page navigation
//
// What is REAL (integrated):
//   - CartProvider (context), AuthProvider (context), Prices (static data),
//     MemoryRouter / Routes (routing), localStorage (persistence)
//
// What is MOCKED (stubs at external boundaries):
//   - axios (API network boundary)
//   - Layout (shell — Header/Footer are not under test here)
//   - toast (side-effect boundary)
//   - antd Checkbox (simplified for DOM interaction)

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";

import HomePage from "./HomePage";
import { AuthProvider } from "../context/auth";
import { CartProvider, useCart } from "../context/cart";
import { Prices } from "../components/Prices";

// --- Mocks (external boundaries only) ---

jest.mock("axios");

jest.mock("../components/Layout", () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("antd", () => ({
  Checkbox: ({ children, onChange }) => (
    <label>
      <input type="checkbox" onChange={onChange} />
      {children}
    </label>
  ),
}));

// --- Test data factories ---

const buildProduct = (overrides = {}) => ({
  _id: "prod-1",
  name: "Mechanical Keyboard",
  slug: "mechanical-keyboard",
  description: "A premium mechanical keyboard with RGB lighting and fast switches",
  price: 150,
  category: { _id: "cat-1", name: "Electronics" },
  ...overrides,
});

const buildCategories = () => [
  { _id: "cat-1", name: "Electronics" },
  { _id: "cat-2", name: "Books" },
];

// --- Helpers ---

const seedAuth = (authObj) => {
  if (!authObj) {
    localStorage.removeItem("auth");
    return;
  }
  localStorage.setItem("auth", JSON.stringify(authObj));
};

const seedCart = (products) => {
  localStorage.setItem("cart", JSON.stringify(products || []));
};

// A tiny probe component that reads real cart context and displays count
const CartProbe = () => {
  const [cart] = useCart();
  return <div data-testid="cart-probe">{cart.length}</div>;
};

// Default axios mock setup
const setupDefaultAxios = (products = [buildProduct()], total = 5) => {
  axios.get.mockImplementation((url) => {
    if (url.includes("/get-category")) {
      return Promise.resolve({
        data: { success: true, category: buildCategories() },
      });
    }
    if (url.includes("/product-count")) {
      return Promise.resolve({ data: { total } });
    }
    if (url.includes("/product-list")) {
      return Promise.resolve({ data: { products } });
    }
    return Promise.resolve({ data: {} });
  });
  axios.post.mockResolvedValue({ data: { products: [] } });
};

// ============================================================
// LEVEL 1: HomePage + Real CartProvider
// Foundation layer — verifies that HomePage correctly integrates
// with the real CartContext for shared state management.
// The CartProvider is NOT mocked; data flows through the real
// context and localStorage persistence layer.
// ============================================================

describe("Level 1: HomePage + CartProvider Integration", () => {
  const renderLevel1 = (initialCart = []) => {
    seedCart(initialCart);
    return render(
      <MemoryRouter>
        <CartProvider>
          <HomePage />
          <CartProbe />
        </CartProvider>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setupDefaultAxios();
  });

  it("adds a product to real cart context when ADD TO CART is clicked", async () => {
    renderLevel1();

    await waitFor(() => {
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    // CartProbe reads from real CartProvider — should now show 1 item
    expect(screen.getByTestId("cart-probe")).toHaveTextContent("1");
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("persists added product to localStorage via real CartProvider", async () => {
    renderLevel1();

    await waitFor(() => {
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    const persisted = JSON.parse(localStorage.getItem("cart"));
    expect(persisted).toHaveLength(1);
    expect(persisted[0].name).toBe("Mechanical Keyboard");
  });

  it("accumulates multiple products in real cart context", async () => {
    setupDefaultAxios([
      buildProduct({ _id: "p1", name: "Keyboard", slug: "keyboard" }),
      buildProduct({ _id: "p2", name: "Mouse", slug: "mouse", price: 60 }),
    ]);

    renderLevel1();

    await waitFor(() => {
      expect(screen.getByText("Keyboard")).toBeInTheDocument();
      expect(screen.getByText("Mouse")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: "ADD TO CART" });
    fireEvent.click(addButtons[0]); // add Keyboard
    fireEvent.click(addButtons[1]); // add Mouse

    expect(screen.getByTestId("cart-probe")).toHaveTextContent("2");

    const persisted = JSON.parse(localStorage.getItem("cart"));
    expect(persisted).toHaveLength(2);
    expect(persisted.map((p) => p.name)).toEqual(["Keyboard", "Mouse"]);
  });

  it("hydrates existing cart items from localStorage on mount", async () => {
    const existing = [
      buildProduct({ _id: "existing-1", name: "Pre-existing Item" }),
    ];

    renderLevel1(existing);

    await waitFor(() => {
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    });

    // CartProbe should show 1 item from localStorage hydration
    expect(screen.getByTestId("cart-probe")).toHaveTextContent("1");
  });

  it("appends to existing cart items when adding a new product", async () => {
    const existing = [
      buildProduct({ _id: "existing-1", name: "Pre-existing Item" }),
    ];

    renderLevel1(existing);

    await waitFor(() => {
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    // Real CartProvider should now have 2 items (1 hydrated + 1 added)
    expect(screen.getByTestId("cart-probe")).toHaveTextContent("2");

    const persisted = JSON.parse(localStorage.getItem("cart"));
    expect(persisted).toHaveLength(2);
  });

  it("renders price filter options from real Prices data", async () => {
    renderLevel1();

    await waitFor(() => {
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
    });

    // Verify all price ranges from real Prices array render
    Prices.forEach((p) => {
      expect(screen.getByText(p.name)).toBeInTheDocument();
    });
  });
});

// ============================================================
// LEVEL 2: HomePage + CartProvider + AuthProvider + Routing
// Mid layer — adds real AuthProvider and MemoryRouter routing.
// Tests data flow through auth context and navigation between
// routes, while still using real CartProvider.
// ============================================================

describe("Level 2: HomePage + CartProvider + AuthProvider + Routing Integration", () => {
  const ProductDetailsStub = () => <div>Product Details Page</div>;

  const renderLevel2 = (initialRoute = "/", initialCart = []) => {
    seedCart(initialCart);
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:slug" element={<ProductDetailsStub />} />
            </Routes>
            <CartProbe />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setupDefaultAxios();
  });

  it("navigates to product details page via real router when More Details is clicked", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "More Details" }));

    expect(await screen.findByText("Product Details Page")).toBeInTheDocument();
  });

  it("passes correct page title to Layout", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(screen.getByTestId("layout")).toHaveAttribute(
        "data-title",
        "ALL Products - Best offers ",
      );
    });
  });

  it("fetches categories and products on mount via real lifecycle", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

  it("renders categories from API as filter checkboxes", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
  });

  it("sends filter request when a category checkbox is toggled", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Electronics"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["cat-1"]),
        }),
      );
    });
  });

  it("sends filter request with price range when a price checkbox is toggled", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("$0 to 19"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          radio: expect.arrayContaining([[0, 19.99]]),
        }),
      );
    });
  });

  it("replaces displayed products with filtered results", async () => {
    axios.post.mockResolvedValue({
      data: {
        products: [
          buildProduct({
            _id: "filtered-1",
            name: "Filtered Gadget",
            slug: "filtered-gadget",
            price: 30,
          }),
        ],
      },
    });

    renderLevel2();

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Electronics"));

    await waitFor(() => {
      expect(screen.getByText("Filtered Gadget")).toBeInTheDocument();
      expect(screen.queryByText("Mechanical Keyboard")).not.toBeInTheDocument();
    });
  });

  it("displays product prices in USD currency format", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(screen.getByText("$150.00")).toBeInTheDocument();
    });
  });

  it("displays truncated product descriptions", async () => {
    renderLevel2();

    await waitFor(() => {
      expect(
        screen.getByText(/A premium mechanical keyboard with RGB lighting and/i),
      ).toBeInTheDocument();
    });
  });
});

// ============================================================
// LEVEL 3: HomePage + CartProvider + AuthProvider + Pagination
// Higher layer — tests the load-more pagination flow, which
// integrates component state, real cart context, and API calls
// across multiple page loads.
// ============================================================

describe("Level 3: HomePage Pagination + Cart + Auth Integration", () => {
  const renderLevel3 = (initialCart = []) => {
    seedCart(initialCart);
    return render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <HomePage />
            <CartProbe />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("shows Loadmore button when displayed products are fewer than total", async () => {
    setupDefaultAxios(
      [buildProduct({ _id: "p1", name: "Item 1" })],
      10, // total > displayed
    );

    renderLevel3();

    await waitFor(() => {
      expect(screen.getByText(/Loadmore/i)).toBeInTheDocument();
    });
  });

  it("hides Loadmore button when all products are displayed", async () => {
    setupDefaultAxios(
      [buildProduct({ _id: "p1", name: "Item 1" })],
      1, // total === displayed
    );

    renderLevel3();

    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Loadmore/i)).not.toBeInTheDocument();
  });

  it("loads and appends page 2 products when Loadmore is clicked", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({
          data: { success: true, category: buildCategories() },
        });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      }
      if (url.includes("/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [buildProduct({ _id: "p1", name: "Page 1 Item" })],
          },
        });
      }
      if (url.includes("/product-list/2")) {
        return Promise.resolve({
          data: {
            products: [
              buildProduct({ _id: "p2", name: "Page 2 Item", price: 99 }),
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { products: [] } });

    renderLevel3();

    await waitFor(() => {
      expect(screen.getByText("Page 1 Item")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Loadmore/i));

    await waitFor(() => {
      expect(screen.getByText("Page 2 Item")).toBeInTheDocument();
      // Page 1 items still visible
      expect(screen.getByText("Page 1 Item")).toBeInTheDocument();
    });
  });

  it("can add to cart from both page 1 and page 2 products", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({
          data: { success: true, category: [] },
        });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      }
      if (url.includes("/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [
              buildProduct({ _id: "p1", name: "Item A", slug: "item-a" }),
            ],
          },
        });
      }
      if (url.includes("/product-list/2")) {
        return Promise.resolve({
          data: {
            products: [
              buildProduct({
                _id: "p2",
                name: "Item B",
                slug: "item-b",
                price: 75,
              }),
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { products: [] } });

    renderLevel3();

    await waitFor(() => {
      expect(screen.getByText("Item A")).toBeInTheDocument();
    });

    // Add page 1 item to cart
    fireEvent.click(screen.getAllByRole("button", { name: "ADD TO CART" })[0]);
    expect(screen.getByTestId("cart-probe")).toHaveTextContent("1");

    // Load page 2
    fireEvent.click(screen.getByText(/Loadmore/i));

    await waitFor(() => {
      expect(screen.getByText("Item B")).toBeInTheDocument();
    });

    // Add page 2 item to cart
    const addButtons = screen.getAllByRole("button", { name: "ADD TO CART" });
    fireEvent.click(addButtons[addButtons.length - 1]);

    expect(screen.getByTestId("cart-probe")).toHaveTextContent("2");

    const persisted = JSON.parse(localStorage.getItem("cart"));
    expect(persisted).toHaveLength(2);
    expect(persisted.map((p) => p.name)).toEqual(["Item A", "Item B"]);
  });

  it("handles category API failure gracefully while still rendering products", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.reject(new Error("Category API down"));
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 1 } });
      }
      if (url.includes("/product-list")) {
        return Promise.resolve({
          data: { products: [buildProduct()] },
        });
      }
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { products: [] } });

    renderLevel3();

    await waitFor(() => {
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });
  });

  it("handles product list API failure gracefully", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({
          data: { success: true, category: [] },
        });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 0 } });
      }
      if (url.includes("/product-list")) {
        return Promise.reject(new Error("Product API down"));
      }
      return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { products: [] } });

    renderLevel3();

    await waitFor(() => {
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });

    // No crash, no products displayed
    expect(screen.queryByRole("button", { name: "ADD TO CART" })).not.toBeInTheDocument();
  });

  it("handles filter API failure gracefully without crashing", async () => {
    setupDefaultAxios();
    axios.post.mockRejectedValue(new Error("Filter API down"));

    renderLevel3();

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Electronics"));

    // Page should not crash
    await waitFor(() => {
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });
  });
});
