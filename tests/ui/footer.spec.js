// Alyssa Ong, A0264663X
// Assisted with AI

import { test, expect } from "@playwright/test";

function footerLink(page, name) {
  return page.locator(".footer").getByRole("link", { name }).first();
}

async function injectAuth(page, authData) {
  await page.addInitScript((auth) => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, authData);
}

async function expectFooterVisible(page) {
  await expect(page.locator(".footer")).toBeVisible();
  await expect(page.locator(".footer")).toContainText("All Rights Reserved");
}

async function expectAboutCoreContent(page) {
  await expect(page).toHaveURL("/about");
  await expect(page).toHaveTitle("About us - Ecommerce app");
  await expect(page.getByRole("img", { name: "aboutus" })).toBeVisible();
}

async function expectContactCoreContent(page) {
  await expect(page).toHaveURL("/contact");
  await expect(page).toHaveTitle("Contact us");
  await expect(page.getByRole("heading", { name: "CONTACT US" })).toBeVisible();
}

async function expectPolicyCoreContent(page) {
  await expect(page).toHaveURL("/policy");
  await expect(page).toHaveTitle("Privacy Policy");
  await expect(page.getByRole("img", { name: "privacy policy" })).toBeVisible();
}

test.describe("Story: Footer E2E User Journeys", () => {
  test("should display footer with copyright information on home page", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.locator(".footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(
      /All\s+Rights\s+Reserved\.?\s*©\s*TestingComp/i,
    );
  });

  test("should display footer on all major pages", async ({ page }) => {
    const pagesToTest = [
      { path: "/", name: "Home" },
      { path: "/about", name: "About" },
      { path: "/contact", name: "Contact" },
      { path: "/policy", name: "Policy" },
      { path: "/categories", name: "Categories" },
    ];

    for (const pageInfo of pagesToTest) {
      await page.goto(pageInfo.path);
      const footer = page.locator(".footer");
      await expect(
        footer,
        `Footer should be visible on ${pageInfo.name}`,
      ).toBeVisible({
        timeout: 5000,
      });
      await expect(footer).toContainText(
        /All\s+Rights\s+Reserved\.?\s*©\s*TestingComp/i,
      );
    }
  });

  test("should have proper link separators", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator(".footer");
    await expect(footer).toBeVisible();

    const footerText = await footer.locator("p").textContent();
    expect(footerText ?? "").toContain("|");

    const links = footer.locator("p a");
    await expect(links).toHaveCount(3);
  });

  test("guest journey: Home -> Footer About -> Footer Contact -> Footer Policy", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await expectFooterVisible(page);

    await footerLink(page, "About").click();
    await expectAboutCoreContent(page);

    await footerLink(page, "Contact").click();
    await expectContactCoreContent(page);

    await footerLink(page, "Privacy Policy").click();
    await expectPolicyCoreContent(page);
  });

  test("cart continuity: Add item -> Footer Contact -> Cart retains item", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "ADD TO CART" }).first().click();
    await expect(page.getByRole("superscript")).toContainText("1");

    await footerLink(page, "Contact").click();
    await expectContactCoreContent(page);
    await expect(page.getByRole("superscript")).toContainText("1");

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL("/cart");
    await expect(
      page.getByRole("button", { name: "Remove" }).first(),
    ).toBeVisible();
  });

  test("product exploration interruption: Product Details -> Footer About -> browser back", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "More Details" }).first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();

    await footerLink(page, "About").click();
    await expectAboutCoreContent(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/product\//);
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();
  });

  test("registration journey: Register -> Footer Policy -> back -> complete registration", async ({
    page,
  }) => {
    const runId = Date.now();

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "REGISTER FORM" }),
    ).toBeVisible();

    await footerLink(page, "Privacy Policy").click();
    await expectPolicyCoreContent(page);

    await page.goBack();
    await expect(page).toHaveURL("/register");

    await page
      .getByRole("textbox", { name: "Enter Your Name" })
      .fill("Footer User");
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill(`footer.user.${runId}@example.com`);
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("FooterPass123!");
    await page
      .getByRole("textbox", { name: "Enter Your Phone" })
      .fill("81234567");
    await page
      .getByRole("textbox", { name: "Enter Your Address" })
      .fill("1 Footer Street");
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

  test("failed login support path: Login invalid -> Footer Contact", async ({
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

    await footerLink(page, "Contact").click();
    await expectContactCoreContent(page);
  });

  test("footer continuity: Home -> Footer Policy -> search journey", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await footerLink(page, "Privacy Policy").click();
    await expectPolicyCoreContent(page);

    await page.getByRole("searchbox", { name: "Search" }).fill("phone");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL("/search");
    await expect(
      page.getByRole("heading", { name: "Search Resuts" }),
    ).toBeVisible();
    await expect(page.locator("h6")).toContainText("Found");
  });

  test("404 recovery journey: Missing route -> Home -> Footer About", async ({
    page,
  }) => {
    await page.goto("/missing-route-for-footer-e2e");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Oops ! Page Not Found" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await footerLink(page, "About").click();
    await expectAboutCoreContent(page);
  });

  test("authenticated user continuity: Dashboard -> Footer Policy -> Orders", async ({
    page,
  }) => {
    const userAuth = JSON.parse(process.env.USER_AUTH);
    await injectAuth(page, userAuth);

    await page.goto("/dashboard/user");
    await expect(page).toHaveURL("/dashboard/user");
    await expect(
      page.getByRole("heading", { name: userAuth.user.name }),
    ).toBeVisible({
      timeout: 15000,
    });

    await footerLink(page, "Privacy Policy").click();
    await expectPolicyCoreContent(page);

    await page.goto("/dashboard/user/orders");
    await expect(page).toHaveURL("/dashboard/user/orders");
    await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible(
      {
        timeout: 15000,
      },
    );
  });

  test("admin continuity: Admin Dashboard -> Footer Contact -> Manage Category", async ({
    page,
  }) => {
    const adminAuth = JSON.parse(process.env.ADMIN_AUTH);
    await injectAuth(page, adminAuth);

    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL("/dashboard/admin");
    await expect(
      page.locator("h3").filter({ hasText: "Admin Name" }),
    ).toBeVisible({
      timeout: 15000,
    });

    await footerLink(page, "Contact").click();
    await expectContactCoreContent(page);

    await page.goto("/dashboard/admin/create-category");
    await expect(page).toHaveURL("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test("mobile responsive journey: Home -> Footer Policy -> open nav -> Categories", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await footerLink(page, "Privacy Policy").click();
    await expectPolicyCoreContent(page);

    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: "Categories" }).click();
    await page.getByRole("link", { name: "All Categories" }).click();

    await expect(page).toHaveURL("/categories");
    await expect(page).toHaveTitle("All Categories");
  });
});
