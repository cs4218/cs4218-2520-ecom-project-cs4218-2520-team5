// Ang Yi Jie, Ivan, A0259256U
// Assisted with AI

// User category browsing
// UI test (Playwright, black-box)
//
// Tests the public category browsing flow:
//   1. Categories page displays category buttons
//   2. Clicking a category navigates to the CategoryProduct page
//   3. CategoryProduct page shows the category name and result count
//   4. Navigating via the header Categories dropdown also reaches the category page

import { test, expect, request } from "@playwright/test";

const BACKEND_BASE = "http://localhost:6060";
const RUN_ID = Date.now();
const TEST_CAT_NAME = `PW_Browse_${RUN_ID}`;

let testCatSlug;
let testCatId;

// Helper: create a category via API
async function createCategoryViaAPI(name) {
  const adminAuth = JSON.parse(process.env.ADMIN_AUTH);
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });
  const res = await ctx.post("/api/v1/category/create-category", {
    data: { name },
    headers: { Authorization: adminAuth.token },
  });
  const data = await res.json();
  await ctx.dispose();
  return data;
}

// Helper: delete a category via API
async function deleteCategoryViaAPI(id) {
  const adminAuth = JSON.parse(process.env.ADMIN_AUTH);
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });
  await ctx.delete(`/api/v1/category/delete-category/${id}`, {
    headers: { Authorization: adminAuth.token },
  });
  await ctx.dispose();
}

test.describe("Story 4: User Category Browsing", () => {
  test.beforeAll(async () => {
    // Seed a test category so the browsing tests have a known entry
    const data = await createCategoryViaAPI(TEST_CAT_NAME);
    testCatSlug = data.category?.slug;
    testCatId = data.category?._id;
  });

  test.afterAll(async () => {
    // Clean up the test category
    if (testCatId) await deleteCategoryViaAPI(testCatId);
  });

  // ── Test 1: Categories page shows category buttons ───────────────────────
  test("Categories page displays the test category as a button", async ({
    page,
  }) => {
    await page.goto("/categories");

    // The test category should appear as a link button with the category name
    const catLink = page.locator("a.btn-primary", { hasText: TEST_CAT_NAME });
    await expect(catLink).toBeVisible({ timeout: 8000 });
    await expect(catLink).toHaveAttribute(
      "href",
      `/category/${testCatSlug}`
    );
  });

  // ── Test 2: Clicking a category navigates to CategoryProduct page ────────
  test("clicking a category button navigates to the CategoryProduct page", async ({
    page,
  }) => {
    await page.goto("/categories");

    const catLink = page.locator("a.btn-primary", { hasText: TEST_CAT_NAME });
    await catLink.click();

    // URL changes to /category/{slug}
    await expect(page).toHaveURL(`/category/${testCatSlug}`, {
      timeout: 8000,
    });

    // CategoryProduct page shows the category name heading (use .first() — Footer also has h4.text-center)
    await expect(page.locator("h4.text-center").first()).toContainText(
      `Category - ${TEST_CAT_NAME}`,
      { timeout: 8000 }
    );
  });

  // ── Test 3: CategoryProduct page shows result count ──────────────────────
  test("CategoryProduct page shows a result count for the category", async ({
    page,
  }) => {
    await page.goto(`/category/${testCatSlug}`);

    // h6 renders "{n} result found " (note trailing space in source)
    await expect(page.locator("h6.text-center")).toContainText(
      "result found",
      { timeout: 8000 }
    );
  });

  // ── Test 4: Navigate via header Categories dropdown ──────────────────────
  test("navigating via the header Categories dropdown reaches the category page", async ({
    page,
  }) => {
    await page.goto("/");

    // Open the Categories nav dropdown (target the toggle link specifically to avoid matching dropdown items)
    await page.locator("a.dropdown-toggle", { hasText: "Categories" }).click();

    // Click "All Categories" link in the dropdown menu
    await page.locator(".dropdown-menu a", { hasText: "All Categories" }).click();

    await expect(page).toHaveURL("/categories", { timeout: 8000 });

    // The test category is visible on the /categories page
    await expect(
      page.locator("a.btn-primary", { hasText: TEST_CAT_NAME })
    ).toBeVisible({ timeout: 8000 });

    // Click through to the CategoryProduct page
    await page
      .locator("a.btn-primary", { hasText: TEST_CAT_NAME })
      .click();

    await expect(page).toHaveURL(`/category/${testCatSlug}`, {
      timeout: 8000,
    });
    await expect(page.locator("h4.text-center").first()).toContainText(
      `Category - ${TEST_CAT_NAME}`,
      { timeout: 8000 }
    );
  });
});
