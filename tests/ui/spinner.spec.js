// Alyssa Ong, A0264663X
// Assisted with AI

import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@12345";

function spinnerHeading(page) {
  return page.locator("h1", { hasText: "redirecting to you in" });
}

function spinnerLoader(page) {
  return page.locator(".spinner-border[role='status']");
}

async function expectSpinnerVisible(page) {
  await expect(spinnerHeading(page)).toBeVisible({ timeout: 8000 });
  await expect(spinnerLoader(page)).toBeVisible();
}

async function loginWithCredentials(page, email, password = TEST_PASSWORD) {
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
}

test.describe("Story: Spinner Component E2E Journeys", () => {
  test("guest blocked from /dashboard/user -> spinner -> redirect to home", async ({
    page,
  }) => {
    await page.goto("/dashboard/user");

    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
  });

  test("guest blocked from /dashboard/user/profile -> spinner -> redirect to home", async ({
    page,
  }) => {
    await page.goto("/dashboard/user/profile");

    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
  });

  test("guest blocked from /dashboard/user/orders -> spinner -> redirect to home", async ({
    page,
  }) => {
    await page.goto("/dashboard/user/orders");

    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
  });

  test("guest blocked from /dashboard/admin -> spinner -> redirect to login", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
  });

  test("guest blocked from /dashboard/admin/create-category -> spinner -> redirect to login", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/create-category");

    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
  });

  test("guest deep-link to admin, login as regular user, and get blocked again by spinner", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");
    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    await loginWithCredentials(page, "ivan.playwright.user@test.com");

    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("guest redirected home from private route can login and continue to user orders", async ({
    page,
  }) => {
    await page.goto("/dashboard/user/orders");
    await expectSpinnerVisible(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    await page.getByRole("link", { name: "Login" }).click();
    await loginWithCredentials(page, "ivan.playwright.user@test.com");

    await expect(page).toHaveURL("/");
    const userMenu = page.locator("a.nav-link.dropdown-toggle").last();
    await userMenu.click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Dashboard" })
      .click();

    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL("/dashboard/user/orders");
    await expect(
      page.getByRole("heading", { name: "All Orders" }),
    ).toBeVisible();
  });

  test("spinner countdown updates and performs a single redirect", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expect(spinnerHeading(page)).toContainText("3", { timeout: 2000 });
    await expect(spinnerHeading(page)).toContainText("2", { timeout: 2500 });
    await expect(spinnerHeading(page)).toContainText("1", { timeout: 2500 });

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
    await expect(spinnerHeading(page)).not.toBeVisible();
  });

  test("spinner includes screen-reader loading text", async ({ page }) => {
    await page.goto("/dashboard/admin");

    await expectSpinnerVisible(page);
    await expect(page.locator(".visually-hidden")).toHaveText("Loading...");
  });

  test("spinner countdown uses correct singular and plural wording", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expect(spinnerHeading(page)).toContainText("3 seconds", {
      timeout: 2500,
    });
    await expect(spinnerHeading(page)).toContainText("2 seconds", {
      timeout: 2500,
    });
    await expect(spinnerHeading(page)).toContainText("1 second", {
      timeout: 2500,
    });
  });

  test("spinner should not appear on public routes", async ({ page }) => {
    const publicRoutes = [
      "/",
      "/about",
      "/contact",
      "/policy",
      "/categories",
      "/login",
      "/register",
    ];

    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(spinnerHeading(page)).not.toBeVisible();
      await expect(spinnerLoader(page)).not.toBeVisible();
    }
  });

  test("spinner appears across additional protected admin routes for guest", async ({
    page,
  }) => {
    const protectedAdminRoutes = [
      "/dashboard/admin/users",
      "/dashboard/admin/products",
    ];

    for (const route of protectedAdminRoutes) {
      await page.goto(route);
      await expectSpinnerVisible(page);
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      await expect(
        page.getByRole("heading", { name: "LOGIN FORM" }),
      ).toBeVisible();
    }
  });
});
