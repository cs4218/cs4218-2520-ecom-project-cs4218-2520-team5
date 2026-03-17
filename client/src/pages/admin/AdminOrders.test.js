import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminOrders from "./AdminOrders";
import axios from "axios";
import { useAuth } from "../../context/auth";

jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/AdminMenu", () => () => (
  <div>Mocked AdminMenu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

// Mock Ant Design Select to a simple native select for testing (avoids portal issues)
jest.mock("antd", () => {
  const React = require("react");
  const MockSelect = (props) => {
    const { children, onChange, defaultValue } = props;
    return React.createElement(
      "select",
      {
        "data-testid": props["data-testid"],
        defaultValue,
        onChange: (e) => onChange && onChange(e.target.value),
      },
      React.Children.map(children, (child) =>
        React.createElement(
          "option",
          { value: child.props.value },
          child.props.children,
        ),
      ),
    );
  };
  MockSelect.Option = (props) =>
    React.createElement("option", { value: props.value }, props.children);
  return { Select: MockSelect };
});

describe("AdminOrders Component", () => {
  beforeEach(() => {
    useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
  });

  it("renders the AdminOrders component", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<AdminOrders />);

    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.getByText("Mocked AdminMenu")).toBeInTheDocument();
  });

  it("displays orders fetched from the API", async () => {
    const mockOrders = [
      {
        _id: "1",
        status: "Processing",
        buyer: { name: "John Doe" },
        createAt: "2026-02-22T10:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "p1",
            name: "Product 1",
            description: "Description 1",
            price: 100,
          },
        ],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(<AdminOrders />);

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
  });

  it("updates order status when changed", async () => {
    const mockOrders = [
      {
        _id: "1",
        status: "Processing",
        buyer: { name: "John Doe" },
        createAt: "2026-02-22T10:00:00Z",
        payment: { success: true },
        products: [],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockOrders });
    axios.put.mockResolvedValueOnce({});

    render(<AdminOrders />);

    const select = await screen.findByDisplayValue("Processing");

    // For test we mocked antd Select as a native select, so trigger change
    fireEvent.change(select, { target: { value: "Shipped" } });

    expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/1", {
      status: "Shipped",
    });
  });
});
