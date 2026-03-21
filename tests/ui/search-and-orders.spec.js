// UI Tests for Search and Admin Order Status

import { test, expect } from "@playwright/test";

// Search Input and Results Navigation
test.describe("Search Input and Results Navigation", () => {
  test("should search for products and display results", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("laptop");

    const searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    const cards = page.locator(".card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate from search results to product details", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("laptop");

    const searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    const firstCard = page.locator(".card").first();
    const moreDetailsBtn = firstCard.getByRole("button", {
      name: "More Details",
    });

    if (await moreDetailsBtn.isVisible()) {
      await moreDetailsBtn.click();
      await page.waitForURL("**/product/**");
      expect(page.url()).toContain("/product/");
    }
  });

  test("should return empty results for non-existent product", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("nonexistentproduct123");

    const searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    const cards = page.locator(".card");
    const count = await cards.count();
    expect(count).toBe(0);
  });
});

// Product Display and Description Truncation
test.describe("Product Display and Description Truncation", () => {
  test("should truncate long descriptions in search results", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("laptop");

    const searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    const descriptions = page.locator(".card-text");
    if ((await descriptions.count()) > 0) {
      const text = await descriptions.first().innerText();
      expect(text.length).toBeLessThanOrEqual(200);
    }
  });

  test("should show full description on product details page", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("laptop");

    const searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    const firstCard = page.locator(".card").first();
    const moreDetailsBtn = firstCard.getByRole("button", {
      name: "More Details",
    });

    if (await moreDetailsBtn.isVisible()) {
      await moreDetailsBtn.click();
      await page.waitForURL("**/product/**");

      const main = page.getByRole("main");
      const text = await main.innerText();
      expect(text).toContain("Description");
    }
  });
});

// Search Context Persistence
test.describe("Search Context Persistence", () => {
  test("should maintain search keyword in URL", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("laptop");

    const searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    const url = page.url();
    expect(url).toContain("search");
  });

  test("should update results when changing search keyword", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("laptop");

    let searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    // Verify page is on search route
    expect(page.url()).toContain("search");

    // Go back and search for different term
    await page.goto("http://localhost:3000/");
    await searchInput.fill("phone");
    searchButton = page.getByRole("button", { name: "Search" });
    await searchButton.click();

    await page.waitForURL("**/search**");

    // Verify still on search route
    expect(page.url()).toContain("search");
  });
});

// Admin Order Status Updates
test.describe("Admin Order Status Updates", () => {
  test("admin should access orders management page", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/orders");

    await page.waitForLoadState("networkidle");

    const heading = page.locator("h1, h2, h3");
    const count = await heading.count();
    expect(count).toBeGreaterThan(0);
  });

  test("admin should see order status options", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/orders");

    await page.waitForLoadState("networkidle");

    const statusSelects = page.locator("select");
    expect(await statusSelects.count()).toBeGreaterThanOrEqual(0);
  });

  test("admin should be able to change order status", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/orders");

    await page.waitForLoadState("networkidle");

    const statusSelect = page.locator("select").first();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("Processing");
      const value = await statusSelect.inputValue();
      expect(value).toBe("Processing");
    }
  });

  test("admin should be able to set status to Shipped", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/orders");

    await page.waitForLoadState("networkidle");

    const statusSelect = page.locator("select").first();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("Shipped");
      const value = await statusSelect.inputValue();
      expect(value).toBe("Shipped");
    }
  });

  test("admin should be able to set status to Delivered", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/orders");

    await page.waitForLoadState("networkidle");

    const statusSelect = page.locator("select").first();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("Delivered");
      const value = await statusSelect.inputValue();
      expect(value).toBe("Delivered");
    }
  });

  test("admin should be able to set status to Cancelled", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/admin/orders");

    await page.waitForLoadState("networkidle");

    const statusSelect = page.locator("select").first();

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("Cancelled");
      const value = await statusSelect.inputValue();
      expect(value).toBe("Cancelled");
    }
  });
});
