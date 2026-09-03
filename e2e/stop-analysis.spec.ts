import { test, expect, loggedInTest } from "./fixtures";
import { StopAnalysisPage } from "./pages/StopAnalysisPage";

// ─── Unauthenticated ──────────────────────────────────────────────────────────

test("Stop analysis - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/stop-analysis", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// ─── Authenticated ────────────────────────────────────────────────────────────

loggedInTest.describe("Stop analysis - authenticated", () => {
  let stopAnalysis!: StopAnalysisPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    stopAnalysis = new StopAnalysisPage(loggedInPage);
  });

  loggedInTest(
    "renders the main page shell and controls",
    async ({ loggedInPage }) => {
      await stopAnalysis.goto();

      await test.step("verify the page heading and filter controls", async () => {
        await expect(loggedInPage).toHaveURL(/\/stop-analysis\/?$/);
        await expect(stopAnalysis.heading()).toBeVisible();
        await expect(stopAnalysis.refineResultsButton()).toBeVisible();
        await expect(stopAnalysis.displayOptionsButton()).toBeVisible();
        await expect(stopAnalysis.presetDateRangeSelect()).toBeVisible();
        await expect(stopAnalysis.adminAreasTrigger()).toBeVisible();
        await expect(stopAnalysis.matchTypeRadio("Evidenced")).toBeChecked();
        await expect(stopAnalysis.stopTypeRadio("Timing points")).toBeChecked();
        await expect(stopAnalysis.directionsTrigger()).toBeVisible();
        await expect(stopAnalysis.locationSearch()).toBeVisible();
      });
    },
  );

  loggedInTest(
    "opens and closes the refine panel",
    async ({ loggedInPage }) => {
      await stopAnalysis.goto();

      await test.step("open the refine panel", async () => {
        await stopAnalysis.refineResultsButton().click();
        await expect(stopAnalysis.refinePanel()).toBeVisible();
        await expect(stopAnalysis.refinePanel()).toContainText(
          "Refine results",
        );
        await expect(stopAnalysis.resetToDefaultsButton()).toBeVisible();
        await expect(stopAnalysis.applyButton()).toBeVisible();
        await expect(stopAnalysis.closeRefineButton()).toBeVisible();
      });

      await test.step("close the refine panel", async () => {
        await stopAnalysis.closeRefineButton().click();
        await expect(stopAnalysis.refinePanel()).toBeHidden();
        await expect(loggedInPage).toHaveURL(/\/stop-analysis\/?$/);
      });
    },
  );

  loggedInTest(
    "shows active chips from query params and resets them to defaults",
    async ({ loggedInPage }) => {
      await stopAnalysis.goto({
        startTime: "08:00",
        endTime: "17:59",
        dayOfWeek: "monday,wednesday,friday",
      });

      await test.step("verify chips are rendered from the URL", async () => {
        await expect(stopAnalysis.heading()).toBeVisible();
        await expect(stopAnalysis.chip("08:00 - 17:59")).toBeVisible();
        await expect(stopAnalysis.chip("Mon, Wed, Fri")).toBeVisible();
      });

      await test.step("reset the refine panel values back to defaults", async () => {
        await stopAnalysis.refineResultsButton().click();
        await expect(stopAnalysis.refinePanel()).toBeVisible();
        await stopAnalysis.resetToDefaultsButton().click();
        await stopAnalysis.applyButton().click();
        await expect(stopAnalysis.refinePanel()).toBeHidden();
        await expect(loggedInPage).toHaveURL(/\/stop-analysis\/?(?:\?.*)?$/);
        await expect(stopAnalysis.chip("08:00 - 17:59")).toHaveCount(0);
        await expect(stopAnalysis.chip("Mon, Wed, Fri")).toHaveCount(0);
      });
    },
  );

  loggedInTest(
    "is reachable from the dashboard navigation",
    async ({ loggedInPage }) => {
      await stopAnalysis.openFromDashboardNav();

      await expect(loggedInPage).toHaveURL(/\/stop-analysis\/?$/);
      await expect(stopAnalysis.heading()).toBeVisible();
    },
  );
});
