// Alyssa Ong, A0264663X
// Assisted by AI

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";

import Profile from "./Profile";
import Orders from "./Orders";
import AdminOrders from "../admin/AdminOrders";
import { AuthProvider, useAuth } from "../../context/auth";

// These tests keep Profile, AuthProvider, and route wiring real, while mocking external/UI boundaries (axios, toast, cart/search/category hooks, and selected antd components).

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
  const Select = ({ children, defaultValue }) => (
    <div>
      <span>{defaultValue}</span>
      <div>{children}</div>
    </div>
  );
  Select.Option = ({ children }) => <span>{children}</span>;
  return { Select, Badge };
});

const buildAuthState = () => ({
  token: "valid-token",
  user: {
    name: "John",
    email: "john@test.com",
    phone: "1111111111",
    address: "Old Address",
  },
});

const AuthStateProbe = () => {
  const [auth] = useAuth();
  return (
    <div>
      <span data-testid="probe-name">{auth?.user?.name || ""}</span>
      <span data-testid="probe-email">{auth?.user?.email || ""}</span>
      <span data-testid="probe-phone">{auth?.user?.phone || ""}</span>
      <span data-testid="probe-address">{auth?.user?.address || ""}</span>
    </div>
  );
};

const renderWithRealAuthProvider = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
      <AuthProvider>
        <AuthStateProbe />
        <Profile />
      </AuthProvider>
    </MemoryRouter>,
  );

const NavigatorControls = () => {
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

const renderProfileOrdersFlow = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
      <AuthProvider>
        <AuthStateProbe />
        <NavigatorControls />
        <Routes>
          <Route path="/dashboard/user/profile" element={<Profile />} />
          <Route path="/dashboard/user/orders" element={<Orders />} />
          <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("Profile frontend integration flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    localStorage.setItem("auth", JSON.stringify(buildAuthState()));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("pre-fills Profile fields from real auth context and keeps email disabled", async () => {
    renderWithRealAuthProvider();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter Your Name")).toHaveValue(
        "John",
      );
      expect(screen.getByPlaceholderText(/Enter Your Email/)).toHaveValue(
        "john@test.com",
      );
      expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
        "1111111111",
      );
      expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
        "Old Address",
      );
    });

    expect(screen.getByPlaceholderText(/Enter Your Email/)).toBeDisabled();
  });

  it("submits profile update, shows success toast, updates auth context and localStorage", async () => {
    const updatedUser = {
      name: "Jane Updated",
      email: "john@test.com",
      phone: "2222222222",
      address: "New Integration Address",
    };

    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser,
      },
    });

    renderWithRealAuthProvider();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Jane Updated" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "New Integration Address" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "Jane Updated",
        email: "john@test.com",
        password: "",
        phone: "1111111111",
        address: "New Integration Address",
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Profile Updated Successfully",
      );
      expect(screen.getByTestId("probe-name")).toHaveTextContent(
        "Jane Updated",
      );
      expect(screen.getByTestId("probe-address")).toHaveTextContent(
        "New Integration Address",
      );
    });

    const persistedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(persistedAuth.user).toMatchObject(updatedUser);
    expect(persistedAuth.token).toBe("valid-token");
  });

  it("shows API contract error toast and avoids auth/localStorage overwrite", async () => {
    const beforeSubmitAuth = localStorage.getItem("auth");

    axios.put.mockResolvedValue({
      data: {
        error: "Password is required and 6 character long",
      },
    });

    renderWithRealAuthProvider();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Should Not Persist" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password is required and 6 character long",
      );
    });

    expect(screen.getByTestId("probe-name")).toHaveTextContent("John");
    expect(localStorage.getItem("auth")).toBe(beforeSubmitAuth);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows generic error toast on transport failure and keeps state consistent", async () => {
    const beforeSubmitAuth = localStorage.getItem("auth");

    axios.put.mockRejectedValue(new Error("Network Error"));

    renderWithRealAuthProvider();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "Will Not Persist" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    expect(screen.getByTestId("probe-address")).toHaveTextContent(
      "Old Address",
    );
    expect(localStorage.getItem("auth")).toBe(beforeSubmitAuth);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("updates profile then shows updated buyer name on Orders page", async () => {
    let latestBuyerName = "John";

    const updatedUser = {
      name: "Jane Routed",
      email: "john@test.com",
      phone: "1111111111",
      address: "Routed Address",
    };

    axios.put.mockImplementation(() => {
      latestBuyerName = updatedUser.name;
      return Promise.resolve({
        data: {
          success: true,
          updatedUser,
        },
      });
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({
          data: {
            orders: [
              {
                _id: "order-1",
                status: "Processing",
                buyer: { name: latestBuyerName },
                createAt: new Date("2026-03-19T00:00:00.000Z").toISOString(),
                payment: { success: true },
                products: [
                  {
                    _id: "prod-1",
                    name: "Cross Component Product",
                    description: "Cross component product description text",
                    price: 42,
                  },
                ],
              },
            ],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET URL: ${url}`));
    });

    renderProfileOrdersFlow();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Jane Routed" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "Routed Address" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Profile Updated Successfully",
      );
      expect(screen.getByTestId("probe-name")).toHaveTextContent("Jane Routed");
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(screen.getByTestId("probe-name")).toHaveTextContent("Jane Routed");
    expect(
      await screen.findByText("Cross Component Product"),
    ).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
  });

  it("updates profile then shows updated buyer name on AdminOrders page", async () => {
    let latestBuyerName = "John";

    const updatedUser = {
      name: "Jane Admin Routed",
      email: "john@test.com",
      phone: "1111111111",
      address: "Admin Routed Address",
    };

    axios.put.mockImplementation(() => {
      latestBuyerName = updatedUser.name;
      return Promise.resolve({
        data: {
          success: true,
          updatedUser,
        },
      });
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/all-orders") {
        return Promise.resolve({
          data: [
            {
              _id: "admin-order-1",
              status: "Shipped",
              buyer: { name: latestBuyerName },
              createAt: new Date("2026-03-19T00:00:00.000Z").toISOString(),
              payment: { success: true },
              products: [
                {
                  _id: "prod-admin-1",
                  name: "Admin Cross Component Product",
                  description: "Admin cross component product description",
                  price: 88,
                },
              ],
            },
          ],
        });
      }

      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({ data: { orders: [] } });
      }

      return Promise.reject(new Error(`Unexpected GET URL: ${url}`));
    });

    renderProfileOrdersFlow();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Jane Admin Routed" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "Admin Routed Address" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Profile Updated Successfully",
      );
      expect(screen.getByTestId("probe-name")).toHaveTextContent(
        "Jane Admin Routed",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Admin Orders" }));

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(screen.getByTestId("probe-name")).toHaveTextContent(
      "Jane Admin Routed",
    );
    expect(
      await screen.findByText("Admin Cross Component Product"),
    ).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
  });

  it("updates profile then returns to Profile with updated prefilled values", async () => {
    const updatedUser = {
      name: "Roundtrip User",
      email: "john@test.com",
      phone: "9999999999",
      address: "Roundtrip Address",
    };

    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser,
      },
    });

    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderProfileOrdersFlow();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Roundtrip User" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "9999999999" },
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

    fireEvent.click(screen.getByRole("button", { name: "Go Profile" }));

    expect(await screen.findByPlaceholderText("Enter Your Name")).toHaveValue(
      "Roundtrip User",
    );
    expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue(
      "9999999999",
    );
    expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue(
      "Roundtrip Address",
    );
  });

  it("when profile update fails, Orders page still reflects original auth user", async () => {
    let latestBuyerName = "John";

    axios.put.mockResolvedValue({
      data: {
        error: "Name cannot be empty",
      },
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({
          data: {
            orders: [
              {
                _id: "order-fail-1",
                status: "Processing",
                buyer: { name: latestBuyerName },
                createAt: new Date("2026-03-19T00:00:00.000Z").toISOString(),
                payment: { success: true },
                products: [
                  {
                    _id: "prod-fail-1",
                    name: "Failure Isolation Product",
                    description: "Failure isolation product description",
                    price: 36,
                  },
                ],
              },
            ],
          },
        });
      }

      return Promise.reject(new Error(`Unexpected GET URL: ${url}`));
    });

    renderProfileOrdersFlow();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Should Not Persist" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Name cannot be empty");
      expect(screen.getByTestId("probe-name")).toHaveTextContent("John");
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));

    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(
      await screen.findByText("Failure Isolation Product"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("probe-name")).toHaveTextContent("John");
  });

  it("profile routed flow logout from Header clears auth state and localStorage", async () => {
    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderProfileOrdersFlow();

    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(screen.getByTestId("probe-name")).toHaveTextContent("");
      expect(screen.getByTestId("probe-email")).toHaveTextContent("");
      expect(screen.getByTestId("probe-phone")).toHaveTextContent("");
      expect(screen.getByTestId("probe-address")).toHaveTextContent("");
    });

    expect(localStorage.getItem("auth")).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
  });

  it("submits non-empty password and sends it in profile update payload", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: {
          ...buildAuthState().user,
          name: "Password User",
        },
      },
    });

    renderWithRealAuthProvider();

    await screen.findByPlaceholderText("Enter Your Name");
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Password User" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Password"), {
      target: { value: "newpassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "Password User",
        email: "john@test.com",
        password: "newpassword123",
        phone: "1111111111",
        address: "Old Address",
      });
    });
  });

  it("successful update keeps auth token unchanged in localStorage", async () => {
    const updatedUser = {
      ...buildAuthState().user,
      address: "Token Keep Address",
    };

    axios.put.mockResolvedValue({
      data: { success: true, updatedUser },
    });

    renderWithRealAuthProvider();
    await screen.findByPlaceholderText("Enter Your Address");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "Token Keep Address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      const persistedAuth = JSON.parse(localStorage.getItem("auth"));
      expect(persistedAuth.token).toBe("valid-token");
      expect(persistedAuth.user.address).toBe("Token Keep Address");
    });
  });

  it("profile renders safely with no auth entry in localStorage", async () => {
    localStorage.removeItem("auth");

    renderWithRealAuthProvider();

    expect(await screen.findByPlaceholderText("Enter Your Name")).toHaveValue(
      "",
    );
    expect(screen.getByPlaceholderText(/Enter Your Email/)).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue("");
  });

  it("profile renders safely when auth user is null", async () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({
        token: "valid-token",
        user: null,
      }),
    );

    renderWithRealAuthProvider();

    expect(await screen.findByPlaceholderText("Enter Your Name")).toHaveValue(
      "",
    );
    expect(screen.getByPlaceholderText(/Enter Your Email/)).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter Your Phone")).toHaveValue("");
    expect(screen.getByPlaceholderText("Enter Your Address")).toHaveValue("");
  });

  it("API error during update does not clear persisted token", async () => {
    axios.put.mockResolvedValue({
      data: { error: "Phone cannot be empty" },
    });

    renderWithRealAuthProvider();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Phone cannot be empty");
    });

    const persistedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(persistedAuth.token).toBe("valid-token");
  });

  it("transport failure during update does not clear persisted token", async () => {
    axios.put.mockRejectedValue(new Error("Server unavailable"));

    renderWithRealAuthProvider();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });

    const persistedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(persistedAuth.token).toBe("valid-token");
  });

  it("profile update with unchanged values still submits once", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: buildAuthState().user,
      },
    });

    renderWithRealAuthProvider();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledTimes(1);
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "John",
        email: "john@test.com",
        password: "",
        phone: "1111111111",
        address: "Old Address",
      });
    });
  });

  it("two successful updates persist latest values in auth context and storage", async () => {
    axios.put
      .mockResolvedValueOnce({
        data: {
          success: true,
          updatedUser: {
            ...buildAuthState().user,
            name: "First Name",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          updatedUser: {
            ...buildAuthState().user,
            name: "Second Name",
          },
        },
      });

    renderWithRealAuthProvider();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "First Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe-name")).toHaveTextContent("First Name");
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Second Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe-name")).toHaveTextContent("Second Name");
    });

    const persistedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(persistedAuth.user.name).toBe("Second Name");
    expect(axios.put).toHaveBeenCalledTimes(2);
  });

  it("profile logout triggers success toast exactly once", async () => {
    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderProfileOrdersFlow();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
    });

    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("email input remains disabled after Profile -> Orders -> Profile navigation", async () => {
    axios.get.mockResolvedValue({ data: { orders: [] } });

    renderProfileOrdersFlow();

    expect(
      await screen.findByPlaceholderText(/Enter Your Email/),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Go Orders" }));
    await screen.findByText("All Orders");

    fireEvent.click(screen.getByRole("button", { name: "Go Profile" }));
    expect(
      await screen.findByPlaceholderText(/Enter Your Email/),
    ).toBeDisabled();
  });

  it("successful profile update followed by logout clears updated persisted user", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: {
          ...buildAuthState().user,
          name: "Logout After Update",
        },
      },
    });

    renderProfileOrdersFlow();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Logout After Update" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe-name")).toHaveTextContent(
        "Logout After Update",
      );
    });

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(localStorage.getItem("auth")).toBeNull();
      expect(screen.getByTestId("probe-name")).toHaveTextContent("");
    });
  });

  it("successful update keeps email field value unchanged and disabled", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: {
          ...buildAuthState().user,
          name: "Email Lock User",
          address: "Email Lock Address",
        },
      },
    });

    renderWithRealAuthProvider();
    await screen.findByPlaceholderText(/Enter Your Email/);

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Email Lock User" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Address"), {
      target: { value: "Email Lock Address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter Your Email/)).toHaveValue(
        "john@test.com",
      );
      expect(screen.getByPlaceholderText(/Enter Your Email/)).toBeDisabled();
    });
  });

  it("profile update submits latest edited values after multiple local input edits", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: {
          ...buildAuthState().user,
          name: "Latest Name",
          phone: "88887777",
        },
      },
    });

    renderWithRealAuthProvider();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Intermediate Name" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "Latest Name" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "99990000" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter Your Phone"), {
      target: { value: "88887777" },
    });

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "Latest Name",
        email: "john@test.com",
        password: "",
        phone: "88887777",
        address: "Old Address",
      });
    });
  });

  it("profile update and AdminOrders fetch can coexist without unexpected /orders calls", async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedUser: {
          ...buildAuthState().user,
          name: "AdminOnly User",
        },
      },
    });

    axios.get.mockImplementation((url) => {
      if (url === "/api/v1/auth/all-orders") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/api/v1/auth/orders") {
        return Promise.resolve({ data: { orders: [] } });
      }
      return Promise.reject(new Error(`Unexpected GET URL: ${url}`));
    });

    renderProfileOrdersFlow();
    await screen.findByPlaceholderText("Enter Your Name");

    fireEvent.change(screen.getByPlaceholderText("Enter Your Name"), {
      target: { value: "AdminOnly User" },
    });
    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));

    await waitFor(() => {
      expect(screen.getByTestId("probe-name")).toHaveTextContent(
        "AdminOnly User",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Go Admin Orders" }));
    await screen.findByText("All Orders");

    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    expect(axios.get).not.toHaveBeenCalledWith("/api/v1/auth/orders");
  });
});
