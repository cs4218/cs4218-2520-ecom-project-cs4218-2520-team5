// Ang Yi Jie, Ivan, A0259256U
// Assisted with AI
// Global setup for Playwright UI tests.
// Runs before all test files. Creates test admin and regular user via
// the test-only backend endpoints and stores auth state in process.env.

import { request } from "@playwright/test";

const BACKEND_BASE = "http://localhost:6060";

// Poll /api/v1/test/health until MongoDB is connected (readyState === 1).
// Retries up to maxAttempts times with delayMs between each attempt.
async function waitForDb(ctx, maxAttempts = 30, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await ctx.get("/api/v1/test/health");
    if (res.ok()) return;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(
    `MongoDB did not become ready after ${(maxAttempts * delayMs) / 1000}s. ` +
      "Check your MONGO_URL in .env."
  );
}

async function globalSetup() {
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });

  // Wait for the DB to be connected before running any Mongoose operations.
  await waitForDb(ctx);

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

  // --- Create / reset Zhuo Hui's test user (zhuohui.koo@gmail.com) ---
  const zhRes = await ctx.post("/api/v1/test/setup-zhuohui-user");
  const zhData = await zhRes.json();
  if (!zhData.success) {
    throw new Error(
      `Failed to create Zhuo Hui test user: ${zhData.message}. ` +
        "Ensure the backend is running and NODE_ENV !== 'production'."
    );
  }

  await ctx.dispose();
}

export default globalSetup;
