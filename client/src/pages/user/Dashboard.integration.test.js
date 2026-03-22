/**
 * INTEGRATION TEST: Protected Dashboard Flow (Frontend)
 *
 * Approach: Bottom-Up Partial Integration
 *
 * Modules integrated (REAL, not mocked):
 *   - pages/user/Dashboard.js          — user dashboard page
 *   - components/UserMenu.js           — dashboard navigation sidebar
 *   - components/Routes/Private.js     — route guard (PrivateRoute)
 *   - components/Spinner.js            — countdown redirect spinner
 *   - components/Layout.js / Header.js / Footer.js — page chrome
 *   - context/auth.js   (AuthProvider)  — REAL auth state hydrated from localStorage
 *   - context/cart.js   (CartProvider)  — real cart state
 *   - context/search.js (SearchProvider)— real search state
 *   - react-router-dom  (MemoryRouter)  — real routing with nested routes
 *
 * Mocked (external boundaries only):
 *   - axios           — HTTP transport layer
 *   - react-hot-toast — notification UI
 *   - hooks/useCategory — unrelated feature
 *
 * Why this differs from the unit test:
 *   The unit test mocks useAuth (hardcoded user), renders Dashboard alone,
 *   and never involves PrivateRoute or real routing. This integration test
 *   uses the REAL AuthProvider (reading from localStorage), wires PrivateRoute
 *   as the route guard around Dashboard, and verifies that Dashboard +
 *   UserMenu render together within the protected routing hierarchy.
 *
 * Stories covered:
 *   Story 4 — Protected dashboard flow: authenticated dashboard access,
 *             user info display from auth context, UserMenu navigation links,
 *             navigation within protected area, unauthenticated blocking.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Dashboard from "./Dashboard";
import PrivateRoute from "../../components/Routes/Private";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";

/* ---------- mocks: only external boundaries ---------- */

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: { headers: { common: {} } },
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

/* ---------- test data ---------- */

const testUser = {
  _id: "u1",
  name: "Dashboard User",
  email: "dashboard@test.com",
  phone: "9998887777",
  address: "42 Dashboard Ave",
  role: 0,
};

/* ---------- helpers ---------- */

const renderDashboard = (initialPath = "/dashboard/user") =>
  render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/dashboard" element={<PrivateRoute />}>
                <Route path="user" element={<Dashboard />} />
                <Route
                  path="user/profile"
                  element={
                    <div data-testid="profile-page">User Profile Page</div>
                  }
                />
                <Route
                  path="user/orders"
                  element={
                    <div data-testid="orders-page">User Orders Page</div>
                  }
                />
              </Route>
              <Route
                path="/"
                element={<div data-testid="home-page">Home</div>}
              />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );

const setupAuthenticatedUser = () => {
  localStorage.setItem(
    "auth",
    JSON.stringify({ user: testUser, token: "dashboard-token" })
  );
  axios.get.mockResolvedValue({ data: { ok: true } });
};

/* ---------- tests ---------- */

describe("Protected Dashboard Flow Integration — Story 4", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults.headers.common = {};
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Interaction 1 — Authenticated user can access the dashboard
  it("should render the dashboard when the user is authenticated and authorized", async () => {
    setupAuthenticatedUser();
    const { container } = renderDashboard();

    await waitFor(() => {
      const card = container.querySelector(".card");
      expect(card).toHaveTextContent("Dashboard User");
    });
  });

  // Interaction 2 — Dashboard displays correct user details from auth state
  it("should display user name, email, and address from the real auth context", async () => {
    setupAuthenticatedUser();
    const { container } = renderDashboard();

    await waitFor(() => {
      const card = container.querySelector(".card");
      expect(card).toHaveTextContent("Dashboard User");
      expect(card).toHaveTextContent("dashboard@test.com");
      expect(card).toHaveTextContent("42 Dashboard Ave");
    });
  });

  // Interaction 3 — UserMenu renders correct protected navigation links
  it("should render UserMenu with Profile and Orders links", async () => {
    setupAuthenticatedUser();
    const { container } = renderDashboard();

    await waitFor(() => {
      const card = container.querySelector(".card");
      expect(card).toHaveTextContent("Dashboard User");
    });

    const profileLink = screen.getByRole("link", { name: "Profile" });
    const ordersLink = screen.getByRole("link", { name: "Orders" });

    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
  });

  // Interaction 4 — Navigation within the protected user area
  it("should navigate to the profile page when Profile link is clicked", async () => {
    setupAuthenticatedUser();
    const { container } = renderDashboard();

    await waitFor(() => {
      const card = container.querySelector(".card");
      expect(card).toHaveTextContent("Dashboard User");
    });

    fireEvent.click(screen.getByRole("link", { name: "Profile" }));

    await waitFor(() => {
      expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    });
  });

  // Interaction 4 — Navigation to orders page
  it("should navigate to the orders page when Orders link is clicked", async () => {
    setupAuthenticatedUser();
    const { container } = renderDashboard();

    await waitFor(() => {
      const card = container.querySelector(".card");
      expect(card).toHaveTextContent("Dashboard User");
    });

    fireEvent.click(screen.getByRole("link", { name: "Orders" }));

    await waitFor(() => {
      expect(screen.getByTestId("orders-page")).toBeInTheDocument();
    });
  });

  // Interaction 5 — Unauthenticated users do not reach dashboard content
  it("should show spinner and block dashboard access for unauthenticated users", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Dashboard User")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Orders")).not.toBeInTheDocument();
  });

  // Interaction 5 — Dashboard not accessible when backend rejects token
  it("should block dashboard when backend authorization check fails", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ user: testUser, token: "bad-token" })
    );
    axios.get.mockResolvedValue({ data: { ok: false } });

    renderDashboard();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    await waitFor(() => {
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Dashboard User")).not.toBeInTheDocument();
  });
});
