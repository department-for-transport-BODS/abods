import { test, expect, loggedInTest } from "./fixtures";
import { DistancesPage } from "./pages/DistancePage";

// Unauthenticated
test("Distance Page - Unauthenticated", async ({ page }) => {
  await page.goto("/distances", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// Authenticated
loggedInTest.describe("Distance Page - Authenticated", () => {
  let distances!: DistancesPage;

  loggedInTest("reachable from dashboard navigation panel", async ({ page }) => {
    await distances.openFromNavigationPanel();
    await expect(page).toHaveURL(/\/distances/);
  });

  loggedInTest("renders the Distances heading", async () => {
    await expect(distances.heading()).toBeVisible();
  });

  loggedInTest("renders the distances filter panel", async () => {
    await expect(distances.filterPanel()).toBeVisible();
  });

  loggedInTest("renders the distances table", async () => {
    await expect(distances.table()).toBeVisible();
  });

  loggedInTest("renders the generate data button", async () => {
    await expect(distances.generateButton()).toBeVisible();
  });
});