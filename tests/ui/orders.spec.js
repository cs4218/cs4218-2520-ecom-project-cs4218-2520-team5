// Alyssa Ong, A0264663X
// Assisted with AI

import { test, expect } from "@playwright/test";

async function loginViaUI(page, email, password) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "LOGIN FORM" })).toBeVisible();
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  // Wait for successful login redirect
  await expect(page).not.toHaveURL("/login", { timeout: 15000 });
}

async function expectOrdersPageContent(page) {
  await expect(page).toHaveURL("/dashboard/user/orders");
  await expect(page).toHaveTitle("Your Orders");
  await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
}

test.describe("Story: Orders Page E2E Journeys", () => {
  test("guest blocked from orders page -> redirected to home", async ({
    page,
  }) => {
    await page.goto("/dashboard/user/orders");

    // Guest should be blocked (spinner redirect)
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
  });

  test("authenticated user journey: Login -> Dashboard -> Orders via UserMenu", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user");
    await expect(
      page.getByRole("heading", { name: "Ivan PW User" }),
    ).toBeVisible({ timeout: 15000 });

    // Navigate to Orders via UserMenu sidebar
    await page.getByRole("link", { name: "Orders" }).click();
    await expectOrdersPageContent(page);
  });

  test("authenticated user journey: Login -> Orders -> Profile -> Orders (sidebar navigation)", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    // Go to orders
    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Navigate to Profile via sidebar
    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL("/dashboard/user/profile");
    await expect(page.getByRole("heading", { name: "USER PROFILE" })).toBeVisible();

    // Navigate back to Orders via sidebar
    await page.getByRole("link", { name: "Orders" }).click();
    await expectOrdersPageContent(page);
  });

  test("authenticated user journey: Login -> Orders -> verify order table columns", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // If there are orders, verify the table headers are displayed
    const tables = page.locator("table.table");
    const tableCount = await tables.count();

    if (tableCount > 0) {
      // Verify order table has the expected column headers
      const firstTable = tables.first();
      await expect(firstTable.locator("th", { hasText: "#" })).toBeVisible();
      await expect(firstTable.locator("th", { hasText: "Status" })).toBeVisible();
      await expect(firstTable.locator("th", { hasText: "Buyer" })).toBeVisible();
      await expect(firstTable.locator("th", { hasText: "date" })).toBeVisible();
      await expect(firstTable.locator("th", { hasText: "Payment" })).toBeVisible();
      await expect(firstTable.locator("th", { hasText: "Quantity" })).toBeVisible();
    }
  });

  test("authenticated user journey: Login -> Browse products -> Add to cart -> Cart -> Orders continuity", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    // Browse home page and add item to cart
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    // Go to cart
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();

    // Navigate to orders to check existing orders
    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Verify cart badge persists while on orders page
    await expect(page.getByRole("superscript")).toContainText("1");
  });

  test("authenticated user journey: Login -> Orders -> search for product -> back to Orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Use the search bar from the orders page
    await page.getByRole("searchbox", { name: "Search" }).fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();

    // Navigate back to orders
    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);
  });

  test("authenticated user journey: Login -> Orders -> About via footer -> browser back to Orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Navigate to About via footer
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("img", { name: "aboutus" })).toBeVisible();

    // Browser back to orders
    await page.goBack();
    await expectOrdersPageContent(page);
  });

  test("authenticated user journey: Login -> Orders -> Header user dropdown -> logout -> redirected away", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Logout via header dropdown
    await page.locator("a.nav-link.dropdown-toggle").last().click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Logout" })
      .click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

    // Trying to access orders after logout should redirect
    await page.goto("/dashboard/user/orders");
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test("authenticated user journey: Login -> Product details -> Add to cart -> Dashboard -> Orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    // Browse home page and view product details
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();

    // Add to cart from product details page
    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByRole("superscript")).toContainText("1", {
      timeout: 5000,
    });

    // Navigate to dashboard via user menu
    await page.locator("a.nav-link.dropdown-toggle").last().click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Dashboard" })
      .click();
    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });

    // Navigate to orders via sidebar
    await page.getByRole("link", { name: "Orders" }).click();
    await expectOrdersPageContent(page);

    // Cart badge should still persist on orders page
    await expect(page.getByRole("superscript")).toContainText("1");
  });

  test("mobile responsive journey: Login -> Orders -> toggle nav -> Categories", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Open mobile nav and navigate to categories
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");
  });

  test("authenticated user journey: Login -> Orders -> Contact -> Privacy Policy -> Orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Navigate to Contact
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(page.getByRole("heading", { name: "CONTACT US" })).toBeVisible();

    // Navigate to Privacy Policy
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(page.getByRole("img", { name: "privacy policy" })).toBeVisible();

    // Return to orders
    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);
  });

  test("recovery journey: Login -> Orders -> 404 -> Go Back -> Home -> Orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);

    // Navigate to invalid route
    await page.goto("/dashboard/user/orders/invalid-page");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Oops ! Page Not Found" }),
    ).toBeVisible();

    // Go back to home
    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    // Return to orders
    await page.goto("/dashboard/user/orders");
    await expectOrdersPageContent(page);
  });
});
