import { test, expect, loggedInTest } from "./fixtures";
import { FeedMonitoringPage } from "./pages/FeedMonitoringPage";
import { LiveStatusPage } from "./pages/LiveStatusPage";
import { FeedHistoryPage } from "./pages/FeedHistoryPage";

// Unauthenticated
test("Feed Monitoring Pages - Unauthenticated", async ({ page }) => {
  await page.goto("/feed-monitoring", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// Authenticated
loggedInTest.describe("Feed Monitoring Pages - Authenticated", () => {
  let feedMonitoring!: FeedMonitoringPage;
  let liveStatus!: LiveStatusPage;
  let feedHistory!: FeedHistoryPage;
 
  loggedInTest.beforeEach(async ({ page }) => {
    feedMonitoring = new FeedMonitoringPage(page);
    liveStatus = new LiveStatusPage(page);
    feedHistory = new FeedHistoryPage(page);
  });

  // Feed Monitoring Page
  loggedInTest("reachable from dashboard navigation panel", async ({ page }) => {
    await feedMonitoring.openFromNavigationPanel();
    await expect(page).toHaveURL(/\/feed-monitoring/);
  });

  loggedInTest("renders the Feed Monitoring heading", async () => {
    await expect(feedMonitoring.heading()).toBeVisible();
  });

  loggedInTest("renders the operator search component", async () => {
    await expect(feedMonitoring.searchInput()).toBeVisible();
  });

  loggedInTest("renders the inactive data table", async () => {
    await expect(feedMonitoring.inactiveTable()).toBeVisible();
  });

  loggedInTest("renders the active data table", async () => {
    await expect(feedMonitoring.activeTable()).toBeVisible();
  });

  loggedInTest("renders live status page if operator clicked", async ({ page }) => {
    await feedMonitoring.clickOperatorLink("ALPH");
    await expect(page).toHaveURL(/\/feed-monitoring\/ALPH/);
    await expect(liveStatus.heading()).toBeVisible();
  });

  // Live Status Page 
  loggedInTest("renders the Live Status heading", async () => {
    await expect(liveStatus.heading()).toBeVisible();
  });

  loggedInTest("renders the operator dropdown label", async () => {
    await expect(liveStatus.operatorDropdownLabel()).toBeVisible();
  });

  loggedInTest("renders the view feed history link", async () => {
    await expect(liveStatus.viewFeedHistoryLink()).toBeVisible();
  });

  loggedInTest("renders the back to all operators link", async () => {
    await expect(liveStatus.backToAllOperatorsLink()).toBeVisible();
  });

  loggedInTest("renders the feed status stat", async () => {
    await expect(liveStatus.feedStatusStat()).toBeVisible();
  });

  loggedInTest("renders the current vehicles stat", async () => {
    await expect(liveStatus.currentVehiclesStat()).toBeVisible();
  });

  loggedInTest("renders the expected vehicles stat", async () => {
    await expect(liveStatus.expectedVehiclesStat()).toBeVisible();
  });

  loggedInTest("renders the update frequency stat", async () => {
    await expect(liveStatus.updateFrequencyStat()).toBeVisible();
  });

  loggedInTest("renders the view feed history page if link clicked", async ({ page }) => {
    await liveStatus.viewFeedHistoryLink().click();
    await expect(page).toHaveURL(/\/feed-monitoring\/ALPH\/history/);
    await expect(feedHistory.heading()).toBeVisible();
  });

  loggedInTest("renders the back to all operators link on feed history page and navigates back to live status page", async ({ page }) => {
    await feedHistory.backToLiveStatusLink().click();
    await expect(page).toHaveURL(/\/feed-monitoring\/ALPH/);
    await expect(liveStatus.heading()).toBeVisible();
  });
  
  // Feed History Page
  loggedInTest("renders the Feed History heading", async () => {
    await expect(feedHistory.heading()).toBeVisible();
  });

  loggedInTest("renders the previous link", async () => {
    await expect(feedHistory.previousLink()).toBeVisible();
  });

  loggedInTest("renders the next link", async () => {
    await expect(feedHistory.nextLink()).toBeVisible();
  });

  loggedInTest("renders feed availability stat", async () => {
    await expect(feedHistory.feedAvailabilityStat()).toBeVisible();
  });

  loggedInTest("renders average update frequency stat", async () => {
    await expect(feedHistory.averageUpdateFreqStat()).toBeVisible();
  });

  loggedInTest("renders the back to live status link and navigates back to live status page", async ({ page }) => {
    await feedHistory.backToLiveStatusLink().click();
    await expect(page).toHaveURL(/\/feed-monitoring\/ALPH/);
    await expect(liveStatus.heading()).toBeVisible();
  });
});