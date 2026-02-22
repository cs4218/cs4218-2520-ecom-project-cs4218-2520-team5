// Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Dashboard from "./Dashboard";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [
    {
      user: {
        name: "John Doe",
        email: "john@test.com",
        address: "123 Main St",
      },
    },
    jest.fn(),
  ]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

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

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard/user"]}>
      <Routes>
        <Route path="/dashboard/user" element={<Dashboard />} />
      </Routes>
    </MemoryRouter>
  );

describe("Dashboard Component", () => {
  it("should display user details in the dashboard card", () => {
    const { container } = renderDashboard();
    const card = container.querySelector(".card");

    expect(card).toHaveTextContent("John Doe");
    expect(card).toHaveTextContent("john@test.com");
    expect(card).toHaveTextContent("123 Main St");
  });

  it("should render the UserMenu navigation", () => {
    const { getByText } = renderDashboard();

    expect(getByText("Profile")).toBeInTheDocument();
    expect(getByText("Orders")).toBeInTheDocument();
  });

  it("should render user name, email and address each in an h3 element", () => {
    const { container } = renderDashboard();
    const headings = container.querySelectorAll(".card h3");

    expect(headings).toHaveLength(3);
    expect(headings[0]).toHaveTextContent("John Doe");
    expect(headings[1]).toHaveTextContent("john@test.com");
    expect(headings[2]).toHaveTextContent("123 Main St");
  });
});
