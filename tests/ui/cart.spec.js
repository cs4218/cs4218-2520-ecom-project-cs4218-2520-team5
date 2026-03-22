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

async function addFirstProductToCart(page) {
  await page.goto("/");
  await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "ADD TO CART" }).first().click();
  await expect(page.getByRole("superscript")).toContainText("1");
}

test.describe("Story: Cart Page E2E Journeys", () => {
  test("guest journey: Home -> Add item -> Cart -> sees item and 'Please Login to checkout'", async ({
    page,
  }) => {
    await addFirstProductToCart(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");

    // Guest greeting
    await expect(page.getByText("Hello Guest")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Please Login to checkout" }),
    ).toBeVisible();

    // Item is visible with Remove button
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();

    // Cart summary section
    await expect(page.getByText("Cart Summary")).toBeVisible();
    await expect(page.getByText("Total :")).toBeVisible();

    // Login to checkout button
    await expect(
      page.getByRole("button", { name: "Please Login to checkout" }),
    ).toBeVisible();
  });

  test("guest journey: Empty cart shows 'Your Cart Is Empty'", async ({
    page,
  }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");

    await expect(page.getByText("Your Cart Is Empty")).toBeVisible();
  });

  test("guest journey: Add item -> Cart -> 'Please Login to checkout' -> redirected to Login", async ({
    page,
  }) => {
    await addFirstProductToCart(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");

    await page
      .getByRole("button", { name: "Please Login to checkout" })
      .click();
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
  });

  test("guest journey: Add item -> Cart -> Remove item -> cart becomes empty", async ({
    page,
  }) => {
    await addFirstProductToCart(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");

    // Item visible
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();

    // Remove the item
    await page.getByRole("button", { name: "Remove" }).first().click();

    // Cart should now be empty
    await expect(page.getByText("Your Cart Is Empty")).toBeVisible();
    await expect(page.getByRole("superscript")).toContainText("0");
  });

  test("guest journey: Add item -> Cart -> About via footer -> back -> cart retains item", async ({
    page,
  }) => {
    await addFirstProductToCart(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();

    // Navigate to About
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("img", { name: "aboutus" })).toBeVisible();

    // Cart badge persists
    await expect(page.getByRole("superscript")).toContainText("1");

    // Go back to cart
    await page.goBack();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("guest journey: Search products -> Home -> Add to cart -> Cart", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search" }).fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();
    await expect(page.locator("h6")).toContainText("Found");

    // Go back to home to add item
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    // Navigate to cart
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("authenticated user journey: Login -> Add item -> Cart -> sees user greeting and address", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await addFirstProductToCart(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");

    // Authenticated user greeting with name in heading
    await expect(
      page.locator("h1", { hasText: "Hello" }).filter({ hasText: "Ivan PW User" }),
    ).toBeVisible();

    // Item visible
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();

    // Cart summary with address
    await expect(page.getByText("Cart Summary")).toBeVisible();
    await expect(page.getByText("Current Address")).toBeVisible();
  });

  test("authenticated user journey: Login -> Add item -> Cart -> Update Address -> Profile", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    await addFirstProductToCart(page);

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");

    // Click Update Address button
    await page
      .getByRole("button", { name: "Update Address" })
      .click();
    await expect(page).toHaveURL("/dashboard/user/profile");
    await expect(
      page.getByRole("heading", { name: "USER PROFILE" }),
    ).toBeVisible();

    // Cart badge persists on profile page
    await expect(page.getByRole("superscript")).toContainText("1");
  });

  test("authenticated user journey: Login -> Add item -> Cart -> Remove -> Add another -> Cart", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.user@test.com", "Test@12345");

    // Add first item
    await addFirstProductToCart(page);

    // Go to cart and remove
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(page.getByText("Your Cart Is Empty")).toBeVisible();

    // Go back to home and add another item
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    // Go to cart again
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("guest journey: Categories -> Add item -> Cart -> item visible", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    // Browse via categories
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();
    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");

    // Go back to home to add item (categories page may not have add-to-cart)
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
    await expect(page.getByText("Total :")).toBeVisible();
  });

  test("mobile responsive journey: Add item -> Cart -> toggle nav -> Contact", async ({
    page,
  }) => {
    // Add item at default viewport first
    await addFirstProductToCart(page);

    // Switch to mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/cart");
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();

    // Open mobile nav and navigate
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(
      page.getByRole("heading", { name: "CONTACT US" }),
    ).toBeVisible();
  });

  test("recovery journey: Add item -> 404 -> Go Back -> Cart retains item", async ({
    page,
  }) => {
    await addFirstProductToCart(page);

    // Navigate to invalid route
    await page.goto("/cart/nonexistent-route");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Oops ! Page Not Found" }),
    ).toBeVisible();

    // Cart badge persists on 404
    await expect(page.getByRole("superscript")).toContainText("1");

    // Go back to home
    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");

    // Navigate to cart and verify item is still there
    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });
});
