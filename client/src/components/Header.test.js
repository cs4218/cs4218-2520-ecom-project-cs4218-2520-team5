// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";

// Mock all external dependencies for isolation (unit test requirement)
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../hooks/useCategory", () => jest.fn());

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
  },
}));

jest.mock("./Form/SearchInput", () => () => (
  <div data-testid="search-input">SearchInput</div>
));

jest.mock("antd", () => ({
  Badge: ({ count, children }) => (
    <div data-testid="badge" data-count={count}>
      {children}
    </div>
  ),
}));

// Import mocked dependencies
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import toast from "react-hot-toast";

describe("Header Component - Unit Tests", () => {
  const setAuthMock = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: { removeItem: jest.fn() },
      writable: true,
    });

    // Default mock returns
    useCart.mockReturnValue([[]]);
    useCategory.mockReturnValue([
      { name: "Mice", slug: "mice" },
      { name: "Keyboards", slug: "keyboards" },
    ]);
  });

  // ===== TEST 1: Brand Name Rendering (Output-based) =====
  it("should display brand name", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText("🛒 Virtual Vault")).toBeInTheDocument();
  });

  // ===== TEST 2: Search Input Rendering (Output-based) =====
  it("should display search input component", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  // ===== TEST 3: Home Link Rendering (Output-based) =====
  it("should display Home link", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByRole("link", { name: /^home$/i })).toBeInTheDocument();
  });

  // ===== TEST 4: Register/Login Links for Guest Users (Output-based) =====
  it("should display Register and Login links when user is not authenticated", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
  });

  // ===== TEST 5: User Dropdown for Authenticated Users (Output-based) =====
  it("should display user name in dropdown when authenticated", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "John Doe", role: 0 }, token: "valid-token" },
      setAuthMock,
    ]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  // ===== TEST 6: Hide Register/Login for Authenticated Users (Output-based) =====
  it("should not display Register and Login links when user is authenticated", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "Jane", role: 0 }, token: "token" },
      setAuthMock,
    ]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(
      screen.queryByRole("link", { name: /register/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /login/i }),
    ).not.toBeInTheDocument();
  });

  // ===== TEST 7: Dashboard Link for Regular User (Output-based) =====
  it("should display Dashboard link pointing to user dashboard when role is 0", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "Regular User", role: 0 }, token: "token" },
      setAuthMock,
    ]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
  });

  // ===== TEST 8: Dashboard Link for Admin User (Output-based) =====
  it("should display Dashboard link pointing to admin dashboard when role is 1", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "Admin User", role: 1 }, token: "admin-token" },
      setAuthMock,
    ]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
  });

  // ===== TEST 9: Logout Button Rendering (Output-based) =====
  it("should display Logout link when user is authenticated", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "User", role: 0 }, token: "token" },
      setAuthMock,
    ]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByRole("link", { name: /logout/i })).toBeInTheDocument();
  });

  // ===== TEST 10: Logout Clears Auth State (Communication-based) =====
  it("should call setAuth with null user when logout is clicked", () => {
    // Arrange
    const authState = { user: { name: "John", role: 1 }, token: "abc123" };
    useAuth.mockReturnValue([authState, setAuthMock]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Act
    fireEvent.click(screen.getByRole("link", { name: /logout/i }));

    // Assert
    expect(setAuthMock).toHaveBeenCalledWith({
      ...authState,
      user: null,
      token: "",
    });
  });

  // ===== TEST 11: Logout Removes localStorage (Communication-based) =====
  it("should remove auth from localStorage when logout is clicked", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "John", role: 0 }, token: "token" },
      setAuthMock,
    ]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Act
    fireEvent.click(screen.getByRole("link", { name: /logout/i }));

    // Assert
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");
  });

  // ===== TEST 12: Logout Shows Success Toast (Communication-based) =====
  it("should show success toast message when logout is clicked", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "John", role: 0 }, token: "token" },
      setAuthMock,
    ]);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Act
    fireEvent.click(screen.getByRole("link", { name: /logout/i }));

    // Assert
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });

  // ===== TEST 13: Cart Badge Shows Correct Count (Output-based) =====
  it("should display cart badge with correct item count", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);
    useCart.mockReturnValue([[{ id: 1 }, { id: 2 }, { id: 3 }]]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-count", "3");
  });

  // ===== TEST 14: Cart Badge Shows Zero for Empty Cart (Output-based) =====
  it("should display cart badge with count 0 when cart is empty", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);
    useCart.mockReturnValue([[]]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    const badge = screen.getByTestId("badge");
    expect(badge).toHaveAttribute("data-count", "0");
  });

  // ===== TEST 15: Cart Link Rendering (Output-based) =====
  it("should display Cart link", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
  });

  // ===== TEST 16: Categories Dropdown Rendering (Output-based) =====
  it("should display Categories dropdown link", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(
      screen.getByRole("link", { name: /^categories$/i }),
    ).toBeInTheDocument();
  });

  // ===== TEST 17: All Categories Link Rendering (Output-based) =====
  it("should display All Categories link in dropdown", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(
      screen.getByRole("link", { name: /all categories/i }),
    ).toBeInTheDocument();
  });

  // ===== TEST 18: Individual Category Links Rendering (Output-based) =====
  it("should display individual category links with correct paths", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    const miceLink = screen.getByRole("link", { name: /mice/i });
    const keyboardsLink = screen.getByRole("link", { name: /keyboards/i });

    expect(miceLink).toBeInTheDocument();
    expect(miceLink).toHaveAttribute("href", "/category/mice");

    expect(keyboardsLink).toBeInTheDocument();
    expect(keyboardsLink).toHaveAttribute("href", "/category/keyboards");
  });

  // ===== TEST 19: Empty Categories List Handling (Output-based) =====
  it("should handle empty categories list gracefully", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);
    useCategory.mockReturnValue([]);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(
      screen.getByRole("link", { name: /all categories/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /mice/i }),
    ).not.toBeInTheDocument();
  });

  // ===== TEST 20: Undefined Categories Handling (Output-based) =====
  it("should handle undefined categories without crashing", () => {
    // Arrange
    useAuth.mockReturnValue([{ user: null, token: "" }, setAuthMock]);
    useCategory.mockReturnValue(undefined);

    // Act
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText("🛒 Virtual Vault")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /all categories/i }),
    ).toBeInTheDocument();
  });
});
