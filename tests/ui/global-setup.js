// Ang Yi Jie, Ivan, A0259256U
// Assisted with AI
// Global setup for Playwright UI tests.
// Runs before all test files. Creates test admin and regular user via
// the test-only backend endpoints and stores auth state in process.env.

import { request } from "@playwright/test";

const BACKEND_BASE = "http://localhost:6060";

async function globalSetup() {
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });

  // --- Create / reset test admin user (role=1) ---
  const adminRes = await ctx.post("/api/v1/test/setup-admin");
  const adminData = await adminRes.json();
  if (!adminData.success) {
    throw new Error(
      `Failed to create test admin: ${adminData.message}. ` +
        "Ensure the backend is running and NODE_ENV !== 'production'."
    );
  }
  // Store for spec files to access via process.env
  process.env.ADMIN_AUTH = JSON.stringify(adminData);

  // --- Create / reset test regular user (role=0) ---
  const userRes = await ctx.post("/api/v1/test/setup-user");
  const userData = await userRes.json();
  if (!userData.success) {
    throw new Error(
      `Failed to create test user: ${userData.message}. ` +
        "Ensure the backend is running and NODE_ENV !== 'production'."
    );
  }
  process.env.USER_AUTH = JSON.stringify(userData);

  await ctx.dispose();
}

export default globalSetup;
