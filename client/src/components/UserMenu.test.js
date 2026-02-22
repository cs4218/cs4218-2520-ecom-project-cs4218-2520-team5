// Test cases written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import UserMenu from "./UserMenu";

const renderUserMenu = () =>
  render(
    <MemoryRouter>
      <UserMenu />
    </MemoryRouter>
  );

describe("UserMenu Component", () => {
  it("should render the Dashboard heading", () => {
    renderUserMenu();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("should render a link to the Profile page", () => {
    renderUserMenu();
    const profileLink = screen.getByRole("link", { name: "Profile" });

    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
  });

  it("should render a link to the Orders page", () => {
    renderUserMenu();
    const ordersLink = screen.getByRole("link", { name: "Orders" });

    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute("href", "/dashboard/user/orders");
  });
});
