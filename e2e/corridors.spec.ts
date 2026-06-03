import { test, expect, loggedInTest } from "./fixtures";
import { CorridorsPage } from "./pages/CorridorsPage";

// ── Auth redirect ─────────────────────────────────────────────────────────────

test("redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/corridors");
  await expect(page).toHaveURL(/\/login/);
});

// ── Corridors list ────────────────────────────────────────────────────────────

loggedInTest.describe("Corridors list page", () => {
  let corridors!: CorridorsPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    corridors = new CorridorsPage(loggedInPage);
    await corridors.gotoList();
  });

  loggedInTest("renders the Corridors heading", async () => {
    await expect(corridors.heading()).toBeVisible();
  });

  loggedInTest("shows the Create new corridor button", async () => {
    await expect(corridors.createNewCorridorButton()).toBeVisible();
  });

  loggedInTest("shows the search input", async () => {
    await expect(corridors.searchInput()).toBeVisible();
  });

  loggedInTest("shows at least one corridor in the list", async () => {
    await expect(corridors.editLinkFirst()).toBeVisible();
  });

  loggedInTest(
    "shows no-matches message when filter excludes all rows",
    async () => {
      await corridors.searchForCorridor("zzz_no_match_xqz");
      await expect(corridors.noMatchesMessage()).toBeVisible();
    },
  );
});

// ── Create corridor ───────────────────────────────────────────────────────────

loggedInTest.describe("Create corridor page", () => {
  let corridors!: CorridorsPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    corridors = new CorridorsPage(loggedInPage);
    await corridors.gotoCreate();
  });

  loggedInTest("renders the Create new corridor heading", async () => {
    await expect(corridors.createHeading()).toBeVisible();
  });

  loggedInTest("shows the back link to All corridors", async () => {
    await expect(corridors.allCorridorsBackLink()).toBeVisible();
  });

  loggedInTest("shows the corridor name input", async () => {
    await expect(corridors.corridorNameInput()).toBeVisible();
  });

  loggedInTest("shows the stop search input", async () => {
    await expect(corridors.stopSearchInput()).toBeVisible();
  });
});

// ── Corridor view ─────────────────────────────────────────────────────────────

loggedInTest.describe("Corridor view page", () => {
  let corridors!: CorridorsPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    corridors = new CorridorsPage(loggedInPage);
    await corridors.gotoList();
    await corridors.openFirstCorridorFromList();
  });

  loggedInTest("renders a corridor name heading", async () => {
    await expect(corridors.viewHeading()).toBeVisible();
  });

  loggedInTest("shows the Edit corridor button", async () => {
    await expect(corridors.editCorridorButton()).toBeVisible();
  });

  loggedInTest("shows recorded and missing transit stats", async () => {
    await expect(corridors.recordedTransitsStat()).toBeVisible();
    await expect(corridors.missingTransitsStat()).toBeVisible();
  });

  loggedInTest("shows average journey time stat", async () => {
    await expect(corridors.averageJourneyTimeStat()).toBeVisible();
  });

  loggedInTest("shows the Services section", async () => {
    await expect(corridors.servicesHeading()).toBeVisible();
  });

  loggedInTest("shows not found for an unknown corridor id", async () => {
    await corridors.gotoView(99999);
    await expect(corridors.notFoundHeading()).toBeVisible();
  });

  loggedInTest("shows not found for a non-numeric corridor id", async () => {
    await corridors.gotoView("not-a-number");
    await expect(corridors.notFoundHeading()).toBeVisible();
  });
});

// ── Edit corridor ─────────────────────────────────────────────────────────────

loggedInTest.describe("Edit corridor page", () => {
  let corridors!: CorridorsPage;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    corridors = new CorridorsPage(loggedInPage);
    await corridors.gotoList();
    await corridors.openFirstEditFromList();
  });

  loggedInTest("renders the Edit corridor heading", async () => {
    await expect(corridors.editHeading()).toBeVisible();
  });

  loggedInTest("shows the corridor name pre-filled in the form", async () => {
    await expect(corridors.corridorNameInput()).not.toBeEmpty();
  });

  loggedInTest("shows the Delete this corridor button", async () => {
    await expect(corridors.deleteThisCorridorButton()).toBeVisible();
  });

  loggedInTest("shows the Save button", async () => {
    await expect(corridors.saveButton()).toBeVisible();
  });

  loggedInTest("shows not found for a non-numeric corridor id", async () => {
    await corridors.gotoEdit("not-a-number");
    await expect(corridors.notFoundHeading()).toBeVisible();
  });

  loggedInTest("shows not found when the corridor does not exist", async () => {
    await corridors.gotoEdit(99999);
    await expect(corridors.notFoundHeading()).toBeVisible();
  });

  loggedInTest("opens the delete confirmation modal", async () => {
    await corridors.openDeleteConfirmation();
    await expect(corridors.deleteCorridorConfirmButton()).toBeVisible();
  });
});
