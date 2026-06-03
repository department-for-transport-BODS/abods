import { test, expect, loggedInTest } from "./fixtures";
import { FeedMonitoringPage } from "./pages/FeedMonitoringPage";
import { LiveStatusPage } from "./pages/LiveStatusPage";
import { FeedHistoryPage } from "./pages/FeedHistoryPage";

// Feed Monitoring Page
test("Feed Monitoring Page - Unauthenticated", async ({ page }) => {
  await page.goto("/feed-monitoring", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

loggedInTest.describe("Feed Monitoring Page - Authenticated", () => {
  let feedMonitoring!: FeedMonitoringPage;
  let liveStatus!: LiveStatusPage;
 
  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    feedMonitoring = new FeedMonitoringPage(loggedInPage);
    liveStatus = new LiveStatusPage(loggedInPage);

    await feedMonitoring.goTo();
    
    // Wait for all network requests to complete
    await loggedInPage.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(loggedInPage.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });

  });

  // Feed Monitoring Page
  loggedInTest("reachable from dashboard navigation panel", async ({ loggedInPage }) => {
    await feedMonitoring.openFromNavigationPanel();
    await expect(loggedInPage).toHaveURL(/\/feed-monitoring/);
  });

  loggedInTest("renders the Feed Monitoring heading", async () => {
    await expect(feedMonitoring.heading()).toBeVisible();
  });

  loggedInTest("renders the operator search label", async () => {
    await expect(feedMonitoring.searchInputLabel()).toBeVisible();
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

  loggedInTest("renders live status page if operator clicked", async () => {
    let nocCode: string = process.env.TEST_NOC_CODE as string;

    await feedMonitoring.clickOperatorLink(nocCode);
    await expect(feedMonitoring.page).toHaveURL(new RegExp(`/feed-monitoring/${nocCode}`));
    
    // Wait for all network requests to complete
    await feedMonitoring.page.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(feedMonitoring.page.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });
    
    await expect(liveStatus.heading()).toBeVisible();
  });
});

// Feed Monitoring Live Status Page
test("Live Status Page - Unauthenticated", async ({ page }) => {
  let nocCode: string = process.env.TEST_NOC_CODE as string;
  await page.goto(`/feed-monitoring/${nocCode}`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

loggedInTest.describe("Live Status Page - Authenticated", () => {
  let feedMonitoring!: FeedMonitoringPage;
  let liveStatus!: LiveStatusPage;
  let feedHistory!: FeedHistoryPage;
 
  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    feedMonitoring = new FeedMonitoringPage(loggedInPage);
    liveStatus = new LiveStatusPage(loggedInPage);
    feedHistory = new FeedHistoryPage(loggedInPage);

    let nocCode: string = process.env.TEST_NOC_CODE as string;

    await liveStatus.goTo(nocCode);
    
    // Wait for all network requests to complete
    await loggedInPage.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(loggedInPage.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });

  });

  loggedInTest("renders the Live Status heading", async () => {
    await expect(liveStatus.heading()).toBeVisible();
  });

  loggedInTest("renders the operator dropdown label", async () => {
    await expect(liveStatus.operatorDropdownLabel()).toBeVisible();
  });

  loggedInTest("renders the operator dropdown component", async () => {
    await expect(liveStatus.operatorDropdown()).toBeVisible();
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

  loggedInTest("renders the feed history page if link clicked", async () => {
    await liveStatus.viewFeedHistoryLink().click();

    let nocCode: string = process.env.TEST_NOC_CODE as string;
    await expect(liveStatus.page).toHaveURL(new RegExp(`/feed-monitoring/${nocCode}/feed-history`));

    // Wait for all network requests to complete
    await liveStatus.page.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(liveStatus.page.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });
    
    await expect(feedHistory.heading()).toBeVisible();
  });

  loggedInTest("renders the feed monitoring page if back link clicked", async ({ loggedInPage }) => {
    await liveStatus.backToAllOperatorsLink().click();

    await expect(liveStatus.page).toHaveURL(/\/feed-monitoring/);

    // Wait for all network requests to complete
    await liveStatus.page.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(liveStatus.page.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });
    
    await expect(feedMonitoring.heading()).toBeVisible();
  });
});

// Feed History Page - Unauthenticated
test("Feed History Page - Unauthenticated", async ({ page }) => {
  let nocCode: string = process.env.TEST_NOC_CODE as string;
  await page.goto(`/feed-monitoring/${nocCode}/feed-history`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

loggedInTest.describe("Feed History Page - Authenticated", () => {
  let liveStatus!: LiveStatusPage;
  let feedHistory!: FeedHistoryPage;
 
  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    liveStatus = new LiveStatusPage(loggedInPage);
    feedHistory = new FeedHistoryPage(loggedInPage);

    let nocCode: string = process.env.TEST_NOC_CODE as string;
    await feedHistory.goTo(nocCode);
    
    // Wait for all network requests to complete
    await loggedInPage.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(loggedInPage.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });

  });

  loggedInTest("renders the Feed History heading", async () => {
    await expect(feedHistory.heading()).toBeVisible();
  });

  loggedInTest("renders the previous and next link and shows correct page", async () => {
    await feedHistory.previousLink().click();

    let nocCode: string = process.env.TEST_NOC_CODE as string;
    await expect(feedHistory.page).toHaveURL(new RegExp(`/feed-monitoring/${nocCode}`));
    
    // Wait for all network requests to complete
    await feedHistory.page.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(feedHistory.page.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });
    
    await expect(feedHistory.heading()).toBeVisible();

    const dayBeforeYesterday = new Date(Date.now() - 2 * 86400000);
    const expectedDateText = dayBeforeYesterday.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    await expect(feedHistory.page.getByText(expectedDateText)).toBeVisible();

    await feedHistory.nextLink().click();

    await expect(feedHistory.page).toHaveURL(new RegExp(`/feed-monitoring/${nocCode}/feed-history`));

    // Wait for all network requests to complete
    await feedHistory.page.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(feedHistory.page.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });

    await expect(feedHistory.heading()).toBeVisible();

    const yesterday = new Date(Date.now() - 86400000);
    const expectedDateText2 = yesterday.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    await expect(feedHistory.page.getByText(expectedDateText2)).toBeVisible();
  });

   loggedInTest("renders feed availability stat", async () => {
    await expect(feedHistory.feedAvailabilityStat()).toBeVisible();
  });

  loggedInTest("renders average update frequency stat", async () => {
    await expect(feedHistory.averageUpdateFreqStat()).toBeVisible();
  });

  loggedInTest("renders the back to live status link and navigates back to live status page", async () => {
    await feedHistory.backToLiveStatusLink().click();

    let nocCode: string = process.env.TEST_NOC_CODE as string;
    await expect(feedHistory.page).toHaveURL(new RegExp(`/feed-monitoring/${nocCode}`));
    
    // Wait for all network requests to complete
    await feedHistory.page.waitForLoadState("networkidle");

    // Wait for loading indicators to disappear
    await expect(feedHistory.page.getByText(/Loading\.\.\./i)).toHaveCount(0, { timeout: 60000 });
    
    await expect(liveStatus.heading()).toBeVisible();
    
  });
});