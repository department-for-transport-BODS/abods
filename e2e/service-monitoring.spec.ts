import { test, expect, loggedInTest } from "./fixtures";
import { ServiceMonitoringPage } from "./pages/ServiceMonitoringPage";

// ─── Unauthenticated ──────────────────────────────────────────────────────────

test("Service monitoring - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/service-monitoring", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// ─── Authenticated ────────────────────────────────────────────────────────────

loggedInTest.describe("Service monitoring - authenticated", () => {
  let serviceMonitoring!: ServiceMonitoringPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    serviceMonitoring = new ServiceMonitoringPage(loggedInPage);
  });

  loggedInTest(
    "is reachable from dashboard nav and loads panel content",
    async ({ loggedInPage }) => {
      await serviceMonitoring.openFromDashboardNav();

      await expect(loggedInPage).toHaveURL(/\/service-monitoring\/?$/);
      await expect(serviceMonitoring.heading()).toBeVisible();

      await expect
        .poll(async () => {
          const iframeCount = await serviceMonitoring.panelIframe().count();
          const errorCount = await serviceMonitoring
            .panelLoadErrorMessage()
            .count();
          return iframeCount > 0 || errorCount > 0;
        })
        .toBe(true);
    },
  );
});
