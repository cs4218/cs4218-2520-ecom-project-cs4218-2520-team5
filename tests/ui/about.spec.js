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

async function expectAboutCoreContent(page) {
  await expect(page).toHaveURL("/about");
  await expect(page).toHaveTitle("About us - Ecommerce app");
  await expect(page.getByRole("img", { name: "aboutus" })).toBeVisible();
  await expect(
    page.getByText("Welcome to Virtual Vault, your trusted online marketplace"),
  ).toBeVisible();
}

test.describe("Story: About Page E2E Journeys", () => {
  test("guest journey: Home -> About via navigation -> Contact", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);

    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(page).toHaveTitle("Contact us");
    await expect(
      page.getByRole("heading", { name: "CONTACT US" }),
    ).toBeVisible();
  });

  test("guest journey: Home -> About -> Privacy Policy", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);

    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/policy");
    await expect(page).toHaveTitle("Privacy Policy");
    await expect(
      page.getByRole("img", { name: "privacy policy" }),
    ).toBeVisible();
  });

  test("deep-link path: /about directly -> search journey", async ({
    page,
  }) => {
    await page.goto("/about");
    await expectAboutCoreContent(page);

    await page.getByRole("searchbox", { name: "Search" }).fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();
    await expect(page.locator("h6")).toContainText("Found");
  });

  test("cart continuity: Add item -> About -> Cart retains item", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("product exploration interruption: Product Details -> About -> browser back", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();
  });

  test("registration journey: Register -> About -> back -> complete registration", async ({
    page,
  }) => {
    const runId = Date.now();

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "REGISTER FORM" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);

    await page.goBack();
    await expect(page).toHaveURL("/register");

    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill("About User");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(`about.user.${runId}@example.com`);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("AboutPass123!");

    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill("81234567");
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill("1 About Street");
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

  test("support path after failed login: Login (invalid) -> About -> Contact", async ({
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

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);

    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(
      page.getByRole("heading", { name: "CONTACT US" }),
    ).toBeVisible();
  });

  test("authenticated user continuity: Login -> Dashboard -> About -> Orders", async ({
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

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);

    await page.goto("/dashboard/user/orders");
    await expect(page).toHaveURL("/dashboard/user/orders");
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible(
      {
        timeout: 15000,
      },
    );
  });

  test("admin continuity: Login -> Admin Dashboard -> About -> Manage Category", async ({
    page,
  }) => {
    await loginViaUI(page, "ivan.playwright.admin@test.com", "Test@12345");

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL("/dashboard/admin");
    await expect(
      page.locator("h3").filter({ hasText: "Admin Name" }),
    ).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("link", { name: "About" }).first().click();
    await expectAboutCoreContent(page);

    await page.goto("/dashboard/admin/create-category");
    await expect(page).toHaveURL("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test("mobile responsive journey: About -> open nav -> Categories", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/about");
    await expectAboutCoreContent(page);

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");
  });
});
