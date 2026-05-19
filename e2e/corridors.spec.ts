import { test, expect, Page } from "@playwright/test";

const E2E_USERNAME = process.env.E2E_USERNAME ?? "";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "";

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_USERNAME);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"));
}

// ── Auth redirect ─────────────────────────────────────────────────────────────

test("redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/corridors");
  await expect(page).toHaveURL(/\/login/);
});

// ── Corridors list ────────────────────────────────────────────────────────────

test.describe("Corridors list page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/corridors");
  });

  test("renders the Corridors heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Corridors", level: 1 }),
    ).toBeVisible();
  });

  test("shows the Create new corridor button", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Create new corridor" }),
    ).toBeVisible();
  });

  test("shows the search input", async ({ page }) => {
    await expect(page.getByLabel("Search for a corridor")).toBeVisible();
  });

  test("shows at least one corridor in the list", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Edit" }).first(),
    ).toBeVisible();
  });

  test("shows no-matches message when filter excludes all rows", async ({
    page,
  }) => {
    await page.getByLabel("Search for a corridor").fill("zzz_no_match_xqz");
    await expect(
      page.getByText("No corridors matched the search query."),
    ).toBeVisible();
  });
});

// ── Create corridor ───────────────────────────────────────────────────────────

test.describe("Create corridor page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/corridors/create");
  });

  test("renders the Create new corridor heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Create new corridor" }),
    ).toBeVisible();
  });

  test("shows the back link to All corridors", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "All corridors" }),
    ).toBeVisible();
  });

  test("shows the corridor name input", async ({ page }) => {
    await expect(page.getByLabel("Enter a corridor name")).toBeVisible();
  });

  test("shows the stop search input", async ({ page }) => {
    await expect(page.getByLabel("Location name or postcode")).toBeVisible();
  });
});

// ── Corridor view ─────────────────────────────────────────────────────────────

test.describe("Corridor view page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/corridors");
    await page.locator("tbody tr").first().getByRole("link").first().click();
  });

  test("renders a corridor name heading", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows the Edit corridor button", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Edit corridor" }),
    ).toBeVisible();
  });

  test("shows recorded and missing transit stats", async ({ page }) => {
    await expect(page.getByText("Recorded transits").first()).toBeVisible();
    await expect(page.getByText("Missing transits")).toBeVisible();
  });

  test("shows average journey time stat", async ({ page }) => {
    await expect(page.getByText("Average journey time").first()).toBeVisible();
  });

  test("shows the Services section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Services" })).toBeVisible();
  });

  test("shows not found for an unknown corridor id", async ({ page }) => {
    await page.goto("/corridors/99999");
    await expect(
      page.getByRole("heading", { name: "Not found" }),
    ).toBeVisible();
  });

  test("shows not found for a non-numeric corridor id", async ({ page }) => {
    await page.goto("/corridors/not-a-number");
    await expect(
      page.getByRole("heading", { name: "Not found" }),
    ).toBeVisible();
  });
});

// ── Edit corridor ─────────────────────────────────────────────────────────────

test.describe("Edit corridor page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/corridors");
    await page.getByRole("link", { name: "Edit" }).first().click();
  });

  test("renders the Edit corridor heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Edit corridor" }),
    ).toBeVisible();
  });

  test("shows the corridor name pre-filled in the form", async ({ page }) => {
    await expect(page.getByLabel("Enter a corridor name")).not.toBeEmpty();
  });

  test("shows the Delete this corridor button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Delete this corridor" }),
    ).toBeVisible();
  });

  test("shows the Save button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("shows not found for a non-numeric corridor id", async ({ page }) => {
    await page.goto("/corridors/edit/not-a-number");
    await expect(
      page.getByRole("heading", { name: "Not found" }),
    ).toBeVisible();
  });

  test("shows not found when the corridor does not exist", async ({ page }) => {
    await page.goto("/corridors/edit/99999");
    await expect(
      page.getByRole("heading", { name: "Not found" }),
    ).toBeVisible();
  });

  test("opens the delete confirmation modal", async ({ page }) => {
    await page.getByRole("button", { name: "Delete this corridor" }).click();
    await expect(
      page.getByRole("button", { name: "Delete corridor" }),
    ).toBeVisible();
  });
});
