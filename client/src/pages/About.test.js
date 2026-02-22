// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "./About";

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

describe("About Component - Unit Tests", () => {
  // Helper to render component
  const renderAbout = () => {
    return render(<About />);
  };

  // ===== TEST 1: Layout Integration (Output-based) =====
  it("should render with correct page title in Layout", () => {
    // Arrange & Act
    renderAbout();

    // Assert (verify Layout receives correct title)
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "About us - Ecommerce app",
    );
  });

  // ===== TEST 2: About Image Display (Output-based) =====
  it("should display about image with correct attributes", () => {
    // Arrange & Act
    renderAbout();

    // Assert (verify image is rendered with proper attributes)
    const image = screen.getByAltText("aboutus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/about.jpeg");
  });

  // ===== TEST 3: Company Description Display (Output-based) =====
  it("should display company welcome message", () => {
    // Arrange & Act
    renderAbout();

    // Assert (verify welcome text is visible to users)
    expect(screen.getByText(/Welcome to Virtual Vault/i)).toBeInTheDocument();
  });

  // ===== TEST 4: Service Commitment Display (Output-based) =====
  it("should display commitment to excellent service", () => {
    // Arrange & Act
    renderAbout();

    // Assert (verify service commitment message is visible)
    expect(
      screen.getByText(/committed to providing excellent service/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 5: Shopping Experience Message (Output-based) =====
  it("should display seamless shopping experience message", () => {
    // Arrange & Act
    renderAbout();

    // Assert (verify shopping experience promise is visible)
    expect(
      screen.getByText(/seamless shopping experience/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 6: Complete About Text Display (Output-based) =====
  it("should display the complete about description to users", () => {
    // Arrange & Act
    renderAbout();

    // Assert (verify full descriptive text is visible)
    const fullText = screen.getByText(
      /Welcome to Virtual Vault, your trusted online marketplace for quality products\. We are committed to providing excellent service and a seamless shopping experience\./i,
    );
    expect(fullText).toBeInTheDocument();
  });
});
