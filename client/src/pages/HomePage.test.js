// Alyssa Ong, A0264663X
// These test cases are generated with the help of AI.

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import axios from "axios";
import HomePage from "./HomePage";

// Mock dependencies for isolation (Fast + Isolated principle)
jest.mock("axios");
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../components/Layout", () => {
  return function Layout({ children, title }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe("HomePage Component", () => {
  let mockSetCart;
  let mockCart;
  let consoleErrorSpy;

  // Helper to render HomePage and wait for async operations
  const renderHomePage = async () => {
    const result = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    // Wait for initial data fetching
    await waitFor(() => {});
    return result;
  };

  beforeAll(() => {
    // Suppress React warnings about duplicate keys and other noise
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation((message) => {
        if (
          typeof message === "string" &&
          (message.includes("Encountered two children with the same key") ||
            message.includes("Warning:"))
        ) {
          return;
        }
        console.warn(message);
      });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetCart = jest.fn();
    mockCart = [];

    require("../context/cart").useCart.mockReturnValue([mockCart, mockSetCart]);

    // Mock localStorage
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn();

    // Default successful API responses
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({
          data: {
            success: true,
            category: [
              { _id: "cat1", name: "Electronics" },
              { _id: "cat2", name: "Books" },
            ],
          },
        });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 5 } });
      }
      if (url.includes("/product-list")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "prod1",
                name: "Laptop",
                description: "High performance laptop for gaming and work",
                price: 1200,
                slug: "laptop",
              },
              {
                _id: "prod2",
                name: "Book",
                description: "Interesting book about software testing",
                price: 25,
                slug: "book",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    axios.post.mockResolvedValue({
      data: { products: [] },
    });
  });

  // ===== PRODUCT DISPLAY TESTS =====
  // Testing Style: Output-based (verify what renders)

  it("should display all products when loaded", async () => {
    // Arrange & Act
    await renderHomePage();

    // Assert - verify products are displayed
    await waitFor(() => {
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Book")).toBeInTheDocument();
    });
  });

  it("should display product prices in USD format", async () => {
    // Arrange & Act
    await renderHomePage();

    // Assert - verify price formatting
    await waitFor(() => {
      expect(screen.getByText("$1,200.00")).toBeInTheDocument();
      expect(screen.getByText("$25.00")).toBeInTheDocument();
    });
  });

  it("should display truncated product descriptions", async () => {
    // Arrange & Act
    await renderHomePage();

    // Assert - verify description appears (truncated)
    await waitFor(() => {
      expect(
        screen.getByText(/High performance laptop for gaming and work/i),
      ).toBeInTheDocument();
    });
  });

  // ===== CATEGORY FILTER TESTS =====
  // Testing Style: Output-based

  it("should display category filter checkboxes", async () => {
    // Arrange & Act
    await renderHomePage();

    // Assert - verify categories render as filter options
    await waitFor(() => {
      expect(screen.getByText("Filter By Category")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
  });

  it("should call filter API when category is selected", async () => {
    // Arrange
    await renderHomePage();

    // Act - select a category filter
    await waitFor(() => {
      const electronicsCheckbox = screen.getByText("Electronics");
      fireEvent.click(electronicsCheckbox);
    });

    // Assert - verify filter API called with correct data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["cat1"]),
        }),
      );
    });
  });

  // ===== CART FUNCTIONALITY TESTS =====
  // Testing Style: Communication-based (verify interactions)

  it("should add product to cart when ADD TO CART clicked", async () => {
    // Arrange
    await renderHomePage();

    // Act - click add to cart button
    await waitFor(() => {
      const addToCartButtons = screen.getAllByText("ADD TO CART");
      fireEvent.click(addToCartButtons[0]);
    });

    // Assert - verify cart updated with product
    expect(mockSetCart).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _id: "prod1",
          name: "Laptop",
          price: 1200,
        }),
      ]),
    );
  });

  it("should save cart to localStorage when product added", async () => {
    // Arrange
    await renderHomePage();

    // Act - add product to cart
    await waitFor(() => {
      const addToCartButtons = screen.getAllByText("ADD TO CART");
      fireEvent.click(addToCartButtons[0]);
    });

    // Assert - verify localStorage updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "cart",
      expect.stringContaining("Laptop"),
    );
  });

  // ===== NAVIGATION TESTS =====
  // Testing Style: Communication-based

  it("should navigate to product details when More Details clicked", async () => {
    // Arrange
    await renderHomePage();

    // Act - click more details button
    await waitFor(() => {
      const detailsButtons = screen.getAllByText("More Details");
      fireEvent.click(detailsButtons[0]);
    });

    // Assert - verify navigation to correct product page
    expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
  });

  // ===== PAGINATION TESTS =====
  // Testing Style: State-based (verify state changes)

  it("should display load more button when more products available", async () => {
    // Arrange - total is 5, but only 2 products loaded
    await renderHomePage();

    // Assert - load more button should appear
    await waitFor(() => {
      expect(screen.getByText(/Loadmore/i)).toBeInTheDocument();
    });
  });

  it("should not display load more button when all products loaded", async () => {
    // Arrange - mock total equals products loaded
    axios.get.mockImplementation((url) => {
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 2 } });
      }
      if (url.includes("/product-list")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Product 1",
                price: 100,
                slug: "p1",
                description: "desc1",
              },
              {
                _id: "p2",
                name: "Product 2",
                price: 200,
                slug: "p2",
                description: "desc2",
              },
            ],
          },
        });
      }
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    await renderHomePage();

    // Assert - load more button should NOT appear
    await waitFor(() => {
      expect(screen.queryByText(/Loadmore/i)).not.toBeInTheDocument();
    });
  });

  // ===== ERROR HANDLING EDGE CASES =====
  // Testing Style: State-based (verify graceful degradation)

  it("should display empty products gracefully when API fails", async () => {
    // Arrange - mock API failure
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 0 } });
      }
      if (url.includes("/product-list")) {
        return Promise.reject(new Error("API Error"));
      }
      return Promise.resolve({ data: {} });
    });

    // Act
    await renderHomePage();

    // Assert - page renders without crashing
    await waitFor(() => {
      expect(screen.getByText("All Products")).toBeInTheDocument();
      // No products displayed
      expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
    });
  });

  it("should render page gracefully when category fetch fails", async () => {
    // Arrange - category API fails
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.reject(new Error("Category API Error"));
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 2 } });
      }
      if (url.includes("/product-list")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Product 1",
                price: 100,
                slug: "p1",
                description: "desc",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    // Act
    await renderHomePage();

    // Assert - page renders with products despite category error
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });
  });

  it("should render page gracefully when product count fetch fails", async () => {
    // Arrange - product count API fails
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      if (url.includes("/product-count")) {
        return Promise.reject(new Error("Count API Error"));
      }
      if (url.includes("/product-list")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Product 1",
                price: 100,
                slug: "p1",
                description: "desc",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    // Act
    await renderHomePage();

    // Assert - page renders with products despite count error
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });
  });

  // ===== PRICE FILTER TESTS =====
  // Testing Style: Communication-based

  it("should call filter API when price range is selected", async () => {
    // Arrange
    await renderHomePage();

    // Act - select a price filter
    await waitFor(() => {
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
    });

    const priceRadio = screen.getByText(/\$0 to 19/i);
    fireEvent.click(priceRadio);

    // Assert - verify filter API called with price range
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          radio: expect.any(Array),
        }),
      );
    });
  });

  it("should display filtered products when filter API succeeds", async () => {
    // Arrange
    axios.post.mockResolvedValue({
      data: {
        products: [
          {
            _id: "filtered1",
            name: "Filtered Product",
            price: 50,
            slug: "filtered",
            description: "Filtered item",
          },
        ],
      },
    });

    await renderHomePage();

    // Act - apply filter
    await waitFor(() => {
      const checkbox = screen.getByText("Electronics");
      fireEvent.click(checkbox);
    });

    // Assert - filtered products appear
    await waitFor(() => {
      expect(screen.getByText("Filtered Product")).toBeInTheDocument();
    });
  });

  it("should handle filter API error gracefully", async () => {
    // Arrange - filter API fails
    axios.post.mockRejectedValue(new Error("Filter API Error"));

    await renderHomePage();

    // Act - try to apply filter
    await waitFor(() => {
      const checkbox = screen.getByText("Electronics");
      fireEvent.click(checkbox);
    });

    // Assert - page still renders without crashing
    await waitFor(() => {
      expect(screen.getByText("All Products")).toBeInTheDocument();
    });
  });

  // ===== LOAD MORE FUNCTIONALITY TESTS =====
  // Testing Style: State-based & Communication-based

  it("should load more products when loadmore button clicked", async () => {
    // Arrange
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      }
      if (url.includes("/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Product 1",
                price: 100,
                slug: "p1",
                description: "desc1",
              },
            ],
          },
        });
      }
      if (url.includes("/product-list/2")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p2",
                name: "Product 2",
                price: 200,
                slug: "p2",
                description: "desc2",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    await renderHomePage();

    // Act - click load more
    await waitFor(() => {
      const loadMoreBtn = screen.getByText(/Loadmore/i);
      fireEvent.click(loadMoreBtn);
    });

    // Assert - page 2 API called
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
    });
  });

  it("should display loading state when loading more products", async () => {
    // Arrange
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      }
      if (url.includes("/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Product 1",
                price: 100,
                slug: "p1",
                description: "desc1",
              },
            ],
          },
        });
      }
      if (url.includes("/product-list/2")) {
        // Delay response to capture loading state
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  products: [
                    {
                      _id: "p2",
                      name: "Product 2",
                      price: 200,
                      slug: "p2",
                      description: "desc2",
                    },
                  ],
                },
              }),
            100,
          ),
        );
      }
      return Promise.resolve({ data: {} });
    });

    await renderHomePage();

    // Act - click load more
    await waitFor(() => {
      const loadMoreBtn = screen.getByText(/Loadmore/i);
      fireEvent.click(loadMoreBtn);
    });

    // Assert - loading text appears
    await waitFor(() => {
      expect(screen.getByText("Loading ...")).toBeInTheDocument();
    });
  });

  it("should handle load more API error gracefully", async () => {
    // Arrange
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-category")) {
        return Promise.resolve({ data: { success: true, category: [] } });
      }
      if (url.includes("/product-count")) {
        return Promise.resolve({ data: { total: 10 } });
      }
      if (url.includes("/product-list/1")) {
        return Promise.resolve({
          data: {
            products: [
              {
                _id: "p1",
                name: "Product 1",
                price: 100,
                slug: "p1",
                description: "desc1",
              },
            ],
          },
        });
      }
      if (url.includes("/product-list/2")) {
        return Promise.reject(new Error("Load more failed"));
      }
      return Promise.resolve({ data: {} });
    });

    await renderHomePage();

    // Act - click load more
    await waitFor(() => {
      const loadMoreBtn = screen.getByText(/Loadmore/i);
      fireEvent.click(loadMoreBtn);
    });

    // Assert - page still renders with original products
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });
  });

  // ===== RESET FILTERS TEST =====
  // Testing Style: Communication-based

  it("should reload page when reset filters button clicked", async () => {
    // Arrange - mock window.location.reload
    const reloadMock = jest.fn();
    delete window.location;
    window.location = { reload: reloadMock };

    await renderHomePage();

    // Act - click reset filters
    await waitFor(() => {
      const resetBtn = screen.getByText("RESET FILTERS");
      fireEvent.click(resetBtn);
    });

    // Assert - page reload triggered
    expect(reloadMock).toHaveBeenCalled();
  });
});
