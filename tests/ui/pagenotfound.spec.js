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

async function expectPageNotFoundContent(page) {
  await expect(page).toHaveTitle("go back- page not found");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Oops ! Page Not Found" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Go Back" })).toBeVisible();
}

test.describe("Story: Page Not Found E2E Journeys", () => {
  test("guest journey: Home -> invalid URL -> Go Back -> Home", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await page.goto("/invalid-route-from-home");
    await expectPageNotFoundContent(page);

    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
  });

  test("guest journey: nested invalid path -> recover through About in header", async ({
    page,
  }) => {
    await page.goto("/dashboard/user/non-existing-subpath");
    await expectPageNotFoundContent(page);

    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL("/about");
    await expect(page).toHaveTitle("About us - Ecommerce app");
    await expect(page.getByRole("img", { name: "aboutus" })).toBeVisible();
  });

  test("guest journey: invalid URL -> recover through Privacy Policy in footer", async ({
    page,
  }) => {
    await page.goto("/unknown/privacy-recovery-flow");
    await expectPageNotFoundContent(page);

    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(page).toHaveTitle("Privacy Policy");
    await expect(
      page.getByRole("img", { name: "privacy policy" }),
    ).toBeVisible();
  });

  test("guest journey: broken product deep-link -> categories browsing", async ({
    page,
  }) => {
    await page.goto("/product/non-existent-product-slug/invalid");
    await expectPageNotFoundContent(page);

    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");
  });

  test("guest journey: cart continuity after 404 interruption", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.goto("/cart/invalid-subpath");
    await expectPageNotFoundContent(page);
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("guest journey: Search -> invalid URL -> browser back returns to search results", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("searchbox", { name: "Search" }).fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();

    await page.goto("/search/invalid-subpath");
    await expectPageNotFoundContent(page);

    await page.goBack();
    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();
  });

  test("guest journey: Register -> invalid URL -> back -> complete registration", async ({
    page,
  }) => {
    const runId = Date.now();

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "REGISTER FORM" }),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill("404 Register User");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(`pnf.user.${runId}@example.com`);

    await page.goto("/register/invalid-flow");
    await expectPageNotFoundContent(page);

    await page.goBack();
    await expect(page).toHaveURL("/register");

    // Refill fields after browser back to avoid relying on history state restore.
    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill("404 Register User");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(`pnf.user.${runId}@example.com`);

    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("PnfPass123!");
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill("81234567");
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill("404 Recovery Street");
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

  test("authenticated user journey: Login -> Dashboard -> invalid URL -> recover to Dashboard", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user");
    await expect(
      page.getByRole("heading", { name: "Ivan PW User" }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto("/dashboard/user/not-a-real-page");
    await expectPageNotFoundContent(page);

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user");
    await expect(
      page.getByRole("heading", { name: "Ivan PW User" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("admin journey: Login -> Admin Dashboard -> invalid URL -> recover to Manage Category", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL("/dashboard/admin");
    await expect(
      page.locator("h3").filter({ hasText: "Admin Name" }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto("/dashboard/admin/not-a-real-admin-page");
    await expectPageNotFoundContent(page);

    await page.goto("/dashboard/admin/create-category");
    await expect(page).toHaveURL("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("guest journey: malformed-like path with query/hash -> Go Back -> Contact", async ({
    page,
  }) => {
    await page.goto("/this-route-does-not-exist?source=test#recover");
    await expectPageNotFoundContent(page);

    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(page).toHaveTitle("Contact us");
    await expect(
      page.getByRole("heading", { name: "CONTACT US" }),
    ).toBeVisible();
  });
});
