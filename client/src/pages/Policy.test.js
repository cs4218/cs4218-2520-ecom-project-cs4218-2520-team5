// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Policy from "./Policy";

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

describe("Policy Component - Unit Tests", () => {
  // Helper to render component
  const renderPolicy = () => {
    return render(<Policy />);
  };

  // ===== TEST 1: Layout Integration (Output-based) =====
  it("should render with correct page title in Layout", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify Layout receives correct title)
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-title",
      "Privacy Policy",
    );
  });

  // ===== TEST 2: Policy Image Display (Output-based) =====
  it("should display privacy policy image with correct attributes", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify image is rendered with proper attributes)
    const image = screen.getByAltText("privacy policy");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  // ===== TEST 3: Privacy Value Statement (Output-based) =====
  it("should display privacy value statement to users", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify privacy commitment message is visible)
    expect(
      screen.getByText(
        /We value your privacy and are committed to protecting/i,
      ),
    ).toBeInTheDocument();
  });

  // ===== TEST 4: Data Collection Policy (Output-based) =====
  it("should display data collection information", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify data collection policy is visible)
    expect(
      screen.getByText(/We collect only necessary information/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 5: Data Sharing Policy (Output-based) =====
  it("should display data sharing policy statement", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify third-party sharing policy is visible)
    expect(
      screen.getByText(/never shared with third parties without your consent/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 6: Encryption Information (Output-based) =====
  it("should display payment security information", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify encryption information is visible)
    expect(
      screen.getByText(/industry-standard encryption to protect your payment/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 7: User Rights Information (Output-based) =====
  it("should display user data rights information", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify user rights statement is visible)
    expect(
      screen.getByText(
        /right to access, modify, or delete your personal data/i,
      ),
    ).toBeInTheDocument();
  });

  // ===== TEST 8: Cookie Policy (Output-based) =====
  it("should display cookie usage policy", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify cookie policy is visible)
    expect(
      screen.getByText(/We may use cookies to enhance your browsing/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 9: Contact Information (Output-based) =====
  it("should display contact information for privacy questions", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify contact information is visible)
    expect(
      screen.getByText(/For questions about our privacy practices/i),
    ).toBeInTheDocument();
  });

  // ===== TEST 10: Multiple Policy Sections (Output-based) =====
  it("should display all seven privacy policy sections", () => {
    // Arrange & Act
    renderPolicy();

    // Assert (verify all major policy sections are present)
    const paragraphs = screen.getAllByText(/./);
    const policyParagraphs = paragraphs.filter(
      (p) => p.tagName === "P" && p.textContent.length > 10,
    );

    // Should have at least 7 policy paragraphs
    expect(policyParagraphs.length).toBeGreaterThanOrEqual(7);
  });
});
