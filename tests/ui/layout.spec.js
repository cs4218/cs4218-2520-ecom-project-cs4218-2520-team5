// Alyssa Ong, A0264663X
// Assisted with AI

import { test, expect } from "@playwright/test";

function header(page) {
  return page.locator("nav.navbar");
}

function footer(page) {
  return page.locator(".footer");
}

async function expectLayoutShell(page) {
  await expect(header(page)).toBeVisible();
  await expect(footer(page)).toBeVisible();
  await expect(header(page).getByRole("link", { name: /Cart/i })).toBeVisible();
}

async function injectAuth(page, authData) {
  await page.addInitScript((auth) => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, authData);
}

test.describe("Story: Layout Component E2E Journeys", () => {
  test("guest navigation shell continuity: Home -> About -> Contact -> Policy -> Home", async ({ page }) => {
    await page.goto("/");
    await expectLayoutShell(page);
    await expect(page).toHaveTitle("ALL Products - Best offers ");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();

    await footer(page).getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL("/about");
    await expect(page).toHaveTitle("About us - Ecommerce app");
    await expectLayoutShell(page);

    await footer(page).getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(page).toHaveTitle("Contact us");
    await expect(page.getByRole("heading", { name: "CONTACT US" })).toBeVisible();
    await expectLayoutShell(page);

    await footer(page).getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(page).toHaveTitle("Privacy Policy");
    await expect(page.getByRole("img", { name: "privacy policy" })).toBeVisible();
    await expectLayoutShell(page);

    await header(page).getByRole("link", { name: /Virtual Vault/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    await expectLayoutShell(page);
  });

  test("search journey through global header: Home -> Search -> Product Details", async ({ page }) => {
    await page.goto("/");
    await expectLayoutShell(page);

    const searchInput = page.getByRole("searchbox", { name: "Search" });
    await searchInput.fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(page.getByRole("heading", { name: "Search Resuts" })).toBeVisible();
    await expect(page.locator("h6")).toContainText("Found");
    await expectLayoutShell(page);

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole("heading", { name: "Product Details" })).toBeVisible();
    await expectLayoutShell(page);

    await page.goBack();
    await expect(page).toHaveURL("/search");
    await expect(page.getByRole("heading", { name: "Search Resuts" })).toBeVisible();
  });

  test("cart continuity across layout links: add item -> navigate -> cart retains item", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(header(page).locator(".ant-badge-count")).toContainText("1");

    await footer(page).getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(page.getByRole("heading", { name: "CONTACT US" })).toBeVisible();
    await expect(header(page).locator(".ant-badge-count")).toContainText("1");

    await header(page).getByRole("link", { name: /Cart/i }).click();
    await expect(page).toHaveURL("/cart");
    await expect(page.getByRole("button", { name: "Remove" }).first()).toBeVisible();
    await expectLayoutShell(page);
  });

  test("auth-aware layout transition: authenticated menu visible and logout restores guest nav", async ({ page }) => {
    const userAuth = JSON.parse(process.env.USER_AUTH);
    await injectAuth(page, userAuth);

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });
    await expectLayoutShell(page);

    const userMenu = header(page).locator("a.nav-link.dropdown-toggle").last();
    await expect(userMenu).toContainText(userAuth.user.name);
    await expect(header(page).getByRole("link", { name: "Login" })).not.toBeVisible();
    await expect(header(page).getByRole("link", { name: "Register" })).not.toBeVisible();

    await userMenu.click();
    await page.locator(".dropdown-menu").getByRole("link", { name: "Logout" }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(header(page).getByRole("link", { name: "Login" })).toBeVisible();
    await expect(header(page).getByRole("link", { name: "Register" })).toBeVisible();
    await expectLayoutShell(page);
  });

  test("protected route behavior with layout recovery: blocked admin access -> login page -> home", async ({ page }) => {
    await page.goto("/dashboard/admin");

    await expect(page.locator("h1", { hasText: "redirecting to you in" })).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "LOGIN FORM" })).toBeVisible();
    await expectLayoutShell(page);

    await header(page).getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    await expectLayoutShell(page);
  });

  test("categories journey through shared layout: Home -> Categories -> Category page", async ({ page }) => {
    await page.goto("/");
    await expectLayoutShell(page);

    await header(page)
      .locator("a.dropdown-toggle", { hasText: "Categories" })
      .first()
      .click();
    await page.locator(".dropdown-menu").getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");
    await expect(page.locator("a.btn.btn-primary").first()).toBeVisible();
    await expectLayoutShell(page);

    await page.locator("a.btn.btn-primary").first().click();
    await expect(page).toHaveURL(/\/category\//);
    await expect(page.getByRole("heading", { name: /^Category -/ })).toBeVisible();
    await expect(page.locator("h6.text-center")).toContainText("result found");
    await expectLayoutShell(page);
  });

  test("registration journey via header: Home -> Register -> submit -> Login", async ({ page }) => {
    const runId = Date.now();

    await page.goto("/");
    await header(page).getByRole("link", { name: "Register" }).click();

    await expect(page).toHaveURL("/register");
    await expect(page).toHaveTitle("Register - Ecommerce App");
    await expect(page.getByRole("heading", { name: "REGISTER FORM" })).toBeVisible();
    await expectLayoutShell(page);

    await page.getByRole("textbox", { name: "Enter Your Name" }).fill("Layout Register User");
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill(`layout.register.${runId}@example.com`);
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill("LayoutPass123!");
    await page.getByRole("textbox", { name: "Enter Your Phone" }).fill("81234567");
    await page.getByRole("textbox", { name: "Enter Your Address" }).fill("1 Layout Street");
    await page.locator("#exampleInputDOB1").fill("1999-01-01");
    await page
      .getByRole("textbox", { name: "What is Your Favorite sports" })
      .fill("Basketball");

    await page.getByRole("button", { name: "REGISTER" }).click();

    await expect(page).toHaveURL("/login", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "LOGIN FORM" })).toBeVisible();
    await expectLayoutShell(page);
  });

  test("not-found layout recovery: invalid route -> 404 -> Go Back -> Home", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-layout-e2e");

    await expect(page).toHaveTitle("go back- page not found");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Oops ! Page Not Found" })).toBeVisible();
    await expectLayoutShell(page);

    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
    await expectLayoutShell(page);
  });

  test("guest checkout guard via layout: add item -> cart -> login required", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(header(page).locator(".ant-badge-count")).toContainText("1");

    await header(page).getByRole("link", { name: /Cart/i }).click();
    await expect(page).toHaveURL("/cart");
    await expect(page.getByRole("button", { name: "Please Login to checkout" })).toBeVisible();
    await expectLayoutShell(page);

    await page.getByRole("button", { name: "Please Login to checkout" }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "LOGIN FORM" })).toBeVisible();
    await expectLayoutShell(page);
  });

  test("authenticated user layout continuity: Dashboard -> Profile -> Orders", async ({ page }) => {
    const userAuth = JSON.parse(process.env.USER_AUTH);
    await injectAuth(page, userAuth);

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });
    await expect(page).toHaveTitle("Dashboard - Ecommerce App");
    await expect(page.locator(".card h3").first()).toContainText(userAuth.user.name);
    await expectLayoutShell(page);

    await page.goto("/dashboard/user/profile");
    await expect(page).toHaveURL("/dashboard/user/profile");
    await expect(page).toHaveTitle("Your Profile");
    await expect(page.getByRole("heading", { name: "USER PROFILE" })).toBeVisible();
    await expect(page.getByRole("button", { name: "UPDATE" })).toBeVisible();
    await expectLayoutShell(page);

    await page.goto("/dashboard/user/orders");
    await expect(page).toHaveURL("/dashboard/user/orders");
    await expect(page).toHaveTitle("Your Orders");
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
    await expectLayoutShell(page);
  });
});
