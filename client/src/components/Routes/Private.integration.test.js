/**
 * INTEGRATION TEST: Route Protection (Frontend)
 *
 * Approach: Bottom-Up Partial Integration
 *
 * Modules integrated (REAL, not mocked):
 *   - components/Routes/Private.js (PrivateRoute) — route guard
 *   - components/Spinner.js         — countdown redirect spinner (REAL, not mocked)
 *   - context/auth.js (AuthProvider) — REAL auth state from localStorage
 *   - react-router-dom (MemoryRouter) — real routing
 *
 * Mocked (external boundaries only):
 *   - axios — HTTP transport layer (user-auth API check)
 *   - react-hot-toast — notification UI (used by Layout)
 *   - hooks/useCategory — unrelated feature
 *   - context/cart.js — not relevant to route protection; mocked to simplify
 *   - context/search.js — not relevant to route protection; mocked to simplify
 *
 * Why this differs from the unit test:
 *   The unit test mocks useAuth (replacing the real AuthProvider) and mocks
 *   Spinner entirely. This integration test uses the REAL AuthProvider
 *   (hydrating from localStorage) and the REAL Spinner, verifying that the
 *   full chain localStorage → AuthProvider → PrivateRoute → API check →
 *   Outlet/Spinner works end-to-end.
 *
 * Stories covered:
 *   Story 3 — Route protection: authenticated access, unauthenticated
 *             blocking, missing-token bypass, rejected authorization,
 *             protected-content rendering gate.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import PrivateRoute from "./Private";
import { AuthProvider } from "../../context/auth";

/* ---------- mocks ---------- */

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
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

/* ---------- helpers ---------- */

const renderProtectedRoute = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/protected" element={<PrivateRoute />}>
            <Route
              index
              element={
                <div data-testid="protected-content">Protected Content</div>
              }
            />
          </Route>
          <Route
            path="/"
            element={<div data-testid="home-page">Home</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

/* ---------- tests ---------- */

describe("Route Protection Integration — Story 3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults.headers.common = {};
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Interaction 1 — Authenticated user with valid token can access protected routes
  it("should render protected content when auth token exists and backend authorizes", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Auth User", email: "auth@test.com" },
        token: "valid-token",
      })
    );
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderProtectedRoute();

    const content = await screen.findByTestId("protected-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent("Protected Content");
  });

  // Interaction 1 — PrivateRoute calls the user-auth endpoint
  it("should call the backend user-auth endpoint when auth token is present", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Auth User" },
        token: "my-token",
      })
    );
    axios.get.mockResolvedValue({ data: { ok: true } });

    renderProtectedRoute();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
  });

  // Interaction 2 — Unauthenticated user is blocked (shows Spinner)
  it("should show the redirect spinner when no auth data exists", async () => {
    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  // Interaction 3 — Missing token prevents backend authorization request
  it("should not call the backend when auth token is missing", async () => {
    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });
    expect(axios.get).not.toHaveBeenCalledWith("/api/v1/auth/user-auth");
  });

  // Interaction 4 — Rejected authorization keeps user in blocked state
  it("should show spinner when backend rejects authorization", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Rejected User" },
        token: "rejected-token",
      })
    );
    axios.get.mockResolvedValue({ data: { ok: false } });

    renderProtectedRoute();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    await waitFor(() => {
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  // Interaction 5 — Protected route only renders when auth state is valid
  it("should not render protected content until authorization completes", async () => {
    let resolveAuth;
    const authPromise = new Promise((resolve) => {
      resolveAuth = resolve;
    });
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "Pending User" },
        token: "pending-token",
      })
    );
    axios.get.mockReturnValue(authPromise);

    renderProtectedRoute();

    // Before authorization resolves, protected content should not be visible
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();

    // Resolve authorization
    resolveAuth({ data: { ok: true } });

    // Now protected content should appear
    const content = await screen.findByTestId("protected-content");
    expect(content).toBeInTheDocument();
  });
});
