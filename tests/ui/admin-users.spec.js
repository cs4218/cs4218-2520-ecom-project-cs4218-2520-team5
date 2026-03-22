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

async function expectUsersPageContent(page) {
  await expect(page).toHaveURL("/dashboard/admin/users");
  await expect(page).toHaveTitle("Dashboard - All Users");
  await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
}

async function expectAdminPanelVisible(page) {
  await expect(page.getByRole("heading", { name: "Admin Panel" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create Category" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create Product" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
}

test.describe("Story: Admin Users Page E2E Journeys", () => {
  test("guest blocked from admin users page -> redirected to login", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/users");

    // Guest should be blocked (spinner redirect to login)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
  });

  test("regular user blocked from admin users page -> redirected to login", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");

    // Regular user should be blocked from admin routes
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
  });

  test("admin journey: Login -> Admin Dashboard -> Users page via direct navigation", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL("/dashboard/admin");
    await expect(
      page.locator("h3").filter({ hasText: "Admin Name" }),
    ).toBeVisible({ timeout: 15000 });

    // Navigate to users page
    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);
    await expectAdminPanelVisible(page);
  });

  test("admin journey: Login -> Users -> AdminMenu sidebar -> Create Category -> Users", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Navigate to Create Category via AdminMenu sidebar
    await page.getByRole("link", { name: "Create Category" }).click();
    await expect(page).toHaveURL("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible({ timeout: 15000 });

    // Navigate back to users
    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);
  });

  test("admin journey: Login -> Users -> AdminMenu sidebar -> Create Product", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Navigate to Create Product via AdminMenu sidebar
    await page.getByRole("link", { name: "Create Product" }).click();
    await expect(page).toHaveURL("/dashboard/admin/create-product");
    await expect(
      page.getByRole("heading", { name: "Create Product" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("admin journey: Login -> Users -> AdminMenu sidebar -> Products -> Users", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Navigate to Products via AdminMenu sidebar
    await page.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL("/dashboard/admin/products");
    await expect(
      page.getByRole("heading", { name: "All Products List" }),
    ).toBeVisible({ timeout: 15000 });

    // Navigate back to users
    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);
  });

  test("admin journey: Login -> Users -> AdminMenu sidebar -> Orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Navigate to Orders via AdminMenu sidebar
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL("/dashboard/admin/orders");
    await expect(
      page.getByRole("heading", { name: "All Orders" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("admin journey: Login -> Users -> search product -> Users", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Use the search bar
    await page.getByRole("searchbox", { name: "Search" }).fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();

    // Navigate back to users
    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);
  });

  test("admin journey: Login -> Users -> About via footer -> browser back to Users", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Navigate to About
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("img", { name: "aboutus" })).toBeVisible();

    // Browser back
    await page.goBack();
    await expectUsersPageContent(page);
  });

  test("admin journey: Login -> Users -> logout -> blocked from Users", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Logout via header dropdown
    await page.locator("a.nav-link.dropdown-toggle").last().click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Logout" })
      .click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

    // Trying to access admin users after logout should redirect
    await page.goto("/dashboard/admin/users");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("admin journey: Login -> Users -> Header user dropdown -> Dashboard -> Users", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Navigate to dashboard via header dropdown
    await page.locator("a.nav-link.dropdown-toggle").last().click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Dashboard" })
      .click();

    await expect(page).toHaveURL("/dashboard/admin", { timeout: 15000 });
    await expect(
      page.locator("h3").filter({ hasText: "Admin Name" }),
    ).toBeVisible({ timeout: 15000 });

    // Navigate back to users
    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);
  });

  test("mobile responsive journey: Login -> Users -> toggle nav -> Categories", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Open mobile nav and navigate to categories
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");
  });

  test("recovery journey: Login -> Users -> 404 -> Go Back -> Home -> Users", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);

    // Navigate to invalid route
    await page.goto("/dashboard/admin/users/nonexistent");
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

    // Return to users
    await page.goto("/dashboard/admin/users");
    await expectUsersPageContent(page);
  });
});
