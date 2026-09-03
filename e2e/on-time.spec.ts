import { test, expect, loggedInTest } from "./fixtures";
import { OnTimePage } from "./pages/OnTimePage";

// On-Time Page
test("On-Time Page - Redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/on-time", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

loggedInTest.describe("On-Time Page - Authenticated", () => {
  let onTime!: OnTimePage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    onTime = new OnTimePage(loggedInPage);

    await onTime.goto();
  });

  loggedInTest(
    "is reachable from dashboard navigation",
    async ({ loggedInPage }) => {
      await onTime.openFromDashboardNav();

      await expect(loggedInPage).toHaveURL(/\/on-time\/?$/);
      await expect(onTime.heading()).toBeVisible();
    },
  );

  loggedInTest(
    "shows distribution, time-of-day and day-of-week charts for a service",
    async ({ loggedInPage }) => {
      const nocCode = process.env.TEST_NOC_CODE;
      const lineId = process.env.TEST_LINE_ID;

      if (nocCode && lineId) {
        await onTime.gotoService(nocCode, lineId);
      } else if (nocCode) {
        await onTime.gotoOperator(nocCode);
        await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
        const serviceLinkCount = await onTime.firstServiceDrillInLink().count();
        loggedInTest.skip(
          serviceLinkCount === 0,
          "No service drill-in link available; set TEST_LINE_ID to run this test.",
        );
        await onTime.firstServiceDrillInLink().click();
      } else {
        await onTime.gotoIndex();
        await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
        const operatorCount = await onTime.operatorLinks().count();
        loggedInTest.skip(
          operatorCount === 0,
          "No operator links available on /on-time; set TEST_NOC_CODE to run this test.",
        );
        await onTime.operatorLinks().first().click();
        await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
        const serviceLinkCount = await onTime.firstServiceDrillInLink().count();
        loggedInTest.skip(
          serviceLinkCount === 0,
          "No service drill-in link available for this operator.",
        );
        await onTime.firstServiceDrillInLink().click();
      }

      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/[^/]+\/?$/);
      await expect(onTime.serviceLoadingText()).toHaveCount(0, {
        timeout: 60000,
      });

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
          "No operator links available on /on-time; set TEST_NOC_CODE to run this test.",
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

  loggedInTest("renders summary stats", async () => {
    await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
    await expect(onTime.summaryStats()).toBeVisible();
    await expect(onTime.summaryStatItems()).toHaveCount(5);

    for (const statName of [
      "On-time",
      "Late",
      "Early",
      "Incomplete Data",
      "Average Delay",
    ]) {
      await expect(onTime.summaryStat(statName)).toBeVisible();
      await expect(onTime.summaryStatItem(statName)).not.toHaveText(
        new RegExp(`^\\s*${statName}\\s*$`),
      );
    }
  });

  loggedInTest("renders the operator table", async () => {
    await expect(onTime.loadingText()).toHaveCount(0, { timeout: 30000 });
    await expect(onTime.operatorTable()).toBeVisible();
    await expect(onTime.operatorTableHeader("NOC")).toBeVisible();
    await expect(onTime.operatorTableHeader("Operator")).toBeVisible();
  });

  loggedInTest(
    "renders nocCode page if nocCode clicked",
    async ({ loggedInPage }) => {
      const nocCode = process.env.TEST_NOC_CODE;

      if (nocCode) {
        await onTime.gotoOperator(nocCode);
      } else {
        const operatorCount = await onTime.operatorLinks().count();
        loggedInTest.skip(
          operatorCount === 0,
          "No operator links available on /on-time; set TEST_NOC_CODE to run this test.",
        );

        await expect(onTime.operatorLinks().first()).toBeVisible();
        await onTime.operatorLinks().first().click();
      }

      await expect(loggedInPage).toHaveURL(
        nocCode
          ? new RegExp(`\\/on-time\\/${encodeURIComponent(nocCode)}\\/?$`)
          : /\/on-time\/[^/]+\/?$/,
      );
    },
  );

  loggedInTest(
    "opens the compare thresholds modal and shows the default values",
    async () => {
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });

      await onTime.compareThresholdsLink().click();

      await expect(onTime.thresholdModalHeading()).toBeVisible();
      await expect(
        onTime.thresholdModal().getByRole("row", { name: /on time/i }),
      ).toBeVisible();
    },
  );

  loggedInTest("compares punctuality against custom thresholds", async () => {
    await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });

    await onTime.compareThresholdsLink().click();
    await expect(onTime.thresholdModalHeading()).toBeVisible();

    await onTime.thresholdEarlyInput().fill("2");
    await onTime.thresholdLateInput().fill("10");
    await onTime.thresholdCompareButton().click();

    // The "On time" row's Comparison cell should populate with a percentage.
    await expect(onTime.thresholdComparisonCell(/on time/i)).toContainText(
      "%",
      { timeout: 30000 },
    );
  });

  loggedInTest(
    "shows a validation error for out-of-range thresholds",
    async () => {
      await onTime.compareThresholdsLink().click();
      await onTime.thresholdEarlyInput().fill("50");
      await onTime.thresholdCompareButton().click();

      await expect(onTime.thresholdValidationError()).toBeVisible();
    },
  );

  loggedInTest(
    "closes the threshold modal with the Escape key",
    async ({ loggedInPage }) => {
      await onTime.compareThresholdsLink().click();
      await expect(onTime.thresholdModal()).toBeVisible();

      await loggedInPage.keyboard.press("Escape");
      await expect(onTime.thresholdModal()).toHaveCount(0);
    },
  );
});

loggedInTest.describe("On-Time Operator Page - Authenticated", () => {
  let onTime!: OnTimePage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    onTime = new OnTimePage(loggedInPage);

    const nocCode = process.env.TEST_NOC_CODE;
    if (nocCode) {
      await onTime.gotoOperator(nocCode);
    } else {
      await onTime.gotoIndex();
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const operatorCount = await onTime.operatorLinks().count();
      loggedInTest.skip(
        operatorCount === 0,
        "No operator links available on /on-time; set TEST_NOC_CODE to skip.",
      );
      await onTime.operatorLinks().first().click();
    }

    await expect(onTime.datePresetSelect()).toBeVisible({ timeout: 60000 });
  });

  loggedInTest(
    "renders the page header with correct heading and back link",
    async ({ loggedInPage }) => {
      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/?$/);
      await expect(onTime.heading()).toBeVisible();
      await expect(onTime.operatorPageCaption()).toContainText(
        "On-time performance",
      );
      await expect(onTime.backToAllOperatorsLink()).toBeVisible();
    },
  );

  loggedInTest(
    "renders the filter controls with correct defaults",
    async () => {
      await expect(onTime.matchTypeEvidencedButton()).toBeVisible();
      await expect(onTime.matchTypeEvidencedButton()).toBeChecked();
      await expect(onTime.matchTypeEstimatedButton()).toBeVisible();

      await expect(onTime.stopTypeTimingPointsButton()).toBeVisible();
      await expect(onTime.stopTypeTimingPointsButton()).toBeChecked();
      await expect(onTime.stopTypeAllStopsButton()).toBeVisible();

      await expect(onTime.datePresetSelect()).toBeVisible();
      await expect(onTime.datePresetSelect()).toContainText("Last 7 days");

      await expect(onTime.refineResultsButton()).toBeVisible();
    },
  );

  loggedInTest(
    "renders the services table with expected column headers",
    async () => {
      await expect(onTime.serviceTable()).toBeVisible();

      for (const header of [
        "Service",
        "Direction",
        "Scheduled departures",
        "Recorded departures",
        "Av. delay",
        "On time",
        "Late",
        "Early",
      ]) {
        await expect(onTime.serviceTableHeader(header)).toBeVisible();
      }
    },
  );

  loggedInTest(
    "renders service search input and directions filter",
    async () => {
      await expect(onTime.serviceSearchInput()).toBeVisible();
      await expect(onTime.directionsDropdown()).toBeVisible();
    },
  );

  loggedInTest("renders display options button", async () => {
    await expect(onTime.displayOptionsButton()).toBeVisible();
  });
});

loggedInTest.describe("On-Time Service Page - Authenticated", () => {
  let onTime!: OnTimePage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    onTime = new OnTimePage(loggedInPage);

    const nocCode = process.env.TEST_NOC_CODE;
    const lineId = process.env.TEST_LINE_ID;

    if (nocCode && lineId) {
      await onTime.gotoService(nocCode, lineId);
    } else if (nocCode) {
      await onTime.gotoOperator(nocCode);
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const drillInCount = await onTime.firstServiceDrillInLink().count();
      loggedInTest.skip(
        drillInCount === 0,
        "No service drill-in link available; set TEST_LINE_ID to run this test.",
      );
      await onTime.firstServiceDrillInLink().click();
    } else {
      await onTime.gotoIndex();
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const operatorCount = await onTime.operatorLinks().count();
      loggedInTest.skip(
        operatorCount === 0,
        "No operator links available on /on-time; set TEST_NOC_CODE to run this test .",
      );
      await onTime.operatorLinks().first().click();
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const drillInCount = await onTime.firstServiceDrillInLink().count();
      loggedInTest.skip(
        drillInCount === 0,
        "No service drill-in link available for this operator in the current dataset.",
      );
      await onTime.firstServiceDrillInLink().click();
    }

    await expect(onTime.serviceLoadingText()).toHaveCount(0, {
      timeout: 60000,
    });
  });

  loggedInTest(
    "renders the page header with correct heading and back link",
    async ({ loggedInPage }) => {
      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/[^/]+\/?$/);
      await expect(onTime.servicePageHeading()).toBeVisible();
      await expect(onTime.operatorPageCaption()).toContainText(
        "On-time performance",
      );
      await expect(onTime.backToOperatorLink()).toBeVisible();
    },
  );

  loggedInTest(
    "renders the filter controls with correct defaults",
    async () => {
      await expect(onTime.matchTypeEvidencedButton()).toBeVisible();
      await expect(onTime.matchTypeEvidencedButton()).toBeChecked();
      await expect(onTime.matchTypeEstimatedButton()).toBeVisible();

      await expect(onTime.stopTypeTimingPointsButton()).toBeVisible();
      await expect(onTime.stopTypeTimingPointsButton()).toBeChecked();
      await expect(onTime.stopTypeAllStopsButton()).toBeVisible();

      await expect(onTime.datePresetSelect()).toBeVisible();
      await expect(onTime.datePresetSelect()).toContainText("Last 7 days");

      await expect(onTime.refineResultsButton()).toBeVisible();
    },
  );

  loggedInTest(
    "renders the stops table with expected column headers",
    async () => {
      await expect(onTime.stopsTable()).toBeVisible();

      for (const header of [
        "NAPTAN",
        "Name",
        "Direction",
        "Scheduled departures",
        "Recorded departures",
        "Av. delay",
        "On time",
        "Late",
        "Early",
      ]) {
        await expect(onTime.stopsTableHeader(header)).toBeVisible();
      }
    },
  );

  loggedInTest(
    "renders directions filter and display options button",
    async () => {
      await expect(onTime.directionsDropdown()).toBeVisible();
      await expect(onTime.displayOptionsButton()).toBeVisible();
    },
  );

  loggedInTest("renders summary stats", async () => {
    await expect(onTime.summaryStats()).toBeVisible();
    await expect(onTime.summaryStatItems()).toHaveCount(5);

    for (const statName of [
      "On-time",
      "Late",
      "Early",
      "Incomplete Data",
      "Average Delay",
    ]) {
      await expect(onTime.summaryStat(statName)).toBeVisible();
    }
  });
});

loggedInTest.describe("On-Time Operator Not Found - Authenticated", () => {
  let onTime!: OnTimePage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    onTime = new OnTimePage(loggedInPage);
    await onTime.gotoOperatorNotFound();
  });

  loggedInTest(
    "renders operator not found page with correct content",
    async ({ loggedInPage }) => {
      await expect(loggedInPage).toHaveURL(/\/on-time\/operator-not-found\/?$/);
      await expect(onTime.operatorNotFoundHeading()).toBeVisible();
      await expect(onTime.operatorNotFoundMessage()).toBeVisible();
    },
  );

  loggedInTest("has a link back to all operators", async () => {
    await expect(onTime.operatorNotFoundBackLink()).toBeVisible();
  });
});

loggedInTest.describe("On-Time View Operator - Authenticated", () => {
  let onTime!: OnTimePage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    onTime = new OnTimePage(loggedInPage);

    const nocCode = process.env.TEST_NOC_CODE;
    if (nocCode) {
      await onTime.gotoOperator(nocCode);
    } else {
      await onTime.gotoIndex();
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const operatorCount = await onTime.operatorLinks().count();
      loggedInTest.skip(
        operatorCount === 0,
        "No operator links available on /on-time; set TEST_NOC_CODE to run this test.",
      );
      await onTime.operatorLinks().first().click();
    }

    await expect(onTime.datePresetSelect()).toBeVisible({ timeout: 60000 });
  });

  loggedInTest(
    "displays operator page with correct page header",
    async ({ loggedInPage }) => {
      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/?$/);
      await expect(onTime.heading()).toBeVisible();
      await expect(onTime.operatorPageCaption()).toContainText(
        "On-time performance",
      );
    },
  );

  loggedInTest(
    "allows operator selection via dropdown",
    async ({ loggedInPage }) => {
      // Operator selector should be visible
      await expect(loggedInPage.getByLabel("Operator")).toBeVisible();
    },
  );

  loggedInTest(
    "can navigate to a service from operator page",
    async ({ loggedInPage }) => {
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const serviceLinkCount = await onTime.firstServiceDrillInLink().count();
      loggedInTest.skip(
        serviceLinkCount === 0,
        "No service drill-in link available for this operator.",
      );
      await onTime.firstServiceDrillInLink().click();

      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/[^/]+\/?$/);
      await expect(onTime.servicePageHeading()).toBeVisible();
    },
  );
});

loggedInTest.describe("On-Time View Service - Authenticated", () => {
  let onTime!: OnTimePage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    onTime = new OnTimePage(loggedInPage);

    const nocCode = process.env.TEST_NOC_CODE;
    const lineId = process.env.TEST_LINE_ID;

    if (nocCode && lineId) {
      await onTime.gotoService(nocCode, lineId);
    } else if (nocCode) {
      await onTime.gotoOperator(nocCode);
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const drillInCount = await onTime.firstServiceDrillInLink().count();
      loggedInTest.skip(
        drillInCount === 0,
        "No service drill-in link available; set TEST_LINE_ID to run this test.",
      );
      await onTime.firstServiceDrillInLink().click();
    } else {
      await onTime.gotoIndex();
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const operatorCount = await onTime.operatorLinks().count();
      loggedInTest.skip(
        operatorCount === 0,
        "No operator links available on /on-time; set TEST_NOC_CODE to run this test.",
      );
      await onTime.operatorLinks().first().click();
      await expect(onTime.loadingText()).toHaveCount(0, { timeout: 60000 });
      const drillInCount = await onTime.firstServiceDrillInLink().count();
      loggedInTest.skip(
        drillInCount === 0,
        "No service drill-in link available for this operator.",
      );
      await onTime.firstServiceDrillInLink().click();
    }

    await expect(onTime.serviceLoadingText()).toHaveCount(0, {
      timeout: 60000,
    });
  });

  loggedInTest(
    "displays service page with correct page header",
    async ({ loggedInPage }) => {
      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/[^/]+\/?$/);
      await expect(onTime.servicePageHeading()).toBeVisible();
      await expect(onTime.operatorPageCaption()).toContainText(
        "On-time performance",
      );
    },
  );

  loggedInTest(
    "has chart tabs for distribution, time-of-day and day-of-week",
    async () => {
      await expect(onTime.distributionTab()).toBeVisible();
      await expect(onTime.timeOfDayTab()).toBeVisible();
      await expect(onTime.dayOfWeekTab()).toBeVisible();
    },
  );

  loggedInTest(
    "can navigate back to operator page",
    async ({ loggedInPage }) => {
      await onTime.backToOperatorLink().click();

      await expect(loggedInPage).toHaveURL(/\/on-time\/[^/]+\/?$/);
      await expect(onTime.heading()).toBeVisible();
    },
  );
});
