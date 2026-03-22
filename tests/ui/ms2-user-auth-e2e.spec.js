// Ong Xin Hui Lynnette, A0257058X
// Assisted with AI
//
// MS2 — Black-box Playwright E2E user journeys (auth, dashboard, profile).
// Maps to rubric stories:
//   Story 1 — Successful User Registration
//   Story 2 — Successful Login and Dashboard Access
//   Story 3 — Profile Management for Authenticated User
//   Story 4 — Unauthorized Access Blocking for Protected Routes
//   Story 5 — User Navigation Within Protected Dashboard

import { test, expect } from "@playwright/test";
import {
  getSeededRegularUserAuth,
  loginViaUi,
  openUserDashboardFromHeader,
  spinnerRedirectHeading,
} from "./helpers/ms2UserUiHelpers.js";

// ── Story 1: Successful User Registration ──────────────────────────────────
test.describe("Story 1: Successful User Registration", () => {
  test("user completes registration, sees success feedback, and is sent to login", async ({
    page,
  }) => {
    const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const uniqueEmail = `ms2.register.${runId}@test.com`;
    const password = "RegTest@99";

    await page.goto("/register");

    await page.getByPlaceholder("Enter Your Name").fill(`MS2 User ${runId}`);
    await page.getByPlaceholder("Enter Your Email ").fill(uniqueEmail);
    await page.getByPlaceholder("Enter Your Password").fill(password);
    await page.getByPlaceholder("Enter Your Phone").fill("90001111");
    await page.getByPlaceholder("Enter Your Address").fill("1 Register Rd");
    await page.locator("#exampleInputDOB1").fill("1995-05-20");
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill("basketball");

    await page.getByRole("button", { name: "REGISTER" }).click();

    await expect(
      page.getByText("Register Successfully, please login"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole("heading", { name: "LOGIN FORM" }),
    ).toBeVisible();
  });
});

// ── Story 2: Successful Login and Dashboard Access ───────────────────────────
test.describe("Story 2: Successful Login and Dashboard Access", () => {
  test("user logs in, opens dashboard from header, and sees personal details", async ({
    page,
  }) => {
    const { user } = getSeededRegularUserAuth();

    await loginViaUi(page);

    await expect(page.getByText("login successfully", { exact: true })).toBeVisible();
    await expect(page).toHaveURL("/");

    await openUserDashboardFromHeader(page);

    await expect(page).toHaveURL(/\/dashboard\/user$/);

    const card = page.locator(".dashboard .card");
    await expect(card).toBeVisible();
    await expect(card).toContainText(user.name);
    await expect(card).toContainText(user.email);
    await expect(card).toContainText(String(user.address ?? ""));
  });
});

// ── Story 3: Profile Management ───────────────────────────────────────────────
test.describe("Story 3: Profile Management for Authenticated User", () => {
  test("user logs in, opens profile from sidebar, updates fields, and sees changes persist", async ({
    page,
  }) => {
    const { user } = getSeededRegularUserAuth();
    const suffix = `${Date.now()}`.slice(-6);
    const newPhone = `9${suffix}`;
    const newAddress = `${suffix} Updated Ave`;
    const newName = `${user.name} (MS2)`;

    await loginViaUi(page);
    await expect(page).toHaveURL("/");

    await openUserDashboardFromHeader(page);

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);
    await expect(
      page.getByRole("heading", { name: "USER PROFILE" }),
    ).toBeVisible();

    const profileForm = page
      .locator("form")
      .filter({ has: page.getByRole("heading", { name: "USER PROFILE" }) });

    await expect(profileForm.getByPlaceholder("Enter Your Name")).toHaveValue(
      user.name,
    );
    await expect(
      profileForm.getByPlaceholder("Enter Your Email "),
    ).toHaveValue(user.email);

    await profileForm.getByPlaceholder("Enter Your Name").fill(newName);
    await profileForm.getByPlaceholder("Enter Your Phone").fill(newPhone);
    await profileForm.getByPlaceholder("Enter Your Address").fill(newAddress);

    await profileForm.getByRole("button", { name: "UPDATE" }).click();

    await expect(
      page.getByText("Profile Updated Successfully"),
    ).toBeVisible();

    await expect(profileForm.getByPlaceholder("Enter Your Name")).toHaveValue(
      newName,
    );
    await expect(profileForm.getByPlaceholder("Enter Your Phone")).toHaveValue(
      newPhone,
    );
    await expect(
      profileForm.getByPlaceholder("Enter Your Address"),
    ).toHaveValue(newAddress);

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "USER PROFILE" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Enter Your Name")).toHaveValue(newName);
    await expect(page.getByPlaceholder("Enter Your Phone")).toHaveValue(newPhone);
    await expect(page.getByPlaceholder("Enter Your Address")).toHaveValue(
      newAddress,
    );
  });
});

// ── Story 4: Unauthorized access ─────────────────────────────────────────────
test.describe("Story 4: Unauthorized Access Blocking for Protected Routes", () => {
  test("guest hitting user dashboard and profile routes sees redirect countdown, never protected UI, then lands on home", async ({
    page,
  }) => {
    const { user } = getSeededRegularUserAuth();

    await page.goto("/dashboard/user");

    await expect(spinnerRedirectHeading(page)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(user.name)).not.toBeVisible();
    await expect(
      page.locator(".dashboard .card"),
    ).not.toBeVisible();

    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();

    await page.goto("/dashboard/user/profile");

    await expect(spinnerRedirectHeading(page)).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "USER PROFILE" }),
    ).not.toBeVisible();
    await expect(page.getByText(user.name)).not.toBeVisible();

    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "All Products" }),
    ).toBeVisible();
  });
});

// ── Story 5: In-dashboard navigation ─────────────────────────────────────────
test.describe("Story 5: User Navigation Within Protected Dashboard", () => {
  test("after login, user moves between dashboard, profile, and orders while staying signed in", async ({
    page,
  }) => {
    const { user } = getSeededRegularUserAuth();

    await loginViaUi(page);
    await expect(page).toHaveURL("/");

    await openUserDashboardFromHeader(page);
    await expect(page.locator(".dashboard .card")).toContainText(user.email);

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);
    await expect(
      page.getByRole("heading", { name: "USER PROFILE" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/dashboard\/user\/orders$/);
    await expect(
      page.getByRole("heading", { name: "All Orders" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);

    const accountToggle = page.locator("a.nav-link.dropdown-toggle").last();
    await expect(accountToggle).toBeVisible();
    await accountToggle.click();
    await expect(
      page.locator(".dropdown-menu").getByRole("link", { name: "Logout" }),
    ).toBeVisible();
  });
});
