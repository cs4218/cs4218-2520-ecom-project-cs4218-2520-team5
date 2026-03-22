// Ong Xin Hui Lynnette, A0257058X
// Assisted with AI
// Shared helpers for MS2 user-auth Playwright journeys (black-box UI).

/** @returns {{ token: string, user: { email: string, name: string, address?: string, phone?: string } }} */
export function getSeededRegularUserAuth() {
  const raw = process.env.USER_AUTH;
  if (!raw) {
    throw new Error(
      "USER_AUTH is missing. Run Playwright with global-setup (npm run test:ui).",
    );
  }
  return JSON.parse(raw);
}

export const SEEDED_USER_PASSWORD = "Test@12345";

/**
 * Log in through the real login form (visible user journey).
 * @param {import('@playwright/test').Page} page
 * @param {string} [email]
 * @param {string} [password]
 */
export async function loginViaUi(
  page,
  email,
  password = SEEDED_USER_PASSWORD,
) {
  const { user } = getSeededRegularUserAuth();
  const loginEmail = email ?? user.email;
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill(loginEmail);
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
}

/**
 * Open the logged-in account dropdown (last Bootstrap dropdown in the header).
 * @param {import('@playwright/test').Page} page
 */
export async function openAccountDropdown(page) {
  await page.locator("a.nav-link.dropdown-toggle").last().click();
}

/**
 * Open the header user menu and go to the regular user dashboard.
 * @param {import('@playwright/test').Page} page
 */
export async function openUserDashboardFromHeader(page) {
  await openAccountDropdown(page);
  await page
    .locator(".dropdown-menu")
    .getByRole("link", { name: "Dashboard" })
    .click();
  await page.waitForURL("**/dashboard/user", { timeout: 20000 });
}

export function spinnerRedirectHeading(page) {
  return page.locator("h1", { hasText: /redirecting to you in/i });
}
