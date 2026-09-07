import { test as base, Page } from "@playwright/test";
import { existsSync } from "fs";
import { AUTH_STATE_PATH } from "./global-setup";

// Boilerplate/reusable functionality for tests in here.
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
 * Fixture that provides a page already authenticated via saved storage state.
 * Run once with TEST_USERNAME and TEST_PASSWORD to generate the auth state via
 * global setup, then all tests reuse it — no concurrent logins, no session
 * conflicts.
 */
export const loggedInTest = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ browser }, use) => {
    if (!existsSync(AUTH_STATE_PATH)) {
      throw new Error(
        `Auth state not found at ${AUTH_STATE_PATH}. ` +
          "Re-run with TEST_USERNAME and TEST_PASSWORD set to generate it.",
      );
    }
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
