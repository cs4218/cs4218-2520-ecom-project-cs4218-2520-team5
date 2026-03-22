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

async function expectContactCoreContent(page) {
  await expect(page).toHaveURL("/contact");
  await expect(page).toHaveTitle("Contact us");
  await expect(page.getByRole("heading", { name: "CONTACT US" })).toBeVisible();
  await expect(page.getByText("www.help@ecommerceapp.com")).toBeVisible();
  await expect(page.getByText("012-3456789")).toBeVisible();
  await expect(page.getByText("1800-0000-0000 (toll free)")).toBeVisible();
  await expect(page.getByRole("img", { name: "contactus" })).toBeVisible();
}

test.describe("Story: Contact Page E2E Journeys", () => {
  test("guest journey: Home -> Contact via footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: "bannerimage" })).toBeVisible();

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);
  });

  test("guest journey: About -> Contact -> Privacy Policy via footer links", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("img", { name: "aboutus" })).toBeVisible();

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);

    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(page).toHaveTitle("Privacy Policy");
    await expect(
      page.getByRole("img", { name: "privacy policy" }),
    ).toBeVisible();
  });

  test("support path after failed login: Login (invalid) -> Contact", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("invalid-user@example.com");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("wrong-password");
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page).toHaveURL("/login");

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);
  });

  test("authenticated user continuity: Login -> Dashboard -> Contact -> Orders", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user");
    await expect(
      page.getByRole("heading", { name: "Ivan PW User" }),
    ).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);

    await page.goto("/dashboard/user/orders");
    await expect(page).toHaveURL("/dashboard/user/orders");
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible(
      {
        timeout: 15000,
      },
    );
  });

  test("cart continuity: Add item -> Contact -> Cart retains item", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("product exploration interruption: Product Details -> Contact -> browser back", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();
  });

  test("admin continuity: Login -> Admin Dashboard -> Contact -> Manage Category", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL("/dashboard/admin");
    await expect(
      page.locator("h3").filter({ hasText: "Admin Name" }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);

    await page.goto("/dashboard/admin/create-category");
    await expect(page).toHaveURL("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test("deep-link path: /contact directly -> search journey", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expectContactCoreContent(page);

    await page.getByRole("searchbox", { name: "Search" }).fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();
    await expect(page.locator("h6")).toContainText("Found");
  });

  test("mobile responsive journey: Contact -> open nav -> Categories", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contact");
    await expectContactCoreContent(page);

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");
  });

  test("recovery journey: 404 page -> Home -> Contact", async ({ page }) => {
    await page.goto("/missing-route-for-contact-e2e");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Oops ! Page Not Found" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Contact" }).click();
    await expectContactCoreContent(page);
  });
});
