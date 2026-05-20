import { test, expect, loggedInTest } from "./fixtures";
import { DashboardPage } from "./pages/DashboardPage";

// ─── Unauthenticated ──────────────────────────────────────────────────────────

test("Dashboard - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// ─── Authenticated ────────────────────────────────────────────────────────────

loggedInTest.describe("Dashboard - authenticated", () => {
  // Shared page object — assigned in beforeEach before each test runs.
  let dashboard!: DashboardPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    dashboard = new DashboardPage(loggedInPage);
    await dashboard.goto();
  });

  loggedInTest("displays the Dashboard heading", async () => {
    await expect(dashboard.heading()).toBeVisible();
  });

  loggedInTest("shows the operator selector", async () => {
    await loggedInTest.step("operator input is visible", async () => {
      await expect(dashboard.operatorSelector.combobox()).toBeVisible();
    });

    await loggedInTest.step("defaults to All operators", async () => {
      await dashboard.operatorSelector.openDropdown();
      await expect(
        dashboard.operatorSelector.selectedOption("All operators"),
      ).toBeVisible();
    });
  });

  loggedInTest("shows the stop type toggle with both options", async () => {
    await loggedInTest.step("All stops radio is visible", async () => {
      await expect(dashboard.stopTypeToggle.allStopsRadio()).toBeVisible();
    });

    await loggedInTest.step("Timing points radio is visible", async () => {
      await expect(dashboard.stopTypeToggle.timingPointsRadio()).toBeVisible();
    });

    await loggedInTest.step("Timing points is selected by default",async () => {
        await expect(dashboard.stopTypeToggle.timingPointsRadio()).toBeChecked();
      });
  });

  loggedInTest("shows the on-time performance section", async () => {
    await loggedInTest.step("section heading is visible", async () => {
      await expect(dashboard.onTimeHeading()).toBeVisible();
    });

    await loggedInTest.step("period selector dropdown is visible", async () => {
      await expect(dashboard.periodSelector()).toBeVisible();
    });
  });

  loggedInTest("shows the Top 3 and Bottom 3 ranking tabs", async () => {
    await loggedInTest.step("Top 3 tab is visible", async () => {
      await expect(dashboard.topThreeTab()).toBeVisible();
    });

    await loggedInTest.step("Bottom 3 tab is visible", async () => {
      await expect(dashboard.bottomThreeTab()).toBeVisible();
    });

    await loggedInTest.step("Top 3 tab shows exactly 3 rows", async () => {
      await dashboard.selectTopThree();
      await expect(dashboard.rankingRows()).toHaveCount(3);
    });

    await loggedInTest.step("Bottom 3 tab shows exactly 3 rows", async () => {
      await dashboard.selectBottomThree();
      await expect(dashboard.rankingRows()).toHaveCount(3);
    });
  });

  loggedInTest("shows the vehicle count section", async () => {
    await loggedInTest.step("section heading is visible", async () => {
      await expect(dashboard.vehicleCountHeading()).toBeVisible();
    });

    await loggedInTest.step("Current label is visible", async () => {
      await expect(dashboard.currentLabel()).toBeVisible();
    });

    await loggedInTest.step("Expected label is visible", async () => {
      await expect(dashboard.expectedLabel()).toBeVisible();
    });

    await loggedInTest.step("Live status link is visible", async () => {
      await expect(dashboard.liveStatusLink()).toBeVisible();
    });
  });

  loggedInTest("shows the feed status section", async () => {
    await loggedInTest.step("section heading is visible", async () => {
      await expect(dashboard.feedStatusHeading()).toBeVisible();
    });

    await loggedInTest.step("feed status table is present", async () => {
      await expect(dashboard.feedStatusTable()).toBeVisible();
    });

    await loggedInTest.step("NOC feed monitoring link is visible", async () => {
      await expect(dashboard.nocFeedMonitoringLink()).toBeVisible();
    });
  });

  loggedInTest(
    "pre-selects All stops when stopType query param is set",
    async () => {
      await dashboard.goto({ allStops: "true" });
      await expect(dashboard.stopTypeToggle.allStopsRadio()).toBeChecked();
    },
  );

  loggedInTest(
    "updates the URL when stop type is changed to All stops",
    async ({ loggedInPage }) => {
      await expect(dashboard.stopTypeToggle.timingPointsRadio()).toBeChecked();
      await dashboard.stopTypeToggle.selectAllStops();
      await expect(loggedInPage).toHaveURL(/allStops=true/);
    },
  );

  // Optional: Requires TEST_NOC_CODE env var to be set
  loggedInTest(
    "filters by operator when nocCode is provided in the URL",
    async () => {
      const nocCode = process.env.TEST_NOC_CODE;
      if (!nocCode) {
        loggedInTest.skip(
          !nocCode,
          "TEST_NOC_CODE not set — skipping operator filter test",
        );
        return;
      }
      await dashboard.goto({ nocCode });
      await dashboard.operatorSelector.openDropdown();
      await expect(
        dashboard.operatorSelector.selectedOption("All operators"),
      ).toHaveCount(0);
    },
  );

  loggedInTest(
    "filters by operator when nocCode is selected via dashboard dropdown",
    async ({ loggedInPage }) => {
      await dashboard.operatorSelector.selectFirstOperator();
      await expect(loggedInPage).toHaveURL(/nocCode=/);
    },
  );

  loggedInTest(
    "filters by operator when nocCode is selected via dashboard dropdown",
    async ({ loggedInPage }) => {
      await loggedInPage.getByRole("combobox", { name: "Operator" }).click();

      // ng-select renders options as role="option" in a dropdown panel
      const firstOperator = loggedInPage
        .getByRole("option")
        .filter({ hasNotText: /all operators/i })
        .first();

      await expect(firstOperator).toBeVisible();
      await firstOperator.click();
      await expect(loggedInPage).toHaveURL(/nocCode=/);
    },
  );
});
