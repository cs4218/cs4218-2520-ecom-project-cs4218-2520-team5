// Ivan Ang, A0259256U
// Assisted by AI
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminMenu from "./AdminMenu";

// Story 6: AdminMenu component
describe("AdminMenu", () => {
  const renderAdminMenu = () =>
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

  it("should render the Admin Panel heading", () => {
    const { getByText } = renderAdminMenu();

    expect(getByText("Admin Panel")).toBeInTheDocument();
  });

  it("should render the Create Category link with the correct route", () => {
    const { getByText } = renderAdminMenu();

    const link = getByText("Create Category").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/admin/create-category");
  });

  it("should render the Create Product link with the correct route", () => {
    const { getByText } = renderAdminMenu();

    const link = getByText("Create Product").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/admin/create-product");
  });

  it("should render the Products link with the correct route", () => {
    const { getByText } = renderAdminMenu();

    const link = getByText("Products").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/admin/products");
  });

  it("should render the Orders link with the correct route", () => {
    const { getByText } = renderAdminMenu();

    const link = getByText("Orders").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/admin/orders");
  });
});
