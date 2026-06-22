import { test, expect, loggedInTest } from "./fixtures";
import { OnTimePage } from "./pages/OnTimePage";

// Unauthenticated
test("On-time performance - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/on-time", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// Authenticated

loggedInTest.describe("On-time performance - authenticated", () => {
  let onTime!: OnTimePage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    onTime = new OnTimePage(loggedInPage);
  });

  loggedInTest(
    "is reachable from dashboard navigation",
    async ({ loggedInPage }) => {
      await onTime.openFromDashboardNav();

      await expect(loggedInPage).toHaveURL(/\/on-time\/?$/);
      await expect(onTime.heading()).toBeVisible();
      await onTime.goto();
    },
  );

  loggedInTest(
    "shows the segmented toggles and defaults correctly",
    async () => {
      await expect(onTime.matchTypeEstimatedButton()).toBeVisible();
      await expect(onTime.matchTypeEvidencedButton()).toBeVisible();
      await expect(onTime.matchTypeEvidencedButton()).toBeChecked();

      await expect(onTime.stopTypeAllStopsButton()).toBeVisible();
      await expect(onTime.stopTypeTimingPointsButton()).toBeVisible();
      await expect(onTime.stopTypeTimingPointsButton()).toBeChecked();
    },
  );

  loggedInTest(
    "shows distribution, time-of-day and day-of-week charts for an operator",
    async ({ loggedInPage }) => {
      const nocCode = process.env.TEST_NOC_CODE;

      if (nocCode) {
        await onTime.gotoOperator(nocCode);
      } else {
        await onTime.gotoIndex();
        const operatorCount = await onTime.operatorLinks().count();
        loggedInTest.skip(
          operatorCount === 0,
          "No operator links available on /on-time; set TEST_NOC_CODE to run this test deterministically.",
        );
        await expect(onTime.operatorLinks().first()).toBeVisible();
        await onTime.operatorLinks().first().click();
      }

      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/?$/);
      await expect(onTime.heading()).toBeVisible();
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });

      await expect(onTime.distributionTab()).toBeVisible();
      await expect(onTime.timeOfDayTab()).toBeVisible();
      await expect(onTime.dayOfWeekTab()).toBeVisible();

      await onTime.distributionTab().click();
      await expect(onTime.delayFrequencyChart()).toBeVisible();

      await onTime.timeOfDayTab().click();
      await expect(onTime.timeOfDayChart()).toBeVisible();
      await expect(onTime.stackedHistogramChart()).toBeVisible();

      await onTime.dayOfWeekTab().click();
      await expect(onTime.dayOfWeekChart()).toBeVisible();
      await expect(onTime.stackedHistogramChart()).toBeVisible();
    },
  );

  loggedInTest(
    "drills into a service and shows excess wait time chart state",
    async ({ loggedInPage }) => {
      const nocCode = process.env.TEST_NOC_CODE;

      if (nocCode) {
        await onTime.gotoOperator(nocCode);
      } else {
        await onTime.gotoIndex();
        const operatorCount = await onTime.operatorLinks().count();
        loggedInTest.skip(
          operatorCount === 0,
          "No operator links available on /on-time; set TEST_NOC_CODE to run this test deterministically.",
        );
        await expect(onTime.operatorLinks().first()).toBeVisible();
        await onTime.operatorLinks().first().click();
      }

      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/?$/);
      const serviceLinkCount = await onTime.firstServiceDrillInLink().count();
      loggedInTest.skip(
        serviceLinkCount === 0,
        "No service drill-in link available for this operator in the current dataset.",
      );
      await expect(onTime.firstServiceDrillInLink()).toBeVisible();
      await onTime.firstServiceDrillInLink().click();

      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/[^/]+\/?$/);

      await expect
        .poll(async () => {
          const chartCount = await onTime.excessWaitTimeChart().count();
          const unavailableCount = await onTime
            .excessWaitUnavailableMessage()
            .count();
          return chartCount + unavailableCount;
        })
        .toBeGreaterThan(0);
    },
  );

  loggedInTest(
    "shows date controls and checks correct options are present",
    async () => {
      await expect(onTime.dateRangeButton()).toBeVisible();
      await expect(onTime.datePresetSelect()).toBeVisible();

      await expect(onTime.datePresetSelect()).toContainText("Last 7 days");
      await expect(onTime.datePresetSelect()).toContainText("Last 28 days");
      await expect(onTime.datePresetSelect()).toContainText("Last month");
      await expect(onTime.datePresetSelect()).toContainText("Month to date");
    },
  );

  loggedInTest(
    "shows and closes the refine results panel and key filters",
    async () => {
      await expect(onTime.refineResultsButton()).toBeVisible();

      await onTime.refineResultsButton().click();
      await expect(onTime.refineResultsHeading()).toBeVisible();

      await expect(onTime.refineResultsMaximumEarlySelect()).toBeVisible();
      await expect(onTime.refineResultsMaximumLateSelect()).toBeVisible();

      await onTime.refineResultsCloseButton().click();
      await expect(onTime.refineResultsHeading()).toHaveCount(0);
    },
  );
});
