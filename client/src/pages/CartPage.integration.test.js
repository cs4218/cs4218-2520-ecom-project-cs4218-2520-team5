// Alyssa Ong, A0264663X
// Assisted with AI

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";

import CartPage from "./CartPage";
import HomePage from "./HomePage";
import ProductDetails from "./ProductDetails";
import Search from "./Search";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";

jest.mock("axios");

let mockDropInInstance;
let mockSearchState = { keyword: "", results: [] };

jest.mock("../context/search", () => ({
  useSearch: () => [mockSearchState, jest.fn()],
}));

jest.mock("antd", () => ({
  Checkbox: ({ children, onChange }) => (
    <label>
      <input type="checkbox" onChange={onChange} />
      {children}
    </label>
  ),
}));

// Keep CartPage logic real while isolating global shell noise.
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock("braintree-web-drop-in-react", () => {
  const ReactLocal = require("react");

  return function MockDropIn({ onInstance }) {
    ReactLocal.useEffect(() => {
      if (onInstance) onInstance(mockDropInInstance);
    }, [onInstance]);

    return <div data-testid="dropin" />;
  };
});

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const buildProduct = (overrides = {}) => ({
  _id: "prod-1",
  name: "Keyboard",
  description: "Mechanical keyboard for integration checks",
  price: 120,
  ...overrides,
});

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

const LoginRouteProbe = () => {
  const location = useLocation();
  return (
    <div>
      <div>Login Route</div>
      <div data-testid="login-state">{JSON.stringify(location.state)}</div>
    </div>
  );
};

const renderCartIntegration = (initialRoute = "/cart") =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/dashboard/user/profile"
              element={<div>Profile Route</div>}
            />
            <Route
              path="/dashboard/user/orders"
              element={<div>Orders Route</div>}
            />
            <Route path="/login" element={<LoginRouteProbe />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

const FlowNavigator = () => {
  const { useNavigate } = require("react-router-dom");
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate("/")}>Go Home</button>
      <button onClick={() => navigate("/product/keyboard-pro")}>
        Go Product
      </button>
      <button onClick={() => navigate("/search")}>Go Search</button>
      <button onClick={() => navigate("/cart")}>Go Cart</button>
    </div>
  );
};

const renderCrossComponentFlow = (initialRoute = "/") =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <CartProvider>
          <FlowNavigator />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/search" element={<Search />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("CartPage integration - shared state and routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockDropInInstance = {
      requestPaymentMethod: jest
        .fn()
        .mockResolvedValue({ nonce: "phase-a-nonce" }),
    };

    axios.get.mockResolvedValue({ data: { clientToken: null } });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  it("renders guest state with empty-cart message", async () => {
    seedAuth(null);
    seedCart([]);

    renderCartIntegration();

    expect(await screen.findByText(/Hello Guest/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Cart Is Empty/i)).toBeInTheDocument();
  });

  it("renders login prompt for guest with existing cart items", async () => {
    seedAuth(null);
    seedCart([buildProduct()]);

    renderCartIntegration();

    expect(
      await screen.findByText(/You Have 1 items in your cart/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Please Login to checkout/i }),
    ).toBeInTheDocument();
  });

  it("renders authenticated greeting from real auth context", async () => {
    seedAuth({
      token: "auth-token",
      user: { name: "Alyssa User", email: "alyssa@test.com" },
    });
    seedCart([]);

    renderCartIntegration();

    expect(await screen.findByText(/Hello\s+Alyssa User/i)).toBeInTheDocument();
  });

  it("hydrates cart from localStorage and renders item count", async () => {
    seedAuth(null);
    seedCart([buildProduct(), buildProduct({ _id: "prod-2", name: "Mouse" })]);

    renderCartIntegration();

    expect(
      await screen.findByText(/You Have 2 items in your cart/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Mouse")).toBeInTheDocument();
  });

  it("computes and renders total price for hydrated cart", async () => {
    seedAuth(null);
    seedCart([
      buildProduct({ _id: "prod-1", price: 100 }),
      buildProduct({ _id: "prod-2", name: "Headset", price: 250 }),
      buildProduct({ _id: "prod-3", name: "Mic", price: 50 }),
    ]);

    renderCartIntegration();

    expect(await screen.findByText(/Headset/i)).toBeInTheDocument();
    expect(screen.getByText(/Total\s*:\s*\$400\.00/i)).toBeInTheDocument();
  });

  it("removes first item and persists updated cart", async () => {
    seedAuth(null);
    seedCart([
      buildProduct({ _id: "prod-1", name: "Keyboard" }),
      buildProduct({ _id: "prod-2", name: "Mouse" }),
    ]);

    renderCartIntegration();

    expect(await screen.findByText("Keyboard")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    await waitFor(() => {
      expect(screen.queryByText("Keyboard")).not.toBeInTheDocument();
      expect(screen.getByText("Mouse")).toBeInTheDocument();
    });

    const persisted = JSON.parse(localStorage.getItem("cart"));
    expect(persisted).toHaveLength(1);
    expect(persisted[0]._id).toBe("prod-2");
  });

  it("removes middle item from three-item cart", async () => {
    seedAuth(null);
    seedCart([
      buildProduct({ _id: "prod-1", name: "Keyboard" }),
      buildProduct({ _id: "prod-2", name: "Mouse" }),
      buildProduct({ _id: "prod-3", name: "Monitor" }),
    ]);

    renderCartIntegration();

    expect(await screen.findByText("Monitor")).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[1]);

    await waitFor(() => {
      expect(screen.queryByText("Mouse")).not.toBeInTheDocument();
      expect(screen.getByText("Keyboard")).toBeInTheDocument();
      expect(screen.getByText("Monitor")).toBeInTheDocument();
    });

    const persisted = JSON.parse(localStorage.getItem("cart"));
    expect(persisted.map((p) => p._id)).toEqual(["prod-1", "prod-3"]);
  });

  it("removing the only item transitions to empty-cart state", async () => {
    seedAuth(null);
    seedCart([buildProduct({ _id: "single", name: "Single Item" })]);

    renderCartIntegration();

    expect(await screen.findByText("Single Item")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.getByText(/Your Cart Is Empty/i)).toBeInTheDocument();
    });
  });

  it("shows current address block for authenticated user with address", async () => {
    seedAuth({
      token: "auth-token",
      user: {
        name: "Address User",
        email: "address@test.com",
        address: "123 Integration Street",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    expect(await screen.findByText("Current Address")).toBeInTheDocument();
    expect(screen.getByText("123 Integration Street")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update Address" }),
    ).toBeInTheDocument();
  });

  it("shows update-address CTA when authenticated user has no address", async () => {
    seedAuth({
      token: "auth-token",
      user: { name: "No Address User", email: "no-address@test.com" },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    expect(
      await screen.findByText(/Hello\s+No Address User/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update Address" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Current Address")).not.toBeInTheDocument();
  });

  it("routes to profile page from update-address button", async () => {
    seedAuth({
      token: "auth-token",
      user: {
        name: "Profile Nav User",
        email: "profile-nav@test.com",
        address: "987 Route Street",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    fireEvent.click(
      await screen.findByRole("button", { name: "Update Address" }),
    );

    expect(await screen.findByText("Profile Route")).toBeInTheDocument();
  });

  it("routes guest to login with return-state /cart", async () => {
    seedAuth(null);
    seedCart([buildProduct()]);

    renderCartIntegration();

    fireEvent.click(
      await screen.findByRole("button", { name: /Please Login to checkout/i }),
    );

    expect(await screen.findByText("Login Route")).toBeInTheDocument();
    expect(screen.getByTestId("login-state")).toHaveTextContent("/cart");
  });

  it("invokes braintree token fetch on mount as part of real page lifecycle", async () => {
    seedAuth({
      token: "auth-token",
      user: { name: "Token User", email: "token@test.com", address: "A" },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
  });

  it("shows item card data after hydration (name, description snippet, and price)", async () => {
    seedAuth(null);
    seedCart([
      buildProduct({
        _id: "prod-visual",
        name: "Camera",
        description:
          "Capture moments with high dynamic range and stable autofocus",
        price: 899,
      }),
    ]);

    renderCartIntegration();

    expect(await screen.findByText("Camera")).toBeInTheDocument();
    expect(
      screen.getByText(/Capture moments with high dyna/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Price\s*:\s*899/i)).toBeInTheDocument();
  });
});

describe("CartPage integration - payment boundary and checkout flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockDropInInstance = {
      requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "nonce-123" }),
    };

    axios.get.mockResolvedValue({ data: { clientToken: "client-token-123" } });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  it("hides payment controls when token is unavailable", async () => {
    axios.get.mockResolvedValue({ data: { clientToken: null } });

    seedAuth({
      token: "auth-token",
      user: {
        name: "Tokenless User",
        email: "tokenless@test.com",
        address: "Addr",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    expect(await screen.findByText("Keyboard")).toBeInTheDocument();
    expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Make Payment" }),
    ).not.toBeInTheDocument();
  });

  it("hides payment controls when cart is empty even with valid token", async () => {
    seedAuth({
      token: "auth-token",
      user: {
        name: "Empty Cart User",
        email: "empty@test.com",
        address: "Addr",
      },
    });
    seedCart([]);

    renderCartIntegration();

    expect(await screen.findByText(/Your Cart Is Empty/i)).toBeInTheDocument();
    expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Make Payment" }),
    ).not.toBeInTheDocument();
  });

  it("hides payment controls for guest users even when token endpoint resolves", async () => {
    seedAuth(null);
    seedCart([buildProduct()]);

    renderCartIntegration();

    expect(await screen.findByText(/Hello Guest/i)).toBeInTheDocument();
    expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Make Payment" }),
    ).not.toBeInTheDocument();
  });

  it("renders payment button disabled when user has no address", async () => {
    seedAuth({
      token: "auth-token",
      user: { name: "No Address", email: "no-address@test.com" },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    const paymentButton = await screen.findByRole("button", {
      name: "Make Payment",
    });
    expect(paymentButton).toBeDisabled();
  });

  it("renders payment button enabled when token, cart, instance, and address are available", async () => {
    seedAuth({
      token: "auth-token",
      user: {
        name: "Ready User",
        email: "ready@test.com",
        address: "Payment Address",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    const paymentButton = await screen.findByRole("button", {
      name: "Make Payment",
    });
    expect(paymentButton).toBeEnabled();
  });

  it("completes payment flow and clears cart, then routes to orders", async () => {
    seedAuth({
      token: "auth-token",
      user: {
        name: "Checkout User",
        email: "checkout@test.com",
        address: "Checkout Address",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    const paymentButton = await screen.findByRole("button", {
      name: "Make Payment",
    });
    fireEvent.click(paymentButton);

    await waitFor(() => {
      expect(mockDropInInstance.requestPaymentMethod).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        expect.objectContaining({
          nonce: "nonce-123",
          cart: expect.arrayContaining([
            expect.objectContaining({ _id: "prod-1" }),
          ]),
        }),
      );
    });

    expect(await screen.findByText("Orders Route")).toBeInTheDocument();
    expect(localStorage.getItem("cart")).toBeNull();
    expect(toast.success).toHaveBeenCalledWith(
      "Payment Completed Successfully ",
    );
  });

  it("keeps cart state and stays on cart page when payment API fails", async () => {
    axios.post.mockRejectedValue(new Error("payment transport error"));

    seedAuth({
      token: "auth-token",
      user: {
        name: "Failing API User",
        email: "fail-api@test.com",
        address: "Fail Address",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    fireEvent.click(
      await screen.findByRole("button", { name: "Make Payment" }),
    );

    await waitFor(() => {
      expect(mockDropInInstance.requestPaymentMethod).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText("Orders Route")).not.toBeInTheDocument();
    expect(screen.getByText("Keyboard")).toBeInTheDocument();
    expect(localStorage.getItem("cart")).not.toBeNull();
  });

  it("does not post payment when nonce request fails", async () => {
    mockDropInInstance = {
      requestPaymentMethod: jest
        .fn()
        .mockRejectedValue(new Error("nonce failed")),
    };

    seedAuth({
      token: "auth-token",
      user: {
        name: "Nonce Fail User",
        email: "nonce-fail@test.com",
        address: "Nonce Address",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    fireEvent.click(
      await screen.findByRole("button", { name: "Make Payment" }),
    );

    await waitFor(() => {
      expect(mockDropInInstance.requestPaymentMethod).toHaveBeenCalledTimes(1);
    });

    expect(axios.post).not.toHaveBeenCalled();
    expect(screen.queryByText("Orders Route")).not.toBeInTheDocument();
    expect(screen.getByText("Keyboard")).toBeInTheDocument();
  });

  it("shows loading state while payment request is in progress", async () => {
    let resolvePayment;
    const paymentPromise = new Promise((resolve) => {
      resolvePayment = resolve;
    });
    axios.post.mockReturnValue(paymentPromise);

    seedAuth({
      token: "auth-token",
      user: {
        name: "Loading User",
        email: "loading@test.com",
        address: "Loading Address",
      },
    });
    seedCart([buildProduct()]);

    renderCartIntegration();

    fireEvent.click(
      await screen.findByRole("button", { name: "Make Payment" }),
    );

    expect(
      await screen.findByRole("button", { name: /Processing/i }),
    ).toBeDisabled();

    resolvePayment({ data: { success: true } });

    expect(await screen.findByText("Orders Route")).toBeInTheDocument();
  });
});

describe("CartPage integration - cross-component flows", () => {
  const homeProduct = {
    _id: "home-1",
    slug: "home-keyboard",
    name: "Home Keyboard",
    description: "Home page keyboard description for flow tests",
    price: 200,
    category: { _id: "cat-1", name: "Peripherals" },
  };

  const detailsProduct = {
    _id: "details-1",
    slug: "keyboard-pro",
    name: "Detail Keyboard",
    description: "Product details keyboard description for cart integration",
    price: 350,
    category: { _id: "cat-1", name: "Peripherals" },
  };

  const searchProduct = {
    _id: "search-1",
    slug: "search-mouse",
    name: "Search Mouse",
    description: "Search result mouse description",
    price: 90,
    category: { _id: "cat-2", name: "Accessories" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockSearchState = { keyword: "mouse", results: [searchProduct] };
    mockDropInInstance = {
      requestPaymentMethod: jest
        .fn()
        .mockResolvedValue({ nonce: "phase-c-nonce" }),
    };

    axios.post.mockResolvedValue({ data: { success: true } });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: {
            success: true,
            category: [{ _id: "cat-1", name: "Peripherals" }],
          },
        });
      }
      if (url === "/api/v1/product/product-count") {
        return Promise.resolve({ data: { total: 1 } });
      }
      if (url === "/api/v1/product/product-list/1") {
        return Promise.resolve({ data: { products: [homeProduct] } });
      }
      if (url === "/api/v1/product/get-product/keyboard-pro") {
        return Promise.resolve({ data: { product: detailsProduct } });
      }
      if (url === "/api/v1/product/related-product/details-1/cat-1") {
        return Promise.resolve({ data: { products: [] } });
      }
      if (url === "/api/v1/product/braintree/token") {
        return Promise.resolve({ data: { clientToken: null } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("adds item from HomePage and reflects it in CartPage", async () => {
    seedAuth(null);
    seedCart([]);

    renderCrossComponentFlow("/");

    expect(await screen.findByText("Home Keyboard")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));
    fireEvent.click(screen.getByRole("button", { name: "Go Cart" }));

    expect(
      await screen.findByText(/You Have 1 items in your cart/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Home Keyboard")).toBeInTheDocument();
    expect(screen.getByText(/Total\s*:\s*\$200\.00/i)).toBeInTheDocument();
  });

  it("adds item from ProductDetails and reflects it in CartPage", async () => {
    seedAuth(null);
    seedCart([]);

    renderCrossComponentFlow("/product/keyboard-pro");

    expect(
      await screen.findByText(/Name\s*:\s*Detail Keyboard/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));
    fireEvent.click(screen.getByRole("button", { name: "Go Cart" }));

    expect(await screen.findByText("Detail Keyboard")).toBeInTheDocument();
    expect(screen.getByText(/Total\s*:\s*\$350\.00/i)).toBeInTheDocument();
  });

  it("adds item from Search page and reflects it in CartPage", async () => {
    seedAuth(null);
    seedCart([]);

    renderCrossComponentFlow("/search");

    expect(await screen.findByText("Search Mouse")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));
    fireEvent.click(screen.getByRole("button", { name: "Go Cart" }));

    expect(await screen.findByText("Search Mouse")).toBeInTheDocument();
    expect(screen.getByText(/Total\s*:\s*\$90\.00/i)).toBeInTheDocument();
  });

  it("aggregates cart items added from HomePage and ProductDetails", async () => {
    seedAuth(null);
    seedCart([]);

    renderCrossComponentFlow("/");

    expect(await screen.findByText("Home Keyboard")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    fireEvent.click(screen.getByRole("button", { name: "Go Product" }));
    expect(
      await screen.findByText(/Name\s*:\s*Detail Keyboard/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    fireEvent.click(screen.getByRole("button", { name: "Go Cart" }));

    expect(await screen.findByText("Home Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Detail Keyboard")).toBeInTheDocument();
    expect(
      screen.getByText(/You Have 2 items in your cart/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Total\s*:\s*\$550\.00/i)).toBeInTheDocument();
  });

  it("uses shared CartProvider state when navigating Home -> Search -> Cart", async () => {
    seedAuth(null);
    seedCart([]);

    renderCrossComponentFlow("/");

    expect(await screen.findByText("Home Keyboard")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    fireEvent.click(screen.getByRole("button", { name: "Go Search" }));
    expect(await screen.findByText("Search Mouse")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ADD TO CART" }));

    fireEvent.click(screen.getByRole("button", { name: "Go Cart" }));

    expect(await screen.findByText("Home Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Search Mouse")).toBeInTheDocument();
    expect(screen.getByText(/Total\s*:\s*\$290\.00/i)).toBeInTheDocument();
  });
});
