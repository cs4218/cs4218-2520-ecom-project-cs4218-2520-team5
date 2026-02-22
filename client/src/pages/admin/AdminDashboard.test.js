// Ivan Ang, A0259256U
// Assisted by AI
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminDashboard from "./AdminDashboard";

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../components/Layout", () => ({ children }) => <>{children}</>);
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);

import { useAuth } from "../../context/auth";

// Story 6: AdminDashboard component
describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the admin's name, email, and phone from the auth context", () => {
    useAuth.mockReturnValue([
      { user: { name: "Alice", email: "alice@example.com", phone: "91234567" } },
    ]);

    const { getByText } = render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(getByText(/Alice/)).toBeInTheDocument();
    expect(getByText(/alice@example.com/)).toBeInTheDocument();
    expect(getByText(/91234567/)).toBeInTheDocument();
  });

  it("should render without crashing when auth user is null", () => {
    useAuth.mockReturnValue([{ user: null }]);

    expect(() =>
      render(
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      )
    ).not.toThrow();
  });

  it("should render the AdminMenu component", () => {
    useAuth.mockReturnValue([
      { user: { name: "Alice", email: "alice@example.com", phone: "123" } },
    ]);

    const { getByText } = render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(getByText("AdminMenu")).toBeInTheDocument();
  });
});
