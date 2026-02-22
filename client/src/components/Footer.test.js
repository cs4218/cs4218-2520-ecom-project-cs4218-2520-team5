// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Footer from "./Footer";

// Mock external dependencies to achieve isolation (unit test requirement)
jest.mock("react-router-dom", () => ({
  Link: ({ children, to }) => (
    <a href={to} data-testid={`link-${to}`}>
      {children}
    </a>
  ),
}));

describe("Footer Component - Unit Tests", () => {
  // Helper to render component
  const renderFooter = () => {
    return render(<Footer />);
  };

  // ===== TEST 1: Copyright Message Display (Output-based) =====
  it("should display copyright message to users", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify copyright text is visible)
    expect(
      screen.getByText(/All Rights Reserved.*TestingComp/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 2: About Link Display (Output-based) =====
  it("should display About link", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify About link is visible)
    const aboutLink = screen.getByText("About");
    expect(aboutLink).toBeInTheDocument();
  });

  // ===== TEST 3: About Link Navigation (Output-based) =====
  it("should provide About link pointing to correct path", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify About link points to /about)
    const aboutLink = screen.getByTestId("link-/about");
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  // ===== TEST 4: Contact Link Display (Output-based) =====
  it("should display Contact link", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify Contact link is visible)
    const contactLink = screen.getByText("Contact");
    expect(contactLink).toBeInTheDocument();
  });

  // ===== TEST 5: Contact Link Navigation (Output-based) =====
  it("should provide Contact link pointing to correct path", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify Contact link points to /contact)
    const contactLink = screen.getByTestId("link-/contact");
    expect(contactLink).toHaveAttribute("href", "/contact");
  });

  // ===== TEST 6: Privacy Policy Link Display (Output-based) =====
  it("should display Privacy Policy link", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify Privacy Policy link is visible)
    const policyLink = screen.getByText("Privacy Policy");
    expect(policyLink).toBeInTheDocument();
  });

  // ===== TEST 7: Privacy Policy Link Navigation (Output-based) =====
  it("should provide Privacy Policy link pointing to correct path", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify Privacy Policy link points to /policy)
    const policyLink = screen.getByTestId("link-/policy");
    expect(policyLink).toHaveAttribute("href", "/policy");
  });

  // ===== TEST 8: All Navigation Links Present (Output-based) =====
  it("should display all three navigation links together", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify all navigation links are present)
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  // ===== TEST 9: Complete Footer Content (Output-based) =====
  it("should display complete footer with copyright and all links", () => {
    // Arrange & Act
    renderFooter();

    // Assert (verify both copyright and links are present)
    expect(
      screen.getByText(/All Rights Reserved.*TestingComp/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("link-/about")).toHaveAttribute("href", "/about");
    expect(screen.getByTestId("link-/contact")).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByTestId("link-/policy")).toHaveAttribute(
      "href",
      "/policy",
    );
  });
});
