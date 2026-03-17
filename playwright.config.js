// Ang Yi Jie, Ivan, A0259256U
// Assisted with AI
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  globalSetup: "./tests/ui/global-setup.js",

  // Sequential to avoid DB race conditions on the shared Atlas cluster
  fullyParallel: false,
  retries: 1,
  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      // Backend: Express on port 6060
      command: "node server.js",
      url: "http://localhost:6060",
      reuseExistingServer: true,
      timeout: 15000,
    },
    {
      // Frontend: CRA dev server on port 3000
      command: "npm start --prefix ./client",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],

  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
});
