import { test, expect, loggedInTest } from "./fixtures";
import { DistancesPage } from "./pages/DistancePage";

test("Distance Page - Unauthenticated", async ({ page }) => {
  await page.goto("/distances", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

loggedInTest.describe("Distance Page - Authenticated", () => {
  let distances!: DistancesPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    distances = new DistancesPage(loggedInPage);
    await distances.goTo();

    // Wait for all network requests to complete
    await loggedInPage.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(loggedInPage.getByText(/Loading\.\.\./i)).toHaveCount(0, {
      timeout: 60000,
    });
  });

  loggedInTest(
    "reachable from dashboard navigation panel",
    async ({ loggedInPage }) => {
      await distances.openFromNavigationPanel();
      await expect(loggedInPage).toHaveURL(/\/distances/);
    },
  );

  loggedInTest("renders the Distances heading", async () => {
    await expect(distances.heading()).toBeVisible();
  });

  loggedInTest("renders the distances filter panel", async () => {
    await expect(distances.filterPanel().getByText("Date Range")).toBeVisible();
    await expect(distances.adminAreaFilter()).toBeVisible();
    await expect(distances.organisationsFilter()).toBeVisible();
    await expect(distances.operatorsFilter()).toBeVisible();
    await expect(distances.licensesFilter()).toBeVisible();
    await expect(distances.servicesFilter()).toBeVisible();
  });

  loggedInTest("renders the distances table", async () => {
    await expect(distances.table()).toBeVisible();
  });

  loggedInTest("renders the generate data button", async () => {
    await expect(distances.generateButton()).toBeVisible();
  });
});
