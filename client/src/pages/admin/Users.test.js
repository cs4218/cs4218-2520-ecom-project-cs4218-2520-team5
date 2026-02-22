import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Users from "./Users";

jest.mock("../../components/AdminMenu", () => () => (
  <div>Mocked AdminMenu</div>
));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("Users Component", () => {
  it("renders the Users component", () => {
    render(<Users />);

    expect(screen.getByText("All Users")).toBeInTheDocument();
    expect(screen.getByText("Mocked AdminMenu")).toBeInTheDocument();
  });
});
