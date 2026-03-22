// Alyssa Ong, A0264663X
// Assisted with AI

import { test, expect } from "@playwright/test";

async function loginViaUI(page, email, password) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "LOGIN FORM" })).toBeVisible();
  await page.getByRole("textbox", { name: "Enter Your Email" }).fill(email);
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expect(page).not.toHaveURL("/login", { timeout: 15000 });
}

async function openHomeAndWaitForProducts(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "All Products" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ADD TO CART" }).first(),
  ).toBeVisible({ timeout: 15000 });
}

async function addFirstProductFromHome(page) {
  await openHomeAndWaitForProducts(page);
  await page.getByRole("button", { name: "ADD TO CART" }).first().click();
  await expect(page.getByRole("superscript")).toContainText("1");
}

test.describe("Story: Home Page E2E Journeys", () => {
  test("guest journey: Home -> Add item -> Cart -> sees item and login-to-checkout prompt", async ({
    page,
  }) => {
    await addFirstProductFromHome(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Please Login to checkout" }),
    ).toBeVisible();
  });

  test("guest journey: Home -> More Details -> Add to cart -> Cart shows item", async ({
    page,
  }) => {
    await openHomeAndWaitForProducts(page);

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByRole("superscript")).toContainText("1", {
      timeout: 10000,
    });

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByText(/You Have\s+\d+\s+items in your cart/i),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Cart Summary")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("guest journey: Home -> Filter by category -> Add item -> Cart", async ({
    page,
  }) => {
    await openHomeAndWaitForProducts(page);

    // Category checkboxes are shown before price checkboxes on the page.
    await page.getByRole("checkbox").first().check();
    await expect(
      page.getByRole("button", { name: "ADD TO CART" }).first(),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("guest journey: Home -> Filter by price -> Add item -> Cart", async ({
    page,
  }) => {
    await openHomeAndWaitForProducts(page);

    await page.getByRole("checkbox", { name: "$0 to 19" }).check();
    await expect(
      page.getByRole("button", { name: "ADD TO CART" }).first(),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("guest journey: Home -> Apply filters -> Reset filters -> product listing restored", async ({
    page,
  }) => {
    await openHomeAndWaitForProducts(page);

    await page.getByRole("checkbox").first().check();
    await page.getByRole("checkbox", { name: "$0 to 19" }).check();
    await expect(
      page.getByRole("button", { name: "ADD TO CART" }).first(),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "RESET FILTERS" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ADD TO CART" }).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("guest journey: Home -> Loadmore -> sees additional product cards", async ({
    page,
  }) => {
    await openHomeAndWaitForProducts(page);

    const productActionButtons = page.getByRole("button", {
      name: "ADD TO CART",
    });
    const initialCount = await productActionButtons.count();
    const loadMoreButton = page.getByRole("button", { name: /Loadmore/i });
    await expect(loadMoreButton).toBeVisible();

    await loadMoreButton.click();
    await expect(productActionButtons.nth(initialCount)).toBeVisible({
      timeout: 15000,
    });
    const updatedCount = await productActionButtons.count();
    expect(updatedCount).toBeGreaterThan(initialCount);
  });

  test("authenticated user journey: Login -> Home -> Add item -> Cart -> sees personalized cart summary", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");
    await addFirstProductFromHome(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page
        .locator("h1", { hasText: "Hello" })
        .filter({ hasText: "Ivan PW User" }),
    ).toBeVisible();
    await expect(page.getByText("Current Address")).toBeVisible();
  });

  test("mobile journey: Home -> Add item -> Cart -> toggle nav -> Contact", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await openHomeAndWaitForProducts(page);
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(
      page.getByRole("heading", { name: "CONTACT US" }),
    ).toBeVisible();
  });
});
