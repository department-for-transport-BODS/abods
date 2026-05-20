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
      await expect(
        dashboard.operatorSelector.defaultValueLabel(),
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

    await loggedInTest.step(
      "Timing points is selected by default",
      async () => {
        await expect(
          dashboard.stopTypeToggle.timingPointsRadio(),
        ).toBeChecked();
      },
    );
  });

  loggedInTest("shows the on-time performance section", async () => {
    await loggedInTest.step("section heading is visible", async () => {
      await expect(dashboard.onTimeHeading()).toBeVisible();
    });

    await loggedInTest.step("period selector dropdown is visible", async () => {
      await expect(dashboard.periodSelector()).toBeVisible();
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
      // Angular dashboard reads ?allStops=true (not stopType).
      // Next.js may use a different param — a mismatch here signals a migration issue.
      await dashboard.goto({ allStops: "true" });
      await expect(dashboard.stopTypeToggle.allStopsRadio()).toBeChecked();
    },
  );

  loggedInTest(
    "updates the URL when stop type is changed to All stops",
    async ({ loggedInPage }) => {
      // Wait for Angular to initialise the toggle before interacting.
      // The default selection (Timing points checked) confirms event handlers are attached.
      await expect(dashboard.stopTypeToggle.timingPointsRadio()).toBeChecked();
      await dashboard.stopTypeToggle.selectAllStops();
      // Angular dashboard writes ?allStops=true to the URL.
      // If Next.js uses a different param, this test will flag the discrepancy.
      await expect(loggedInPage).toHaveURL(/allStops=true/);
    },
  );

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
      await expect(
        dashboard.operatorSelector.defaultValueLabel(),
      ).not.toBeVisible();
    },
  );

  loggedInTest(
    "filters by operator when nocCode is selected via dashboard dropdown",
    async ({ loggedInPage }) => {
      await dashboard.operatorSelector.selectFirstOperator();
      // Angular dashboard writes ?nocCode=XXX to the URL on operator selection.
      await expect(loggedInPage).toHaveURL(/nocCode=/);
    },
  );
});
