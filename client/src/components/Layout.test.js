// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";

// Mock child components to achieve isolation (unit test requirement)
// This prevents testing Header's complex auth/cart logic
jest.mock("./Header", () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock("./Footer", () => {
  return function MockFooter() {
    return <div data-testid="mock-footer">Footer</div>;
  };
});

// Mock react-helmet to test meta tag props
jest.mock("react-helmet", () => ({
  Helmet: ({ children, ...props }) => (
    <div data-testid="mock-helmet" {...props}>
      {children}
    </div>
  ),
}));

// Mock react-hot-toast Toaster
jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="mock-toaster">Toaster</div>,
}));

describe("Layout Component - Unit Tests", () => {
  // ===== TEST 1: Children Rendering (Output-based) =====
  it("should render children content passed to it", () => {
    // Arrange
    const testContent = "Test Page Content";

    // Act
    render(
      <Layout>
        <div>{testContent}</div>
      </Layout>,
    );

    // Assert (verify children are rendered)
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  // ===== TEST 2: Header Integration (Output-based) =====
  it("should render Header component", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify Header is present via mock)
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
  });

  // ===== TEST 3: Footer Integration (Output-based) =====
  it("should render Footer component", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify Footer is present via mock)
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
  });

  // ===== TEST 4: Toaster Integration (Output-based) =====
  it("should render Toaster component for notifications", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify Toaster is present via mock)
    expect(screen.getByTestId("mock-toaster")).toBeInTheDocument();
  });

  // ===== TEST 5: Default Title Meta Tag (Output-based) =====
  it("should use default title when no title prop provided", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify default title in Helmet mock)
    const helmet = screen.getByTestId("mock-helmet");
    expect(helmet.querySelector("title")).toHaveTextContent(
      "Ecommerce app - shop now",
    );
  });

  // ===== TEST 6: Custom Title Meta Tag (Output-based) =====
  it("should render custom title when title prop provided", () => {
    // Arrange
    const customTitle = "Custom Page Title";

    // Act
    render(<Layout title={customTitle}>Content</Layout>);

    // Assert (verify custom title in Helmet mock)
    const helmet = screen.getByTestId("mock-helmet");
    expect(helmet.querySelector("title")).toHaveTextContent(customTitle);
  });

  // ===== TEST 7: Default Meta Description (Output-based) =====
  it("should use default description when no description prop provided", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify default description meta tag)
    const helmet = screen.getByTestId("mock-helmet");
    const descMeta = helmet.querySelector('meta[name="description"]');
    expect(descMeta).toHaveAttribute("content", "mern stack project");
  });

  // ===== TEST 8: Custom Meta Description (Output-based) =====
  it("should render custom description when description prop provided", () => {
    // Arrange
    const customDesc = "Custom description for SEO";

    // Act
    render(<Layout description={customDesc}>Content</Layout>);

    // Assert (verify custom description)
    const helmet = screen.getByTestId("mock-helmet");
    const descMeta = helmet.querySelector('meta[name="description"]');
    expect(descMeta).toHaveAttribute("content", customDesc);
  });

  // ===== TEST 9: Default Keywords Meta Tag (Output-based) =====
  it("should use default keywords when no keywords prop provided", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify default keywords)
    const helmet = screen.getByTestId("mock-helmet");
    const keywordsMeta = helmet.querySelector('meta[name="keywords"]');
    expect(keywordsMeta).toHaveAttribute("content", "mern,react,node,mongodb");
  });

  // ===== TEST 10: Custom Keywords Meta Tag (Output-based) =====
  it("should render custom keywords when keywords prop provided", () => {
    // Arrange
    const customKeywords = "ecommerce,shopping,online";

    // Act
    render(<Layout keywords={customKeywords}>Content</Layout>);

    // Assert (verify custom keywords)
    const helmet = screen.getByTestId("mock-helmet");
    const keywordsMeta = helmet.querySelector('meta[name="keywords"]');
    expect(keywordsMeta).toHaveAttribute("content", customKeywords);
  });

  // ===== TEST 11: Default Author Meta Tag (Output-based) =====
  it("should use default author when no author prop provided", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify default author)
    const helmet = screen.getByTestId("mock-helmet");
    const authorMeta = helmet.querySelector('meta[name="author"]');
    expect(authorMeta).toHaveAttribute("content", "Techinfoyt");
  });

  // ===== TEST 12: Custom Author Meta Tag (Output-based) =====
  it("should render custom author when author prop provided", () => {
    // Arrange
    const customAuthor = "John Doe";

    // Act
    render(<Layout author={customAuthor}>Content</Layout>);

    // Assert (verify custom author)
    const helmet = screen.getByTestId("mock-helmet");
    const authorMeta = helmet.querySelector('meta[name="author"]');
    expect(authorMeta).toHaveAttribute("content", customAuthor);
  });

  // ===== TEST 13: UTF-8 Charset Meta Tag (Output-based) =====
  it("should render charset meta tag as utf-8", () => {
    // Arrange & Act
    render(<Layout>Content</Layout>);

    // Assert (verify charset meta tag)
    const helmet = screen.getByTestId("mock-helmet");
    const charsetMeta = helmet.querySelector('meta[charSet="utf-8"]');
    expect(charsetMeta).toBeInTheDocument();
  });

  // ===== TEST 14: Multiple Children Rendering (Output-based) =====
  it("should render multiple children elements", () => {
    // Arrange
    const child1 = "First child";
    const child2 = "Second child";

    // Act
    render(
      <Layout>
        <div>{child1}</div>
        <p>{child2}</p>
      </Layout>,
    );

    // Assert (verify both children are rendered)
    expect(screen.getByText(child1)).toBeInTheDocument();
    expect(screen.getByText(child2)).toBeInTheDocument();
  });

  // ===== TEST 15: All Custom Props Together (Output-based) =====
  it("should render all custom meta tags when all props provided", () => {
    // Arrange
    const props = {
      title: "About Us",
      description: "Learn about our company",
      keywords: "about,company,team",
      author: "Marketing Team",
    };

    // Act
    render(<Layout {...props}>Content</Layout>);

    // Assert (verify all custom props are applied)
    const helmet = screen.getByTestId("mock-helmet");
    expect(helmet.querySelector("title")).toHaveTextContent(props.title);
    expect(helmet.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      props.description,
    );
    expect(helmet.querySelector('meta[name="keywords"]')).toHaveAttribute(
      "content",
      props.keywords,
    );
    expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute(
      "content",
      props.author,
    );
  });
});
