// Ang Yi Jie, Ivan, A0259256U
// Assisted with AI

// Admin Create/Edit/Delete Category flow
// UI test (Playwright, black-box)
//
// Tests the full admin workflow for managing categories:
//   1. Access the Create Category admin page
//   2. Create a new category and verify it appears in the table
//   3. Edit an existing category name via the modal
//   4. Delete a category and verify it disappears from the table

import { test, expect, request } from "@playwright/test";

const BACKEND_BASE = "http://localhost:6060";
// Unique per test run to avoid DB conflicts across parallel CI runs
const RUN_ID = Date.now();
const CAT_NAME = `PW_Cat_${RUN_ID}`;
const CAT_NAME_EDITED = `PW_Cat_Edited_${RUN_ID}`;
const CAT_NAME_DELETE = `PW_CatDel_${RUN_ID}`;

// Helper: inject admin auth into localStorage before page scripts run
async function injectAdminAuth(page) {
  const adminAuth = JSON.parse(process.env.ADMIN_AUTH);
  await page.addInitScript((auth) => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, adminAuth);
}

// Helper: create a category via API (pre-condition for edit/delete tests)
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

// Helper: delete a category via API (cleanup)
async function deleteCategoryViaAPI(id) {
  const adminAuth = JSON.parse(process.env.ADMIN_AUTH);
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });
  await ctx.delete(`/api/v1/category/delete-category/${id}`, {
    headers: { Authorization: adminAuth.token },
  });
  await ctx.dispose();
}

test.describe("Story 3: Admin Create/Edit/Delete Category", () => {
  test.beforeEach(async ({ page }) => {
    await injectAdminAuth(page);
  });

  // ── Test 1: Admin can access the Create Category page ───────────────────
  test("admin can access the Create Category page", async ({ page }) => {
    await page.goto("/dashboard/admin/create-category");

    // AdminRoute fires real /api/v1/auth/admin-auth check; wait for resolution
    await expect(page.locator("h1")).toHaveText("Manage Category", {
      timeout: 15000,
    });
    // AdminMenu sidebar is visible
    await expect(page.getByText("Admin Panel")).toBeVisible();
  });

  // ── Test 2: Admin can create a new category ──────────────────────────────
  test("admin can create a category and it appears in the table", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/create-category");
    await expect(page.locator("h1")).toHaveText("Manage Category", {
      timeout: 15000,
    });

    // Fill the create form (CategoryForm renders a single input with this placeholder)
    await page
      .locator('input[placeholder="Enter new category"]')
      .fill(CAT_NAME);

    // Click the Submit button in the create form (first form on page, outside modal)
    await page.getByRole("button", { name: "Submit" }).first().click();

    // Category appears in the table (allow extra time for Atlas round-trip + state refresh)
    await expect(
      page.locator("table tbody").getByText(CAT_NAME)
    ).toBeVisible({ timeout: 15000 });

    // Cleanup
    const allCats = await request.newContext({ baseURL: BACKEND_BASE });
    const listRes = await allCats.get("/api/v1/category/get-category");
    const listData = await listRes.json();
    const created = listData.category?.find((c) => c.name === CAT_NAME);
    await allCats.dispose();
    if (created?._id) await deleteCategoryViaAPI(created._id);
  });

  // ── Test 3: Admin can edit a category name via the modal ─────────────────
  test("admin can edit a category name via the edit modal", async ({
    page,
  }) => {
    // Pre-create the category via API so it exists on the page
    await createCategoryViaAPI(CAT_NAME + "_edit");
    const catToEdit = CAT_NAME + "_edit";

    await page.goto("/dashboard/admin/create-category");
    await expect(page.locator("h1")).toHaveText("Manage Category", {
      timeout: 15000,
    });

    // Find the row containing our category and click Edit
    const row = page
      .locator("table tbody tr")
      .filter({ hasText: catToEdit });
    await row.locator("button.btn-primary", { hasText: "Edit" }).click();

    // Ant Design Modal opens
    await expect(page.locator(".ant-modal-content")).toBeVisible({
      timeout: 5000,
    });

    // Clear and type new name in the modal's CategoryForm input
    const modalInput = page.locator(
      ".ant-modal-content input.form-control"
    );
    await modalInput.clear();
    await modalInput.fill(CAT_NAME_EDITED);

    // Submit the edit form inside the modal
    await page
      .locator(".ant-modal-content")
      .locator('button[type="submit"]')
      .click();

    // Modal closes and updated name appears in table
    await expect(page.locator(".ant-modal-content")).not.toBeVisible({
      timeout: 8000,
    });
    await expect(
      page.locator("table tbody").getByText(CAT_NAME_EDITED)
    ).toBeVisible({ timeout: 8000 });
    // Old name is gone
    await expect(
      page.locator("table tbody").getByText(catToEdit)
    ).not.toBeVisible();

    // Cleanup: find the updated category ID and delete
    const allCats = await request.newContext({ baseURL: BACKEND_BASE });
    const listRes = await allCats.get("/api/v1/category/get-category");
    const listData = await listRes.json();
    const updated = listData.category?.find((c) => c.name === CAT_NAME_EDITED);
    await allCats.dispose();
    if (updated?._id) await deleteCategoryViaAPI(updated._id);
  });

  // ── Test 4: Admin can delete a category ──────────────────────────────────
  test("admin can delete a category and it disappears from the table", async ({
    page,
  }) => {
    // Pre-create via API
    await createCategoryViaAPI(CAT_NAME_DELETE);

    await page.goto("/dashboard/admin/create-category");
    await expect(page.locator("h1")).toHaveText("Manage Category", {
      timeout: 15000,
    });

    // Find the row and click Delete
    const row = page
      .locator("table tbody tr")
      .filter({ hasText: CAT_NAME_DELETE });
    await row.locator("button.btn-danger", { hasText: "Delete" }).click();

    // Category row disappears from the table
    await expect(
      page.locator("table tbody").getByText(CAT_NAME_DELETE)
    ).not.toBeVisible({ timeout: 8000 });
  });
});
