import { test, expect, Page } from "@playwright/test";

const API_URL = "http://localhost:3000";

// ── Fake session ──────────────────────────────────────────────────────────────

async function injectSession(page: Page): Promise<void> {
  const expiresAt = new Date(
    Date.now() + 12 * 60 * 60 * 1000,
  ).toISOString();
  await page.addInitScript((expires: string) => {
    localStorage.setItem("session", JSON.stringify({ expiresAt: expires }));
  }, expiresAt);
}

// ── GraphQL mock data ─────────────────────────────────────────────────────────

const mockUser = {
  currentUserId: "test-user-1",
  canViewServiceMonitoring: true,
  canEditAllAlerts: true,
  canViewDistances: true,
  serviceMonitoringEmbedUrl: null,
  flags: [],
};

const mockCorridors = [
  { id: 1, name: "Corridor Alpha", stops: [{ stopId: "a" }, { stopId: "b" }] },
  { id: 2, name: "Corridor Beta", stops: [{ stopId: "c" }, { stopId: "d" }] },
];

const mockCorridor = {
  id: 1,
  name: "Corridor Alpha",
  stops: [
    {
      stopId: "a",
      sourceId: "ATCO:A",
      stopName: "Stop A",
      stopLocation: { latitude: 53.0, longitude: -1.0 },
      stopLocality: { localityName: "Town A" },
    },
    {
      stopId: "b",
      sourceId: "ATCO:B",
      stopName: "Stop B",
      stopLocation: { latitude: 53.1, longitude: -1.1 },
      stopLocality: { localityName: "Town B" },
    },
  ],
};

const mockStats = {
  summaryStats: {
    totalTransits: 8,
    numberOfServices: 2,
    averageTransitTime: 420,
    scheduledTransits: 10,
  },
  transitTimeStats: [],
  transitTimeTimeOfDayStats: [],
  transitTimeDayOfWeekStats: [],
  transitTimePerServiceStats: [
    {
      lineName: "10",
      servicePatternName: "Outbound",
      noc: "ABC",
      operatorName: "Operator A",
      totalTransitTime: 1680,
      recordedTransits: 4,
      scheduledTransits: 5,
    },
  ],
  transitTimeHistogram: [],
  serviceLinks: [],
};

// ── GraphQL route handler ─────────────────────────────────────────────────────

type GraphQLHandlers = Record<string, unknown>;

async function mockGraphQL(
  page: Page,
  handlers: GraphQLHandlers,
): Promise<void> {
  await page.route(API_URL, async (route) => {
    const body = route.request().postDataJSON() as {
      query: string;
      variables?: Record<string, unknown>;
    };
    const query: string = body?.query ?? "";

    for (const [operationKey, data] of Object.entries(handlers)) {
      if (query.includes(operationKey)) {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ data }),
        });
        return;
      }
    }

    await route.continue();
  });
}

// ── Corridors list ────────────────────────────────────────────────────────────

test.describe("Corridors list page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
    await mockGraphQL(page, {
      "query user": { user: mockUser },
      corridorsList: {
        corridor: { corridorList: mockCorridors },
      },
    });
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    // No session injection – visit as anonymous user
    await page.goto("/corridors");
    await expect(page).toHaveURL(/\/login/);
  });

  test("renders the Corridors heading", async ({ page }) => {
    await page.goto("/corridors");
    await expect(
      page.getByRole("heading", { name: "Corridors", level: 1 }),
    ).toBeVisible();
  });

  test("shows the Create new corridor button", async ({ page }) => {
    await page.goto("/corridors");
    await expect(
      page.getByRole("link", { name: "Create new corridor" }),
    ).toBeVisible();
  });

  test("shows the search input", async ({ page }) => {
    await page.goto("/corridors");
    await expect(page.getByLabel("Search for a corridor")).toBeVisible();
  });

  test("lists corridor names", async ({ page }) => {
    await page.goto("/corridors");
    await expect(
      page.getByRole("link", { name: "Corridor Alpha" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Corridor Beta" }),
    ).toBeVisible();
  });

  test("shows Edit links for each corridor", async ({ page }) => {
    await page.goto("/corridors");
    await expect(page.getByRole("link", { name: "Edit" }).first()).toBeVisible();
  });

  test("filters corridors using the search input", async ({ page }) => {
    await page.goto("/corridors");
    await expect(
      page.getByRole("link", { name: "Corridor Alpha" }),
    ).toBeVisible();

    await page.getByLabel("Search for a corridor").fill("Beta");

    await expect(
      page.getByRole("link", { name: "Corridor Beta" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Corridor Alpha" }),
    ).not.toBeVisible();
  });

  test("shows no-matches message when filter excludes all rows", async ({
    page,
  }) => {
    await page.goto("/corridors?search=zzz");
    await expect(
      page.getByText("No corridors matched the search query."),
    ).toBeVisible();
  });
});

// ── Create corridor ───────────────────────────────────────────────────────────

test.describe("Create corridor page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
    await mockGraphQL(page, {
      "query user": { user: mockUser },
    });
  });

  test("renders the Create new corridor heading", async ({ page }) => {
    await page.goto("/corridors/create");
    await expect(
      page.getByRole("heading", { name: "Create new corridor" }),
    ).toBeVisible();
  });

  test("shows the back link to All corridors", async ({ page }) => {
    await page.goto("/corridors/create");
    await expect(
      page.getByRole("link", { name: "All corridors" }),
    ).toBeVisible();
  });

  test("shows the corridor name input", async ({ page }) => {
    await page.goto("/corridors/create");
    await expect(page.getByLabel("Enter a corridor name")).toBeVisible();
  });

  test("shows the stop search input", async ({ page }) => {
    await page.goto("/corridors/create");
    await expect(
      page.getByLabel("Location name or postcode"),
    ).toBeVisible();
  });

  test("shows a validation error when finishing without a name", async ({
    page,
  }) => {
    await mockGraphQL(page, {
      "query user": { user: mockUser },
      corridorsStopSearch: {
        corridor: {
          addFirstStop: [
            {
              stopId: "a",
              stopName: "Stop A",
              lat: 53.0,
              lon: -1.0,
              localityName: "Town A",
              adminAreaId: "1",
              sourceId: "ATCO:A",
            },
          ],
        },
      },
      corridorsSubsequentStops: {
        corridor: { addSubsequentStops: [] },
      },
    });

    await page.goto("/corridors/create");

    await page.getByLabel("Location name or postcode").fill("Town A");
    await page.getByRole("button", { name: "Select" }).click();
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("button", { name: "Finish" }).click();

    await expect(page.getByText("Name is required").first()).toBeVisible();
  });
});

// ── Corridor view ─────────────────────────────────────────────────────────────

test.describe("Corridor view page", () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
    await mockGraphQL(page, {
      "query user": { user: mockUser },
      getCorridor: { corridor: { getCorridor: mockCorridor } },
      corridorStats: { corridor: { stats: mockStats } },
    });
  });

  test("renders the corridor name as the heading", async ({ page }) => {
    await page.goto("/corridors/1");
    await expect(
      page.getByRole("heading", { name: "Corridor Alpha" }),
    ).toBeVisible();
  });

  test("shows the Edit corridor button", async ({ page }) => {
    await page.goto("/corridors/1");
    await expect(
      page.getByRole("link", { name: "Edit corridor" }),
    ).toBeVisible();
  });

  test("shows recorded and missing transit stats", async ({ page }) => {
    await page.goto("/corridors/1");
    await expect(page.getByText("Recorded transits").first()).toBeVisible();
    await expect(page.getByText("Missing transits")).toBeVisible();
  });

  test("shows average journey time stat", async ({ page }) => {
    await page.goto("/corridors/1");
    await expect(
      page.getByText("Average journey time").first(),
    ).toBeVisible();
  });

  test("shows the Services section with service rows", async ({ page }) => {
    await page.goto("/corridors/1");
    await expect(
      page.getByRole("heading", { name: "Services" }),
    ).toBeVisible();
    await expect(page.getByText("10: Outbound")).toBeVisible();
  });

  test("shows not found for an unknown corridor id", async ({ page }) => {
    await mockGraphQL(page, {
      "query user": { user: mockUser },
      getCorridor: { corridor: { getCorridor: null } },
      corridorStats: { corridor: { stats: null } },
    });

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
    await injectSession(page);
    await mockGraphQL(page, {
      "query user": { user: mockUser },
      getCorridor: { corridor: { getCorridor: mockCorridor } },
      corridorsSubsequentStops: {
        corridor: { addSubsequentStops: [] },
      },
    });
  });

  test("renders the Edit corridor heading", async ({ page }) => {
    await page.goto("/corridors/edit/1");
    await expect(
      page.getByRole("heading", { name: "Edit corridor" }),
    ).toBeVisible();
  });

  test("pre-fills the corridor name in the form", async ({ page }) => {
    await page.goto("/corridors/edit/1");
    await expect(page.getByDisplayValue("Corridor Alpha")).toBeVisible();
  });

  test("shows the Delete this corridor button", async ({ page }) => {
    await page.goto("/corridors/edit/1");
    await expect(
      page.getByRole("button", { name: "Delete this corridor" }),
    ).toBeVisible();
  });

  test("shows the Save button", async ({ page }) => {
    await page.goto("/corridors/edit/1");
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("shows not found for a non-numeric corridor id", async ({ page }) => {
    await page.goto("/corridors/edit/not-a-number");
    await expect(
      page.getByRole("heading", { name: "Not found" }),
    ).toBeVisible();
  });

  test("shows not found when the corridor does not exist", async ({ page }) => {
    await mockGraphQL(page, {
      "query user": { user: mockUser },
      getCorridor: { corridor: { getCorridor: null } },
    });

    await page.goto("/corridors/edit/99999");
    await expect(
      page.getByRole("heading", { name: "Not found" }),
    ).toBeVisible();
  });

  test("opens the delete confirmation modal", async ({ page }) => {
    await page.goto("/corridors/edit/1");
    await page.getByRole("button", { name: "Delete this corridor" }).click();
    await expect(
      page.getByRole("button", { name: "Delete corridor" }),
    ).toBeVisible();
  });
});
