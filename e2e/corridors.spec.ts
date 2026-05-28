import { test, expect, loggedInTest } from "./fixtures";

// ── Auth redirect ─────────────────────────────────────────────────────────────

test("redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/corridors");
  await expect(page).toHaveURL(/\/login/);
});

// ── Corridors list ────────────────────────────────────────────────────────────

loggedInTest.describe("Corridors list page", () => {
  loggedInTest.beforeEach(async ({ page }) => {
    await page.goto("/corridors");
  });

  loggedInTest("renders the Corridors heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Corridors", level: 1 }),
    ).toBeVisible();
  });

  loggedInTest("shows the Create new corridor button", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Create new corridor" }),
    ).toBeVisible();
  });

  loggedInTest("shows the search input", async ({ page }) => {
    await expect(page.getByLabel("Search for a corridor")).toBeVisible();
  });

  loggedInTest("shows at least one corridor in the list", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Edit" }).first(),
    ).toBeVisible();
  });

  loggedInTest(
    "shows no-matches message when filter excludes all rows",
    async ({ page }) => {
      await page.getByLabel("Search for a corridor").fill("zzz_no_match_xqz");
      await expect(
        page.getByText("No corridors matched the search query."),
      ).toBeVisible();
    },
  );
});

// ── Create corridor ───────────────────────────────────────────────────────────

loggedInTest.describe("Create corridor page", () => {
  loggedInTest.beforeEach(async ({ page }) => {
    await page.goto("/corridors/create");
  });

  loggedInTest("renders the Create new corridor heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Create new corridor" }),
    ).toBeVisible();
  });

  loggedInTest("shows the back link to All corridors", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "All corridors" }),
    ).toBeVisible();
  });

  loggedInTest("shows the corridor name input", async ({ page }) => {
    await expect(page.getByLabel("Enter a corridor name")).toBeVisible();
  });

  loggedInTest("shows the stop search input", async ({ page }) => {
    await expect(page.getByLabel("Location name or postcode")).toBeVisible();
  });
});

// ── Corridor view ─────────────────────────────────────────────────────────────

loggedInTest.describe("Corridor view page", () => {
  loggedInTest.beforeEach(async ({ page }) => {
    await page.goto("/corridors");
    await page.locator("tbody tr").first().getByRole("link").first().click();
  });

  loggedInTest("renders a corridor name heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  loggedInTest("shows the Edit corridor button", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Edit corridor" }),
    ).toBeVisible();
  });

  loggedInTest("shows recorded and missing transit stats", async ({ page }) => {
    await expect(page.getByText("Recorded transits").first()).toBeVisible();
    await expect(page.getByText("Missing transits")).toBeVisible();
  });

  loggedInTest("shows average journey time stat", async ({ page }) => {
    await expect(page.getByText("Average journey time").first()).toBeVisible();
  });

  loggedInTest("shows the Services section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Services" })).toBeVisible();
  });

  loggedInTest(
    "shows not found for an unknown corridor id",
    async ({ page }) => {
      await page.goto("/corridors/99999");
      await expect(
        page.getByRole("heading", { name: "Not found" }),
      ).toBeVisible();
    },
  );

  loggedInTest(
    "shows not found for a non-numeric corridor id",
    async ({ page }) => {
      await page.goto("/corridors/not-a-number");
      await expect(
        page.getByRole("heading", { name: "Not found" }),
      ).toBeVisible();
    },
  );
});

// ── Edit corridor ─────────────────────────────────────────────────────────────

loggedInTest.describe("Edit corridor page", () => {
  loggedInTest.beforeEach(async ({ page }) => {
    await page.goto("/corridors");
    await page.getByRole("link", { name: "Edit" }).first().click();
  });

  loggedInTest("renders the Edit corridor heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Edit corridor" }),
    ).toBeVisible();
  });

  loggedInTest(
    "shows the corridor name pre-filled in the form",
    async ({ page }) => {
      await expect(page.getByLabel("Enter a corridor name")).not.toBeEmpty();
    },
  );

  loggedInTest("shows the Delete this corridor button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Delete this corridor" }),
    ).toBeVisible();
  });

  loggedInTest("shows the Save button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  loggedInTest(
    "shows not found for a non-numeric corridor id",
    async ({ page }) => {
      await page.goto("/corridors/edit/not-a-number");
      await expect(
        page.getByRole("heading", { name: "Not found" }),
      ).toBeVisible();
    },
  );

  loggedInTest(
    "shows not found when the corridor does not exist",
    async ({ page }) => {
      await page.goto("/corridors/edit/99999");
      await expect(
        page.getByRole("heading", { name: "Not found" }),
      ).toBeVisible();
    },
  );

  loggedInTest("opens the delete confirmation modal", async ({ page }) => {
    await page.getByRole("button", { name: "Delete this corridor" }).click();
    await expect(
      page.getByRole("button", { name: "Delete corridor" }),
    ).toBeVisible();
  });
});
