// Ang Yi Jie, Ivan, A0259256U
// Assisted with AI

// Admin dashboard access control
// UI test (Playwright, black-box)
//
// Tests that admin-only routes enforce role-based access:
//   - Admin (role=1) can access /dashboard/admin and sees their profile
//   - Regular user (role=0) visiting admin routes gets Spinner → redirect to /login
//   - Unauthenticated users visiting admin routes get Spinner → redirect to /login
//   - Unauthenticated users visiting user routes get Spinner → redirect to /
//
// Key source behavior:
//   AdminRoute.js:  <Spinner/>       (no path prop → default "login" → navigates to /login)
//   Private.js:     <Spinner path=""> (empty path → navigates to /)
//   Spinner renders h1: "redirecting to you in {count} seconds"

import { test, expect } from "@playwright/test";

// Helper: inject auth data into localStorage before page scripts run
async function injectAuth(page, authData) {
  await page.addInitScript((auth) => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, authData);
}

test.describe("Story 5: Admin Dashboard Access Control", () => {

  // ── Scenario A: Authenticated admin (role=1) ─────────────────────────────
  test.describe("as authenticated admin", () => {
    test.beforeEach(async ({ page }) => {
      const adminAuth = JSON.parse(process.env.ADMIN_AUTH);
      await injectAuth(page, adminAuth);
    });

    test("admin can access /dashboard/admin and sees the dashboard", async ({
      page,
    }) => {
      await page.goto("/dashboard/admin");

      // AdminRoute fires real GET /api/v1/auth/admin-auth; wait for resolution
      // AdminDashboard renders with card containing admin info h3 elements
      await expect(
        page.locator("h3").filter({ hasText: "Admin Name" })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.locator("h3").filter({ hasText: "Admin Email" })
      ).toBeVisible();
      await expect(
        page.locator("h3").filter({ hasText: "Admin Contact" })
      ).toBeVisible();
    });

    test("admin dashboard displays the actual admin name and email", async ({
      page,
    }) => {
      const adminAuth = JSON.parse(process.env.ADMIN_AUTH);
      await page.goto("/dashboard/admin");

      // AdminDashboard source: <h3> Admin Name : {auth?.user?.name}</h3>
      await expect(
        page.locator("h3").filter({ hasText: adminAuth.user.name })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.locator("h3").filter({ hasText: adminAuth.user.email })
      ).toBeVisible();
    });

    test("admin can access /dashboard/admin/create-category", async ({
      page,
    }) => {
      await page.goto("/dashboard/admin/create-category");

      await expect(page.locator("h1")).toHaveText("Manage Category", {
        timeout: 15000,
      });
    });
  });

  // ── Scenario B: Authenticated regular user (role=0) ──────────────────────
  test.describe("as authenticated regular user", () => {
    test.beforeEach(async ({ page }) => {
      const userAuth = JSON.parse(process.env.USER_AUTH);
      await injectAuth(page, userAuth);
    });

    test("regular user visiting /dashboard/admin sees Spinner then is redirected to /login", async ({
      page,
    }) => {
      await page.goto("/dashboard/admin");

      // AdminRoute: token exists → admin-auth returns ok=false for role=0
      // → Spinner displays countdown
      await expect(
        page.locator("h1", { hasText: "redirecting to you in" })
      ).toBeVisible({ timeout: 8000 });

      // After 3-second countdown, Spinner navigates to /login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test("regular user can access /dashboard/user (private route)", async ({
      page,
    }) => {
      await page.goto("/dashboard/user");

      // PrivateRoute: token exists → user-auth returns ok=true for role=0
      // Dashboard renders with user profile card
      await expect(page.locator(".card")).toBeVisible({ timeout: 15000 });
    });
  });

  // ── Scenario C: Unauthenticated user (no token) ───────────────────────────
  test.describe("as unauthenticated user", () => {
    // No beforeEach: no localStorage injection = no auth token

    test("unauthenticated user visiting /dashboard/admin sees Spinner then is redirected to /login", async ({
      page,
    }) => {
      await page.goto("/dashboard/admin");

      // AdminRoute: no token → authCheck never fires → ok stays false → Spinner
      await expect(
        page.locator("h1", { hasText: "redirecting to you in" })
      ).toBeVisible({ timeout: 5000 });

      // Spinner default path = "login" → navigates to /login
      await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    });

    test("unauthenticated user visiting /dashboard/user sees Spinner then is redirected to /", async ({
      page,
    }) => {
      await page.goto("/dashboard/user");

      // Private.js: no token → ok stays false → <Spinner path="">
      // Spinner with path="" navigates to navigate("/") → homepage
      await expect(
        page.locator("h1", { hasText: "redirecting to you in" })
      ).toBeVisible({ timeout: 5000 });

      await expect(page).toHaveURL(/\/$/, { timeout: 8000 });
    });
  });
});
