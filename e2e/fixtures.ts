import { test as base, Page } from "@playwright/test";

const APP_ROUTES = [
  "/",
  "/dashboard",
  "/login",
  "/privacy-policy",
  "/cookies",
  "/accessibility",
  "/feed-monitoring",
  "/on-time",
  "/corridors",
  "/vehicle-journeys",
  "/data-monitoring",
  "/stop-analysis",
  "/service-monitoring",
];

async function loadAllRoutes(page: Page): Promise<void> {
  for (const route of APP_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await loadAllRoutes(page);
    await use(page);
  },
});

/**
 * Fixture that provides a page already logged in via the login form.
 * Requires TEST_USERNAME and TEST_PASSWORD environment variables.
 */
export const loggedInTest = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;
    if (!username || !password) {
      throw new Error(
        "TEST_USERNAME and TEST_PASSWORD environment variables must be set for authenticated tests.",
      );
    }
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email", { exact: false }).fill(username);
    await page.getByLabel("Password", { exact: false }).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard**");
    await use(page);
  },
});

export { expect } from "@playwright/test";
