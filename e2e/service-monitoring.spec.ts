import { test, expect, loggedInTest } from "./fixtures";

// ─── Unauthenticated ──────────────────────────────────────────────────────────

test("Service monitoring - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/service-monitoring", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// ─── Authenticated ────────────────────────────────────────────────────────────

loggedInTest.describe("Service monitoring - authenticated", () => {
  loggedInTest(
    "is reachable from dashboard nav and loads panel content",
    async ({ loggedInPage }) => {
      await loggedInPage.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await loggedInPage
        .getByRole("link", { name: "Service monitoring" })
        .click();

      await expect(loggedInPage).toHaveURL(/\/service-monitoring\/?$/);
      await expect(
        loggedInPage.getByRole("heading", { name: "Service monitoring" }),
      ).toBeVisible();

      const iframe = loggedInPage
        .locator(".service-monitoring__iframe-container iframe")
        .or(loggedInPage.locator("main iframe"));
      const errorMessage = loggedInPage.getByText(
        "Unable to load dashboard. Please contact admin",
      );

      await expect
        .poll(async () => {
          const iframeCount = await iframe.count();
          const errorCount = await errorMessage.count();
          return iframeCount > 0 || errorCount > 0;
        })
        .toBe(true);
    },
  );
});
