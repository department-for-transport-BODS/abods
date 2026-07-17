import { expect, loggedInTest, test } from "./fixtures";
import { VehicleJourneysPage } from "./pages/VehicleJourneysPage";

const seededOperatorId = process.env.TEST_NOC_CODE;
const seededServiceId = process.env.TEST_LINE_ID;

async function loadJourneySearchResults(
  vehicleJourneys: VehicleJourneysPage,
): Promise<void> {
  if (seededOperatorId && seededServiceId) {
    await vehicleJourneys.gotoSearch({
      operator: seededOperatorId,
      service: seededServiceId,
    });
    await vehicleJourneys.page.waitForLoadState("networkidle");
  } else {
    await vehicleJourneys.gotoSearch();
    await vehicleJourneys.page.waitForLoadState("networkidle");

    const selectedOperator = await vehicleJourneys.selectFirstOperator();
    loggedInTest.skip(
      !selectedOperator,
      "No operator options available on /vehicle-journeys.",
    );

    await vehicleJourneys.page.waitForLoadState("networkidle");

    const selectedService = await vehicleJourneys.selectFirstService();
    loggedInTest.skip(
      !selectedService,
      "No service options available for the selected operator on /vehicle-journeys.",
    );
  }

  await vehicleJourneys.waitForSearchOutcome();

  await expect(vehicleJourneys.searchErrorAlert()).toHaveCount(0);

  const noJourneysFound = (await vehicleJourneys.noJourneysAlert().count()) > 0;
  loggedInTest.skip(
    noJourneysFound,
    seededOperatorId && seededServiceId
      ? "No vehicle journeys found for TEST_NOC_CODE / TEST_LINE_ID."
      : "No vehicle journeys found for the first available operator and service.",
  );
}

test("Vehicle journeys search - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/vehicle-journeys", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

test("Vehicle journey detail - redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto(
    "/vehicle-journeys/test-journey?date=2025-01-01&operator=test&service=test",
    { waitUntil: "domcontentloaded" },
  );
  await expect(page).toHaveURL(/\/login/);
});

loggedInTest.describe("Vehicle journeys search - authenticated", () => {
  let vehicleJourneys!: VehicleJourneysPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    vehicleJourneys = new VehicleJourneysPage(loggedInPage);
    await vehicleJourneys.gotoSearch();
    await loggedInPage.waitForLoadState("networkidle");
  });

  loggedInTest("renders the search controls", async () => {
    await expect(vehicleJourneys.searchHeading()).toBeVisible();
    await expect(vehicleJourneys.dateInput()).toBeVisible();
    await expect(vehicleJourneys.operatorSelectLabel()).toBeVisible();
    await expect(vehicleJourneys.operatorSelect()).toBeVisible();
    await expect(vehicleJourneys.serviceSelectLabel()).toBeVisible();
    await expect(vehicleJourneys.serviceSelect()).toBeDisabled();
  });

  loggedInTest(
    "loads journey results for a selected service",
    async ({ loggedInPage }) => {
      await test.step("Load vehicle journeys", async () => {
        await loadJourneySearchResults(vehicleJourneys);
      });

      await test.step("Verify journey results and search navigation", async () => {
        await expect(loggedInPage).toHaveURL(/\/vehicle-journeys/);
        await expect(vehicleJourneys.resultLinks().first()).toBeVisible();
        await expect
          .poll(async () => vehicleJourneys.resultLinks().count())
          .toBeGreaterThan(0);
        await expect(
          vehicleJourneys.previousDateLink().or(vehicleJourneys.nextDateLink()),
        ).toBeVisible();
      });
    },
  );
});

loggedInTest.describe("Vehicle journey detail - authenticated", () => {
  let vehicleJourneys!: VehicleJourneysPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    vehicleJourneys = new VehicleJourneysPage(loggedInPage);

    await loadJourneySearchResults(vehicleJourneys);
    await vehicleJourneys.openFirstJourneyResult();
    await loggedInPage.waitForLoadState("networkidle");
  });

  loggedInTest(
    "renders journey details, stats and toggle controls",
    async ({ loggedInPage }) => {
      await test.step("Verify the default detail layout", async () => {
        await expect(loggedInPage).toHaveURL(/\/vehicle-journeys\/[^/?]+/);
        await expect(vehicleJourneys.detailBackLink()).toBeVisible();
        await expect(vehicleJourneys.detailCaption()).toBeVisible();
        await expect(vehicleJourneys.detailHeading()).toBeVisible();
        await expect(vehicleJourneys.detailHeading()).not.toHaveText(
          "Journey not found",
        );

        await expect(vehicleJourneys.journeyInfo()).toContainText("Operator:");
        await expect(vehicleJourneys.journeyInfo()).toContainText(
          "Service pattern:",
        );
        await expect(vehicleJourneys.journeyInfo()).toContainText(
          "Scheduled start time:",
        );
        await expect(vehicleJourneys.journeyInfo()).toContainText(
          "Vehicle ID:",
        );
        await expect(vehicleJourneys.journeyInfo()).toContainText(
          "Scheduled distance (km):",
        );

        await expect(vehicleJourneys.evidencedRadio()).toBeChecked();
        await expect(vehicleJourneys.estimatedRadio()).toBeVisible();
        await expect(vehicleJourneys.timingPointsRadio()).toBeChecked();
        await expect(vehicleJourneys.allStopsRadio()).toBeVisible();
        await expect(vehicleJourneys.journeyNav()).toContainText("Journey");

        await expect(vehicleJourneys.otpStats()).toContainText("On-time");
        await expect(vehicleJourneys.otpStats()).toContainText("Late");
        await expect(vehicleJourneys.otpStats()).toContainText("Early");
        await expect(vehicleJourneys.otpStats()).toContainText(
          "Incomplete data",
        );
        await expect
          .poll(async () => vehicleJourneys.stopListItems().count())
          .toBeGreaterThan(1);
        await expect(vehicleJourneys.journeyMap()).toBeVisible();
      });

      await test.step("Verify detail toggles update the route", async () => {
        await vehicleJourneys.selectEstimatedMatchType();
        await expect(loggedInPage).toHaveURL(/match_type=estimated/);
        await expect(vehicleJourneys.estimatedRadio()).toBeChecked();

        await vehicleJourneys.selectAllStops();
        await expect(loggedInPage).toHaveURL(/allStops=true/);
        await expect(vehicleJourneys.allStopsRadio()).toBeChecked();
      });
    },
  );

  loggedInTest(
    "shows the not found state for an invalid journey id",
    async ({ loggedInPage }) => {
      const currentUrl = new URL(loggedInPage.url());

      await vehicleJourneys.gotoDetail("not-a-real-journey-id", {
        date: currentUrl.searchParams.get("date") ?? "2025-01-01",
        operator:
          currentUrl.searchParams.get("operator") ?? seededOperatorId ?? "",
        service:
          currentUrl.searchParams.get("service") ?? seededServiceId ?? "",
      });

      await expect(vehicleJourneys.notFoundHeading()).toBeVisible();
      await expect(vehicleJourneys.notFoundMessage()).toBeVisible();
      await expect(vehicleJourneys.detailBackLink()).toBeVisible();
    },
  );
});
