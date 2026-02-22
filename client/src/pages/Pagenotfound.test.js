// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Pagenotfound from "./Pagenotfound";

// Mock external dependencies to achieve isolation (unit test requirement)
jest.mock("./../components/Layout", () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, className }) => (
    <a href={to} className={className} data-testid="link">
      {children}
    </a>
  ),
}));

describe("Pagenotfound Component - Unit Tests", () => {
  // Helper to render component
  const renderPagenotfound = () => {
    return render(<Pagenotfound />);
  };

  // ===== TEST 1: Layout Integration (Output-based) =====
  it("should render with correct page title in Layout", () => {
    // Arrange & Act
    renderPagenotfound();

    // Assert (verify Layout receives correct title)
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "go back- page not found",
    );
  });

  // ===== TEST 2: 404 Error Code Display (Output-based) =====
  it("should display 404 error code to users", () => {
    // Arrange & Act
    renderPagenotfound();

    // Assert (verify 404 code is visible)
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  // ===== TEST 3: Error Message Display (Output-based) =====
  it("should display error message for page not found", () => {
    // Arrange & Act
    renderPagenotfound();

    // Assert (verify error message is visible)
    expect(screen.getByText("Oops ! Page Not Found")).toBeInTheDocument();
  });

  // ===== TEST 4: Go Back Link Display (Output-based) =====
  it("should display Go Back link to users", () => {
    // Arrange & Act
    renderPagenotfound();

    // Assert (verify link text is visible)
    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  // ===== TEST 5: Link Navigation Target (Output-based) =====
  it("should provide link to home page", () => {
    // Arrange & Act
    renderPagenotfound();

    // Assert (verify link points to home)
    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "/");
  });

  // ===== TEST 6: Complete Error Page Structure (Output-based) =====
  it("should display all required error page elements together", () => {
    // Arrange & Act
    renderPagenotfound();

    // Assert (verify all key elements are present)
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Oops ! Page Not Found")).toBeInTheDocument();
    expect(screen.getByText("Go Back")).toBeInTheDocument();
    expect(screen.getByTestId("link")).toHaveAttribute("href", "/");
  });
});
