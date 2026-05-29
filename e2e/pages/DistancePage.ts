import { Locator, Page } from "@playwright/test";

/**
 * Page object for the Distances page (/distances).
 */

export class DistancesPage {
  constructor(private readonly page: Page) {}

  async goTo(): Promise<void> {
    await this.page.goto("/distances", {
      waitUntil: "domcontentloaded",
    });
  }

  async openFromNavigationPanel(): Promise<void> {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.distancesNavLink().click();
  }

  distancesNavLink(): Locator {
    return this.page.getByRole("link", { name: "Distances" });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Distances" });
  }

  filterPanel(): Locator {
    return this.page.locator(".distance-filters-panel");
  }

  table(): Locator {
    return this.page.locator(".distance-table");
  }

  noDataMessage(): Locator {
    return this.page.getByText("No operator data found");
  }

  generateButton(): Locator {
    return this.page.getByRole("button", { name: /generate/i });
  }
}
