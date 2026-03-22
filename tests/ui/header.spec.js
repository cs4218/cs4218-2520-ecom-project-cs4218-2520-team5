// Alyssa Ong, A0264663X
// Assisted with AI

import { test, expect } from "@playwright/test";

function headerRoot(page) {
  return page.locator("nav.navbar");
}

function headerLink(page, name) {
  return headerRoot(page).getByRole("link", { name }).first();
}

async function openCategoriesDropdown(page) {
  await page
    .locator("nav.navbar a.dropdown-toggle", { hasText: "Categories" })
    .first()
    .click();
}

async function loginViaUI(page, email, password) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "LOGIN FORM" })).toBeVisible();
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Your Password" }).fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  // Wait for successful login redirect
  await expect(page).not.toHaveURL("/login", { timeout: 15000 });
}

test.describe("Story: Header E2E User Journeys", () => {
  test("header content (guest): brand, search bar, categories, login/register, cart", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      headerRoot(page).getByRole("link", { name: /Virtual Vault/i }),
    ).toBeVisible();
    await expect(headerLink(page, "Home")).toBeVisible();
    await expect(headerLink(page, "Categories")).toBeVisible();

    const searchBox = page.getByRole("searchbox", { name: "Search" });
    await expect(searchBox).toBeVisible();
    await expect(searchBox).toHaveAttribute("placeholder", "Search");
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();

    await expect(headerLink(page, "Register")).toBeVisible();
    await expect(headerLink(page, "Login")).toBeVisible();
    await expect(headerLink(page, "Cart")).toBeVisible();
  });

  test("header brand navigation: clicking brand returns user to home", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page).toHaveURL("/about");

    await headerRoot(page)
      .getByRole("link", { name: /Virtual Vault/i })
      .click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
  });

  test("header search: keyword + Search button navigates to search results", async ({
    page,
  }) => {
    await page.goto("/");

    const searchBox = page.getByRole("searchbox", { name: "Search" });
    await searchBox.fill("phone");
    await expect(searchBox).toHaveValue("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();
  });

  test("header cart badge: shows zero for empty cart on initial load", async ({
    page,
  }) => {
    await page.goto("/");

    const cartBadge = page.locator(".ant-badge .ant-badge-count").first();
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toContainText("0");
  });

  test("header categories dropdown content: all categories link and category entries", async ({
    page,
  }) => {
    await page.goto("/");

    await openCategoriesDropdown(page);

    const dropdownLinks = page.locator(".dropdown-menu a");
    await expect(dropdownLinks.first()).toBeVisible();
    await expect(dropdownLinks.first()).toHaveText("All Categories");
    await expect(dropdownLinks.first()).toHaveAttribute("href", "/categories");

    const count = await dropdownLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(dropdownLinks.nth(i)).toHaveAttribute(
        "href",
        /\/(categories|category\/)/,
      );
    }
  });

  test("header auth content transition: Login -> user menu + logout switches to login/register", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });

    await expect(headerLink(page, "Login")).not.toBeVisible();
    await expect(headerLink(page, "Register")).not.toBeVisible();

    const userMenuToggle = headerRoot(page)
      .locator("a.nav-link.dropdown-toggle")
      .last();
    await expect(userMenuToggle).toBeVisible();
    await expect(userMenuToggle).toContainText("Ivan PW User");

    await userMenuToggle.click();
    await expect(
      page.locator(".dropdown-menu").getByRole("link", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(
      page.locator(".dropdown-menu").getByRole("link", { name: "Logout" }),
    ).toBeVisible();

    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Logout" })
      .click();
    await expect(page).toHaveURL(/\/login/);
    await expect(headerLink(page, "Login")).toBeVisible();
    await expect(headerLink(page, "Register")).toBeVisible();
  });

  test("guest journey: Header search -> results -> product details", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    const searchBox = page.getByRole("searchbox", { name: "Search" });
    await searchBox.fill("phone");
    await expect(searchBox).toHaveValue("phone");
    await searchBox.press("Enter");

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();
    await expect(page.locator("h6")).toContainText("Found");

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();
  });

  test("guest journey: Header categories dropdown -> all categories -> category page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await openCategoriesDropdown(page);
    await page
      .locator(".dropdown-menu a", { hasText: "All Categories" })
      .first()
      .click();

    await expect(page).toHaveURL("/categories");

    const firstCategory = page.locator("a.btn-primary").first();
    await expect(firstCategory).toBeVisible({ timeout: 10000 });
    await firstCategory.click();

    await expect(page).toHaveURL(/\/category\//);
    await expect(page.locator("h6.text-center")).toContainText("result found");
  });

  test("guest journey: Add to cart -> Header cart -> item visible", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(headerRoot(page)).toContainText("1");

    await headerLink(page, "Cart").click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("guest journey: Header register -> complete registration -> redirected to login", async ({
    page,
  }) => {
    const runId = Date.now();

    await page.goto("/");
    await headerLink(page, "Register").click();
    await expect(page).toHaveURL("/register");

    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill("Header User");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(`header.user.${runId}@example.com`);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("HeaderPass123!");
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill("81234567");
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill("1 Header Street");
    await page.locator("#exampleInputDOB1").fill("1999-01-01");
    await page
      .getByRole("textbox", { name: "What is Your Favorite sports" })
      .fill("Basketball");

    await page.getByRole("button", { name: "REGISTER" }).click();
    await expect(page).toHaveURL("/login", { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
  });

  test("guest recovery: Header login (invalid) -> Header home -> Header categories", async ({
    page,
  }) => {
    await page.goto("/");
    await headerLink(page, "Login").click();
    await expect(page).toHaveURL("/login");

    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("invalid-user@example.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("wrong-password");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page).toHaveURL("/login");

    await headerLink(page, "Home").click();
    await expect(page).toHaveURL("/");

    await openCategoriesDropdown(page);
    await page
      .locator(".dropdown-menu a", { hasText: "All Categories" })
      .first()
      .click();
    await expect(page).toHaveURL("/categories");
  });

  test("authenticated user: Login -> Header user dropdown -> dashboard -> orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Ivan PW User" }),
    ).toBeVisible({
      timeout: 15000,
    });

    await headerRoot(page).locator("a.nav-link.dropdown-toggle").last().click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Dashboard" })
      .click();

    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });

    await page.goto("/dashboard/user/orders");
    await expect(page).toHaveURL("/dashboard/user/orders");
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible(
      { timeout: 15000 },
    );
  });

  test("authenticated admin: Login -> Header user dropdown -> dashboard -> manage category", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL("/dashboard/admin", { timeout: 15000 });
    await expect(
      page.locator("h3").filter({ hasText: "Admin Name" }),
    ).toBeVisible({ timeout: 15000 });

    await headerRoot(page).locator("a.nav-link.dropdown-toggle").last().click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Dashboard" })
      .click();

    await expect(page).toHaveURL("/dashboard/admin", { timeout: 15000 });

    await page.goto("/dashboard/admin/create-category");
    await expect(page).toHaveURL("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("authenticated user: Login -> Header logout -> guest nav restored", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user", { timeout: 15000 });

    await headerRoot(page).locator("a.nav-link.dropdown-toggle").last().click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: "Logout" })
      .click();

    await expect(page).toHaveURL(/\/login/);
    await expect(headerLink(page, "Login")).toBeVisible();
    await expect(headerLink(page, "Register")).toBeVisible();
  });

  test("cart continuity: Header badge persists across header navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(headerRoot(page)).toContainText("1");

    await openCategoriesDropdown(page);
    await page
      .locator(".dropdown-menu a", { hasText: "All Categories" })
      .first()
      .click();
    await expect(page).toHaveURL("/categories");
    await expect(headerRoot(page)).toContainText("1");

    await headerLink(page, "Home").click();
    await expect(page).toHaveURL("/");
    await expect(headerRoot(page)).toContainText("1");

    await headerLink(page, "Cart").click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("mobile responsive: Header toggle -> categories -> cart", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
  });
});
