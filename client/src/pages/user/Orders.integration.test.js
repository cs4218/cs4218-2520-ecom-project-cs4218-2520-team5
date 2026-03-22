// Alyssa Ong, A0264663X
// Assisted by AI

import React, { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";

import Orders from "./Orders";
import Profile from "./Profile";
import AdminOrders from "../admin/AdminOrders";
import { AuthProvider, useAuth } from "../../context/auth";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => null,
}));

jest.mock("../../context/cart", () => ({
  useCart: () => [[], jest.fn()],
}));

jest.mock("../../context/search", () => ({
  useSearch: () => [{ keyword: "", results: [] }, jest.fn()],
}));

jest.mock("../../hooks/useCategory", () => {
  return () => [];
});

jest.mock("antd", () => {
  const Badge = ({ children }) => <span>{children}</span>;
  const Select = ({ children, defaultValue, onChange }) => (
    <select
      data-testid="antd-select"
      value={defaultValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Badge, Select };
});

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

const buildOrder = (overrides = {}) => ({
  _id: "order-1",
  status: "Processing",
  buyer: { name: "John Buyer" },
  createAt: new Date("2026-03-19T00:00:00.000Z").toISOString(),
  payment: { success: true },
  products: [
    {
      _id: "prod-1",
      name: "Core Product",
      description: "Core product description for integration test checks",
      price: 42,
    },
  ],
  ...overrides,
});

const renderOrdersWithRealAuthProvider = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
      <AuthProvider>
        <Orders />
      </AuthProvider>
    </MemoryRouter>,
  );

const TokenSetter = () => {
  const [, setAuth] = useAuth();

  useEffect(() => {
    setAuth({
      user: {
        name: "Late Token User",
        email: "late@test.com",
      },
      token: "late-token",
    });
  }, [setAuth]);

  return null;
};

const AuthStateProbe = () => {
  const [auth] = useAuth();

  return <span data-testid="probe-name">{auth?.user?.name || ""}</span>;
};

const FlowNavigator = () => {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate("/dashboard/user/profile")}>
        Go Profile
      </button>
      <button onClick={() => navigate("/dashboard/user/orders")}>
        Go Orders
      </button>
      <button onClick={() => navigate("/dashboard/admin/orders")}>
        Go Admin Orders
      </button>
    </div>
  );
};

const renderProfileOrdersAdminFlow = (
  initialRoute = "/dashboard/user/profile",
) =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <AuthStateProbe />
        <FlowNavigator />
        <Routes>
          <Route path="/dashboard/user/profile" element={<Profile />} />
          <Route path="/dashboard/user/orders" element={<Orders />} />
          <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("Orders integration core", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders Orders shell and does not call API when auth token is absent", async () => {
    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("All Orders")).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  it("calls Orders API when token exists in real auth context from localStorage", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        token: "valid-token",
        user: {
          name: "John",
          email: "john@test.com",
        },
      }),
    );

    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderOrdersWithRealAuthProvider();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });
  });

  it("renders no table when API returns an empty orders list", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );
    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderOrdersWithRealAuthProvider();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders order status, buyer, payment, and quantity for one order", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [buildOrder()],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("John Buyer")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Core Product")).toBeInTheDocument();
  });

  it("renders two integrated order blocks with index numbers", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({ _id: "order-1", buyer: { name: "Buyer One" } }),
          buildOrder({ _id: "order-2", buyer: { name: "Buyer Two" } }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Buyer One")).toBeInTheDocument();
    expect(screen.getByText("Buyer Two")).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.getAllByText("Success")).toHaveLength(2);
  });

  it("renders failed payment state when payment.success is false", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({
            status: "Cancelled",
            payment: { success: false },
          }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders product images using the API photo endpoint convention", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({
            products: [
              {
                _id: "photo-prod-1",
                name: "Photo Product",
                description: "Photo product description",
                price: 88,
              },
            ],
          }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    const image = await screen.findByAltText("Photo Product");
    expect(image).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/photo-prod-1",
    );
  });

  it("shows truncated description text for long product descriptions", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    const longDescription =
      "1234567890123456789012345678901234567890 and more text";

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({
            products: [
              {
                _id: "desc-prod-1",
                name: "Long Desc Product",
                description: longDescription,
                price: 99,
              },
            ],
          }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Long Desc Product")).toBeInTheDocument();
    expect(
      screen.getByText(longDescription.substring(0, 30)),
    ).toBeInTheDocument();
  });

  it("renders relative date text from createAt field", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({
            createAt: new Date("2025-03-01T00:00:00.000Z").toISOString(),
          }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText(/ago/i)).toBeInTheDocument();
  });

  it("triggers Orders fetch when auth token appears after mount", async () => {
    axios.get.mockResolvedValue({ data: { orders: [buildOrder()] } });

    render(
      <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
        <AuthProvider>
          <TokenSetter />
          <Orders />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    expect(await screen.findByText("Core Product")).toBeInTheDocument();
  });

  it("handles API transport failure by logging error and keeping page stable", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const mockError = new Error("Network failure");
    axios.get.mockRejectedValue(mockError);

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("All Orders")).toBeInTheDocument();

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    consoleLogSpy.mockRestore();
  });

  it("does not fetch Orders when auth token is an empty string", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "", user: { name: "John" } }),
    );
    axios.get.mockResolvedValue({ data: { orders: [buildOrder()] } });

    renderOrdersWithRealAuthProvider();

    await waitFor(() => {
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  it("renders expected order table headers", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [buildOrder()],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Quantity")).toBeInTheDocument();
  });

  it("renders correct quantity and details for multiple products in one order", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({
            products: [
              {
                _id: "multi-prod-1",
                name: "Product Alpha",
                description: "Alpha product description for order card",
                price: 50,
              },
              {
                _id: "multi-prod-2",
                name: "Product Beta",
                description: "Beta product description for order card",
                price: 75,
              },
            ],
          }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Product Alpha")).toBeInTheDocument();
    expect(screen.getByText("Product Beta")).toBeInTheDocument();
    expect(screen.getByText("Price : 50")).toBeInTheDocument();
    expect(screen.getByText("Price : 75")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("renders short product descriptions without breaking display", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({
            products: [
              {
                _id: "short-desc-prod-1",
                name: "Short Desc Product",
                description: "short desc",
                price: 13,
              },
            ],
          }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Short Desc Product")).toBeInTheDocument();
    expect(screen.getByText("short desc")).toBeInTheDocument();
  });

  it("renders quantity 0 when an order has no products", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({
            _id: "zero-prod-order",
            products: [],
          }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Core Product")).not.toBeInTheDocument();
  });

  it("calls orders API once for a single authenticated mount", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );
    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderOrdersWithRealAuthProvider();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  it("fetches orders again after component remount", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );
    axios.get.mockResolvedValue({ data: { orders: [] } });

    const firstRender = renderOrdersWithRealAuthProvider();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    firstRender.unmount();
    renderOrdersWithRealAuthProvider();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("updates axios default Authorization header from auth context", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "header-token", user: { name: "John" } }),
    );
    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderOrdersWithRealAuthProvider();

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe(
        "header-token",
      );
    });
  });

  it("renders mixed payment outcomes across multiple orders", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({ _id: "mixed-order-1", payment: { success: true } }),
          buildOrder({ _id: "mixed-order-2", payment: { success: false } }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders three separate order tables for three orders", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          buildOrder({ _id: "order-a", buyer: { name: "Buyer A" } }),
          buildOrder({ _id: "order-b", buyer: { name: "Buyer B" } }),
          buildOrder({ _id: "order-c", buyer: { name: "Buyer C" } }),
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("Buyer A")).toBeInTheDocument();
    expect(screen.getByText("Buyer B")).toBeInTheDocument();
    expect(screen.getByText("Buyer C")).toBeInTheDocument();
    expect(screen.getAllByRole("table")).toHaveLength(3);
  });

  it("ignores unexpected order payload fields and still renders core data", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "valid-token", user: { name: "John" } }),
    );

    axios.get.mockResolvedValue({
      data: {
        orders: [
          {
            ...buildOrder(),
            unknownField: "unexpected",
            nested: { other: true },
          },
        ],
      },
    });

    renderOrdersWithRealAuthProvider();

    expect(await screen.findByText("John Buyer")).toBeInTheDocument();
    expect(screen.getByText("Core Product")).toBeInTheDocument();
  });
});

describe("Orders cross-component integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      "auth",
      JSON.stringify({
        token: "valid-token",
        user: {
          name: "John",
          email: "john@test.com",
          phone: "1111111111",
          address: "Old Address",
          role: 0,
        },
      }),
    );
  });

  it("updates Profile and then shows updated buyer name in Orders", async () => {
    let latestBuyerName = "John";

    axios.put.mockImplementation(() => {
      latestBuyerName = "Jane Routed";
      return Promise.resolve({
        data: {
          success: true,
          updatedUser: {
            name: "Jane Routed",
            email: "john@test.com",
            phone: "1111111111",
            address: "New Routed Address",
          },
        },
      });
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({
          data: {
            orders: [
              buildOrder({
                buyer: { name: latestBuyerName },
                products: [
                  {
                    _id: "flow-prod-1",
                    name: "Cross Component Product",
                    description: "Cross component product description",
                    price: 64,
                  },
                ],
              }),
            ],
          },
        });
      }

      return Promise.resolve({ data: [] });
    });

    renderProfileOrdersAdminFlow();

    await screen.findByPlaceholderText("Enter Your Name");
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Jane Routed" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "New Routed Address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "Jane Routed",
        email: "john@test.com",
        password: "",
        phone: "1111111111",
        address: "New Routed Address",
      });
      expect(screen.getByTestId("probe-name")).toHaveTextContent("Jane Routed");
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(
      await screen.findByText("Cross Component Product"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("probe-name")).toHaveTextContent("Jane Routed");
    expect(screen.getAllByText("Jane Routed").length).toBeGreaterThanOrEqual(2);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
  });

  it("keeps original auth user in Orders when Profile update fails", async () => {
    axios.put.mockResolvedValue({
      data: { error: "Name cannot be empty" },
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({
          data: {
            orders: [
              buildOrder({
                buyer: { name: "John" },
                products: [
                  {
                    _id: "flow-prod-2",
                    name: "Failure Isolation Product",
                    description: "Failure isolation product description",
                    price: 36,
                  },
                ],
              }),
            ],
          },
        });
      }

      return Promise.resolve({ data: [] });
    });

    renderProfileOrdersAdminFlow();

    await screen.findByPlaceholderText("Enter Your Name");
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Should Not Persist" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe-name")).toHaveTextContent("John");
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(
      await screen.findByText("Failure Isolation Product"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("probe-name")).toHaveTextContent("John");
    expect(screen.getAllByText("John").length).toBeGreaterThanOrEqual(1);
  });

  it("uses different endpoints for user Orders and AdminOrders pages", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({
          data: {
            orders: [
              buildOrder({
                _id: "user-order-1",
                buyer: { name: "User Buyer" },
              }),
            ],
          },
        });
      }

      if (url === "/api/v1/auth/all-orders") {
        return Promise.resolve({
          data: [
            buildOrder({
              _id: "admin-order-1",
              buyer: { name: "Admin Buyer" },
            }),
          ],
        });
      }

      return Promise.reject(new Error(`Unexpected GET URL: ${url}`));
    });

    renderProfileOrdersAdminFlow("/dashboard/user/orders");

    expect(await screen.findByText("User Buyer")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");

    fireEvent.click(screen.getByRole("button", { name: "Go Admin Orders" }));

    expect(await screen.findByText("Admin Buyer")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
  });

  it("loads Orders only after route changes from Profile to Orders in this test flow", async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({ data: { orders: [buildOrder()] } });
      }
      return Promise.resolve({ data: [] });
    });

    renderProfileOrdersAdminFlow("/dashboard/user/profile");

    await screen.findByPlaceholderText("Enter Your Name");
    expect(axios.get).not.toHaveBeenCalledWith("/api/v1/auth/orders");

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));

    expect(await screen.findByText("Core Product")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
  });

  it("navigates Orders to Profile and back with consistent auth probe state", async () => {
    axios.get.mockResolvedValue({ data: { orders: [buildOrder()] } });
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: {
          name: "Roundtrip User",
          email: "john@test.com",
          phone: "1111111111",
          address: "Roundtrip Address",
        },
      },
    });

    renderProfileOrdersAdminFlow("/dashboard/user/orders");

    expect(await screen.findByText("Core Product")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go Profile" }));
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Roundtrip User" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "Roundtrip Address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe-name")).toHaveTextContent(
        "Roundtrip User",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(screen.getByTestId("probe-name")).toHaveTextContent(
      "Roundtrip User",
    );
  });

  it("persists updated profile user to localStorage before viewing Orders", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: {
          name: "Persisted Name",
          email: "john@test.com",
          phone: "2222222222",
          address: "Persisted Address",
        },
      },
    });

    axios.get.mockResolvedValue({ data: { orders: [buildOrder()] } });

    renderProfileOrdersAdminFlow("/dashboard/user/profile");
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Persisted Name" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "2222222222" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "Persisted Address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      const persistedAuth = JSON.parse(localStorage.getItem("auth"));
      expect(persistedAuth.user.name).toBe("Persisted Name");
      expect(persistedAuth.user.address).toBe("Persisted Address");
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));
    expect(await screen.findByText("All Orders")).toBeInTheDocument();
  });

  it("updates order status in AdminOrders and refetches all-orders", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/all-orders") {
        return Promise.resolve({
          data: [
            buildOrder({
              _id: "admin-status-order",
              status: "Processing",
              buyer: { name: "Admin Buyer" },
            }),
          ],
        });
      }

      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({ data: { orders: [] } });
      }

      return Promise.reject(new Error(`Unexpected GET URL: ${url}`));
    });

    axios.put.mockResolvedValue({ data: { ok: true } });

    renderProfileOrdersAdminFlow("/dashboard/admin/orders");

    expect(await screen.findByText("Admin Buyer")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("antd-select"), {
      target: { value: "Shipped" },
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/admin-status-order",
        {
          status: "Shipped",
        },
      );
    });

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    expect(
      axios.get.mock.calls.filter(
        (call) => call[0] === "/api/v1/auth/all-orders",
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("shows distinct product names when switching between user and admin order views", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({
          data: {
            orders: [
              buildOrder({
                _id: "switch-user-order",
                products: [
                  {
                    _id: "user-prod",
                    name: "User View Product",
                    description: "User view product description",
                    price: 11,
                  },
                ],
              }),
            ],
          },
        });
      }

      if (url === "/api/v1/auth/all-orders") {
        return Promise.resolve({
          data: [
            buildOrder({
              _id: "switch-admin-order",
              products: [
                {
                  _id: "admin-prod",
                  name: "Admin View Product",
                  description: "Admin view product description",
                  price: 22,
                },
              ],
            }),
          ],
        });
      }

      return Promise.reject(new Error(`Unexpected GET URL: ${url}`));
    });

    renderProfileOrdersAdminFlow("/dashboard/user/orders");

    expect(await screen.findByText("User View Product")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go Admin Orders" }));
    expect(await screen.findByText("Admin View Product")).toBeInTheDocument();
  });
});
