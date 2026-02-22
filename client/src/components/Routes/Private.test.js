import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import PrivateRoute from "./Private";
import { useAuth } from "../../context/auth";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../Spinner", () => {
  const React = require("react");
  return function MockSpinner() {
    return React.createElement("div", { "data-testid": "spinner" }, "Loading...");
  };
});

Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const renderPrivateRoute = () =>
  render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route path="/private" element={<PrivateRoute />}>
          <Route index element={<div data-testid="protected">Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("PrivateRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the protected outlet when user is authenticated and authorized", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    const { findByTestId } = renderPrivateRoute();

    const content = await findByTestId("protected");
    expect(content).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
  });

  it("should render the spinner when the API rejects authorization", async () => {
    useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    const { getByTestId } = renderPrivateRoute();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
    expect(getByTestId("spinner")).toBeInTheDocument();
  });

  it("should render the spinner and skip the API call when there is no auth token", () => {
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

    const { getByTestId } = renderPrivateRoute();

    expect(getByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should render the spinner when auth is null", () => {
    useAuth.mockReturnValue([null, jest.fn()]);

    const { getByTestId } = renderPrivateRoute();

    expect(getByTestId("spinner")).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });
});
