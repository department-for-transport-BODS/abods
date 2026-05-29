import { test, expect, loggedInTest } from "./fixtures";
import { DistancesPage } from "./pages/DistancePage";

// Unauthenticated
test("Distances - Unauthenticated", async ({ page }) => {
  await page.goto("/distances", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// Authenticated 
loggedInTest.describe("Distances - Authenticated", () => {
  let distancesPage!: DistancesPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    distancesPage = new DistancesPage(loggedInPage);
  });

  loggedInTest(
    "Distances - Page is reachable from navigation panel and loads page content",
    async ({ loggedInPage }) => {
      await distancesPage.openFromNavigationPanel();

      await expect(loggedInPage).toHaveURL(/\/distances\/?$/);
      await expect(distancesPage.heading()).toBeVisible();
    
      // TODO:NOW Add more assertions to verify table content, filters, etc. once we have test data in place and the page is more fully developed
      // Click through to pages 
      // Components get rendered
        
    },
  );
});