// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Contact from "./Contact";

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

// Mock react-icons to avoid implementation details testing
jest.mock("react-icons/bi", () => ({
  BiMailSend: () => <span data-testid="mail-icon">📧</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">📞</span>,
  BiSupport: () => <span data-testid="support-icon">🎧</span>,
}));

describe("Contact Component - Unit Tests", () => {
  // Helper to render component
  const renderContact = () => {
    return render(<Contact />);
  };

  // ===== TEST 1: Layout Integration (Output-based) =====
  it("should render with correct page title in Layout", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify Layout receives correct title)
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Contact us",
    );
  });

  // ===== TEST 2: Main Heading Display (Output-based) =====
  it("should display 'CONTACT US' heading", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify user sees main heading)
    expect(screen.getByText("CONTACT US")).toBeInTheDocument();
  });

  // ===== TEST 3: Descriptive Text Display (Output-based) =====
  it("should display availability message to users", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify descriptive text is visible)
    expect(
      screen.getByText(
        /For any query or info about product, feel free to call anytime/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/available 24\/7/i)).toBeInTheDocument();
  });

  // ===== TEST 4: Email Contact Information (Output-based) =====
  it("should display email contact information", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify email is visible to users)
    expect(
      screen.getByText(/www\.help@ecommerceapp\.com/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 5: Phone Number Display (Output-based) =====
  it("should display phone number contact information", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify phone number is visible)
    expect(screen.getByText(/012-3456789/)).toBeInTheDocument();
  });

  // ===== TEST 6: Toll-Free Support Number (Output-based) =====
  it("should display toll-free support number with label", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify toll-free number and its label)
    expect(screen.getByText(/1800-0000-0000/)).toBeInTheDocument();
    expect(screen.getByText(/toll free/i)).toBeInTheDocument();
  });

  // ===== TEST 7: Contact Image Display (Output-based) =====
  it("should display contact image with correct attributes", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify image is rendered with proper attributes)
    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  // ===== TEST 8: All Contact Methods Visible (Output-based) =====
  it("should display all three contact methods simultaneously", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify all contact methods are available to user)
    expect(
      screen.getByText(/www\.help@ecommerceapp\.com/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/012-3456789/)).toBeInTheDocument();
    expect(screen.getByText(/1800-0000-0000/)).toBeInTheDocument();
  });

  // ===== TEST 9: Contact Icons Rendered (Output-based) =====
  it("should render contact method icons for visual clarity", () => {
    // Arrange & Act
    renderContact();

    // Assert (verify icons are rendered to aid user understanding)
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
    expect(screen.getByTestId("phone-icon")).toBeInTheDocument();
    expect(screen.getByTestId("support-icon")).toBeInTheDocument();
  });
});
