import { test, expect, loggedInTest } from "./fixtures";
import { DashboardPage } from "./pages/DashboardPage";
import { HelpdeskPanel } from "./components/HelpdeskPanel";

// Helpdesk panel — reachable from the header "Help" link and the nav "Help"
// button on any authenticated page.

test("Helpdesk - dashboard redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
});

loggedInTest.describe("Helpdesk panel - authenticated", () => {
  let dashboard!: DashboardPage;
  let helpdesk!: HelpdeskPanel;

  loggedInTest.beforeEach(async ({ loggedInPage }) => {
    dashboard = new DashboardPage(loggedInPage);
    helpdesk = new HelpdeskPanel(loggedInPage);
    await dashboard.goto();
  });

  loggedInTest("is closed by default", async () => {
    await expect(helpdesk.panel()).toHaveCount(0);
  });

  loggedInTest(
    "opens from the header Help button and shows the page title",
    async () => {
      await helpdesk.openFromHeader();

      await expect(helpdesk.panel()).toBeVisible();
      await expect(helpdesk.heading()).toHaveText("Dashboard");
    },
  );

  loggedInTest("opens from the nav Help button", async () => {
    await expect(helpdesk.panel()).toBeVisible();
    await expect(helpdesk.heading()).toHaveText("Dashboard");
  });

  loggedInTest(
    "shows help articles in an accordion, or a fallback message",
    async () => {
      await helpdesk.openFromHeader();
      await expect(helpdesk.panel()).toBeVisible();

      const sectionCount = await helpdesk.accordionSectionButtons().count();

      if (sectionCount > 0) {
        await expect(helpdesk.accordion()).toBeVisible();

        // Accordion sections are collapsed by default, and expand on click.
        const firstSection = helpdesk.accordionSectionButtons().first();
        await expect(firstSection).toHaveAttribute("aria-expanded", "false");
        await firstSection.click();
        await expect(firstSection).toHaveAttribute("aria-expanded", "true");
      } else {
        await expect(helpdesk.noArticlesHeading()).toBeVisible();
      }
    },
  );

  loggedInTest("closes via the Close button", async () => {
    await helpdesk.openFromHeader();
    await expect(helpdesk.panel()).toBeVisible();

    await helpdesk.close();

    await expect(helpdesk.panel()).toHaveCount(0);
    await expect(helpdesk.overlay()).toHaveCount(0);
  });

  loggedInTest("closes via the Escape key", async ({ loggedInPage }) => {
    await helpdesk.openFromHeader();
    await expect(helpdesk.panel()).toBeVisible();

    await loggedInPage.keyboard.press("Escape");

    await expect(helpdesk.panel()).toHaveCount(0);
  });

  loggedInTest(
    "shows the correct title when opened from a different page",
    async ({ loggedInPage }) => {
      await loggedInPage.goto("/vehicle-journeys", {
        waitUntil: "domcontentloaded",
      });

      await helpdesk.openFromHeader();

      await expect(helpdesk.panel()).toBeVisible();
      await expect(helpdesk.heading()).toHaveText("Vehicle journeys");
    },
  );
});
