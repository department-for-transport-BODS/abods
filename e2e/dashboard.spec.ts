import { test, expect, loggedInTest } from "./fixtures";

// ─── Unauthenticated ──────────────────────────────────────────────────────────

test("Dashboard - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

// ─── Authenticated ────────────────────────────────────────────────────────────

loggedInTest.describe("Dashboard - authenticated", () => {
  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    await loggedInPage.goto("/dashboard", { waitUntil: "domcontentloaded" });
  });

  loggedInTest("displays the Dashboard heading", async ({ loggedInPage }) => {
    await expect(
      loggedInPage.getByRole("heading", { name: "Dashboard", level: 1 }),
    ).toBeVisible();
  });

  loggedInTest("shows the operator selector", async ({ loggedInPage }) => {
    const operatorInput = loggedInPage.locator("#operator_selector");

    await loggedInTest.step("operator input is visible", async () => {
      await expect(operatorInput).toBeVisible();
    });

    await loggedInTest.step("defaults to All operators", async () => {
      await expect(
        loggedInPage.getByText("All operators", { exact: true }),
      ).toBeVisible();
    });
  });

  loggedInTest(
    "shows the stop type toggle with both options",
    async ({ loggedInPage }) => {
      await loggedInTest.step("All stops radio is visible", async () => {
        await expect(
          loggedInPage.getByRole("radio", { name: "All stops" }),
        ).toBeVisible();
      });

      await loggedInTest.step("Timing points radio is visible", async () => {
        await expect(
          loggedInPage.getByRole("radio", { name: "Timing points" }),
        ).toBeVisible();
      });

      await loggedInTest.step(
        "Timing points is selected by default",
        async () => {
          await expect(
            loggedInPage.getByRole("radio", { name: "Timing points" }),
          ).toBeChecked();
        },
      );
    },
  );

  loggedInTest(
    "shows the on-time performance section",
    async ({ loggedInPage }) => {
      await loggedInTest.step("section heading is visible", async () => {
        await expect(
          loggedInPage.getByRole("heading", {
            name: "On-time performance",
            level: 2,
          }),
        ).toBeVisible();
      });

      await loggedInTest.step(
        "period selector dropdown is visible",
        async () => {
          // PerformanceWidget renders a combobox/select for the time period
          await expect(
            loggedInPage
              .getByRole("combobox", { name: /period|last/i })
              .or(loggedInPage.getByRole("combobox").nth(1)),
          ).toBeVisible();
        },
      );
    },
  );

  loggedInTest("shows the vehicle count section", async ({ loggedInPage }) => {
    await loggedInTest.step("section heading is visible", async () => {
      await expect(
        loggedInPage.getByRole("heading", { name: "Vehicle count", level: 2 }),
      ).toBeVisible();
    });

    await loggedInTest.step("Current label is visible", async () => {
      await expect(loggedInPage.getByText("Current")).toBeVisible();
    });

    await loggedInTest.step("Expected label is visible", async () => {
      await expect(loggedInPage.getByText("Expected")).toBeVisible();
    });

    await loggedInTest.step("Live status link is visible", async () => {
      await expect(
        loggedInPage.getByRole("link", { name: /live status/i }),
      ).toBeVisible();
    });
  });

  loggedInTest("shows the feed status section", async ({ loggedInPage }) => {
    await loggedInTest.step("section heading is visible", async () => {
      await expect(
        loggedInPage.getByRole("heading", { name: "Feed status", level: 2 }),
      ).toBeVisible();
    });

    await loggedInTest.step("feed status table is present", async () => {
      await expect(
        loggedInPage.locator("table.feed-status-summary"),
      ).toBeVisible();
    });

    await loggedInTest.step("NOC feed monitoring link is visible", async () => {
      await expect(
        loggedInPage.getByRole("link", { name: /noc feed monitoring/i }),
      ).toBeVisible();
    });
  });

  loggedInTest(
    "pre-selects All stops when stopType=AllStops is in the URL",
    async ({ loggedInPage }) => {
      await loggedInPage.goto("/dashboard?stopType=AllStops", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        loggedInPage.getByRole("radio", { name: "All stops" }),
      ).toBeChecked();
    },
  );

  loggedInTest(
    "updates the URL when stop type is changed to All stops",
    async ({ loggedInPage }) => {
      await loggedInPage.getByRole("radio", { name: "All stops" }).click();
      await expect(loggedInPage).toHaveURL(/stopType=AllStops/);
    },
  );

  loggedInTest(
    "filters by operator when nocCode is provided in the URL",
    async ({ loggedInPage }) => {
      // Verify the operator selector reflects an active filter when a nocCode
      // is present — the combobox should not read "All operators"
      const nocCode = process.env.TEST_NOC_CODE;
      if (!nocCode) {
        loggedInTest.skip(
          !nocCode,
          "TEST_NOC_CODE not set — skipping operator filter test",
        );
        return;
      }
      await loggedInPage.goto(`/dashboard?nocCode=${nocCode}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        loggedInPage.getByText("All operators", { exact: true }),
      ).not.toBeVisible();
    },
  );
});
