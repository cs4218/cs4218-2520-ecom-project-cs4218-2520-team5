// Alyssa Ong, A0264663X
// Integration Tests for Admin Users Page — Bottom-Up Approach
// Assisted with AI
//
// Bottom-Up Integration Strategy:
//   Level 1: Users + real AdminMenu (lowest integration — menu renders inside page)
//   Level 2: Users + real AdminMenu + real AuthProvider + CartProvider + full routing
//
// What is REAL (integrated):
//   - AdminMenu (component with real NavLinks — NOT mocked like in unit test)
//   - AuthProvider, CartProvider (shared context providers)
//   - MemoryRouter with Routes (real routing and navigation)
//
// What is MOCKED (stubs at external boundaries):
//   - Layout (page shell stub — isolates Header/Footer)
//   - react-hot-toast (side-effect boundary)
//
// Contrast with unit test (Users.test.js):
//   Unit test mocks BOTH AdminMenu and Layout, testing Users in complete isolation.
//   Integration tests use REAL AdminMenu and real context providers to verify
//   components work together through their actual interfaces.

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

import Users from "./Users";
import { AuthProvider, useAuth } from "../../context/auth";
import { CartProvider, useCart } from "../../context/cart";

// --- Mocks (external boundaries only) ---

// Layout is stubbed as a boundary — passes through children and exposes title
jest.mock("../../components/Layout", () => {
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

const adminUser = {
  token: "admin-token-123",
  user: {
    name: "Admin User",
    email: "admin@test.com",
    role: 1,
    address: "123 Admin Street",
  },
};

const regularUser = {
  token: "user-token-456",
  user: {
    name: "Regular User",
    email: "user@test.com",
    role: 0,
    address: "456 User Lane",
  },
};

// Probe component that reads real AuthContext and displays auth state
const AuthProbe = () => {
  const [auth] = useAuth();
  return (
    <div data-testid="auth-probe">
      {auth?.user ? auth.user.name : "guest"}
    </div>
  );
};

// Probe component that reads real CartContext and displays cart count
const CartProbe = () => {
  const [cart] = useCart();
  return <div data-testid="cart-probe">{cart.length}</div>;
};

// ============================================================
// LEVEL 1: Users + Real AdminMenu
// Foundation layer — verifies that the Users page correctly
// integrates with the real AdminMenu component. AdminMenu is
// NOT mocked (unlike the unit test), so real NavLinks render
// and real navigation occurs.
// ============================================================

describe("Level 1: Users + AdminMenu Integration", () => {
  const renderLevel1 = () =>
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Users />
      </MemoryRouter>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders real AdminMenu with Admin Panel heading inside Users page", () => {
    renderLevel1();

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    expect(screen.getByText("All Users")).toBeInTheDocument();
  });

  it("renders all admin navigation links from real AdminMenu", () => {
    renderLevel1();

    expect(screen.getByText("Create Category")).toBeInTheDocument();
    expect(screen.getByText("Create Product")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("admin navigation links point to correct route paths", () => {
    renderLevel1();

    expect(screen.getByText("Create Category").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category",
    );
    expect(screen.getByText("Create Product").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product",
    );
    expect(screen.getByText("Products").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/products",
    );
    expect(screen.getByText("Orders").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/orders",
    );
  });

  it("passes correct title to Layout via props", () => {
    renderLevel1();

    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Dashboard - All Users",
    );
  });

  it("renders AdminMenu and page content within the same Layout container", () => {
    renderLevel1();

    const layout = screen.getByTestId("layout");
    expect(within(layout).getByText("Admin Panel")).toBeInTheDocument();
    expect(within(layout).getByText("All Users")).toBeInTheDocument();
  });

  it("navigates to Create Category page via real AdminMenu link", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
          <Route
            path="/dashboard/admin/create-category"
            element={<div>Create Category Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Create Category"));

    expect(screen.getByText("Create Category Page")).toBeInTheDocument();
  });

  it("navigates to Create Product page via real AdminMenu link", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
          <Route
            path="/dashboard/admin/create-product"
            element={<div>Create Product Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Create Product"));

    expect(screen.getByText("Create Product Page")).toBeInTheDocument();
  });

  it("navigates to Products page via real AdminMenu link", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
          <Route
            path="/dashboard/admin/products"
            element={<div>Products Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Products"));

    expect(screen.getByText("Products Page")).toBeInTheDocument();
  });

  it("navigates to Orders page via real AdminMenu link", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <Routes>
          <Route path="/dashboard/admin/users" element={<Users />} />
          <Route
            path="/dashboard/admin/orders"
            element={<div>Orders Page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Orders"));

    expect(screen.getByText("Orders Page")).toBeInTheDocument();
  });
});

// ============================================================
// LEVEL 2: Users + AdminMenu + AuthProvider + CartProvider + Routing
// Higher layer — integrates real context providers and full
// routing with the Users + AdminMenu composition. Verifies that
// the page functions correctly within the full provider tree
// and that navigation between admin pages works end-to-end.
// ============================================================

describe("Level 2: Users + AdminMenu + AuthProvider + CartProvider + Routing Integration", () => {
  const renderLevel2 = (authState = null, cartItems = []) => {
    seedAuth(authState);
    seedCart(cartItems);

    return render(
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route
                path="/dashboard/admin/users"
                element={
                  <>
                    <Users />
                    <AuthProbe />
                    <CartProbe />
                  </>
                }
              />
              <Route
                path="/dashboard/admin/create-category"
                element={<div>Create Category Page</div>}
              />
              <Route
                path="/dashboard/admin/create-product"
                element={<div>Create Product Page</div>}
              />
              <Route
                path="/dashboard/admin/products"
                element={<div>Products Page</div>}
              />
              <Route
                path="/dashboard/admin/orders"
                element={<div>Orders Page</div>}
              />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders Users page with real AdminMenu within AuthProvider context", async () => {
    renderLevel2(adminUser);

    await waitFor(() => {
      expect(screen.getByText("All Users")).toBeInTheDocument();
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });
  });

  it("hydrates admin auth state from localStorage via real AuthProvider", async () => {
    renderLevel2(adminUser);

    await waitFor(() => {
      expect(screen.getByTestId("auth-probe")).toHaveTextContent("Admin User");
    });
  });

  it("hydrates regular user auth state from localStorage via real AuthProvider", async () => {
    renderLevel2(regularUser);

    await waitFor(() => {
      expect(screen.getByTestId("auth-probe")).toHaveTextContent(
        "Regular User",
      );
    });
  });

  it("shows guest state when no auth is seeded", async () => {
    renderLevel2(null);

    await waitFor(() => {
      expect(screen.getByTestId("auth-probe")).toHaveTextContent("guest");
    });

    // Page content still renders
    expect(screen.getByText("All Users")).toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("hydrates cart state from localStorage via real CartProvider", async () => {
    const cartItems = [
      { _id: "item-1", name: "Test Product", price: 100 },
      { _id: "item-2", name: "Another Product", price: 200 },
    ];

    renderLevel2(adminUser, cartItems);

    await waitFor(() => {
      expect(screen.getByTestId("cart-probe")).toHaveTextContent("2");
    });
  });

  it("shows empty cart when no cart items are seeded", async () => {
    renderLevel2(adminUser, []);

    await waitFor(() => {
      expect(screen.getByTestId("cart-probe")).toHaveTextContent("0");
    });
  });

  it("navigates from Users to Create Category within provider tree", async () => {
    renderLevel2(adminUser);

    await waitFor(() => {
      expect(screen.getByText("Create Category")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Category"));

    expect(
      await screen.findByText("Create Category Page"),
    ).toBeInTheDocument();
  });

  it("navigates from Users to Products within provider tree", async () => {
    renderLevel2(adminUser);

    await waitFor(() => {
      expect(screen.getByText("Products")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Products"));

    expect(await screen.findByText("Products Page")).toBeInTheDocument();
  });

  it("navigates from Users to Orders within provider tree", async () => {
    renderLevel2(adminUser);

    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Orders"));

    expect(await screen.findByText("Orders Page")).toBeInTheDocument();
  });

  it("navigates from Users to Create Product within provider tree", async () => {
    renderLevel2(adminUser);

    await waitFor(() => {
      expect(screen.getByText("Create Product")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Product"));

    expect(
      await screen.findByText("Create Product Page"),
    ).toBeInTheDocument();
  });

  it("renders page title and AdminMenu together with auth and cart contexts active", async () => {
    const cartItems = [{ _id: "item-1", name: "Widget", price: 50 }];

    renderLevel2(adminUser, cartItems);

    await waitFor(() => {
      // Layout receives title
      expect(screen.getByTestId("layout")).toHaveAttribute(
        "data-title",
        "Dashboard - All Users",
      );
      // AdminMenu is real
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      expect(screen.getByText("Create Category")).toBeInTheDocument();
      // Page content
      expect(screen.getByText("All Users")).toBeInTheDocument();
      // Auth context is active
      expect(screen.getByTestId("auth-probe")).toHaveTextContent("Admin User");
      // Cart context is active
      expect(screen.getByTestId("cart-probe")).toHaveTextContent("1");
    });
  });

  it("AdminMenu links remain functional with both contexts and routing active", async () => {
    renderLevel2(adminUser, [{ _id: "p1", name: "Item", price: 10 }]);

    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });

    // Verify all links are valid anchors
    const links = ["Create Category", "Create Product", "Products", "Orders"];
    links.forEach((linkText) => {
      const anchor = screen.getByText(linkText).closest("a");
      expect(anchor).toBeTruthy();
      expect(anchor).toHaveAttribute("href");
    });

    // Navigate to verify routing works
    fireEvent.click(screen.getByText("Orders"));
    expect(await screen.findByText("Orders Page")).toBeInTheDocument();
  });
});
