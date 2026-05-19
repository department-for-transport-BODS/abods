import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4200";
const hasExternalBaseURL = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run all spec files in the e2e folder */
  testMatch: "**/*.spec.ts",

  /* Log in once before all tests and save auth state */
  globalSetup: require.resolve("./e2e/global-setup"),

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html"],
    ["list"],
    ["json", { outputFile: "playwright-report/results.json" }],
  ],

  /* Test timeout - increase for pages with heavy data loading */
  timeout: 60 * 1000,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video recording for debugging */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    /* Uncomment to test in additional browsers for migration verification */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: process.env.PLAYWRIGHT_BASE_URL?.trim()
    ? undefined
    : {
        command: "npm run start:app",
        url: "http://localhost:4200",
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
