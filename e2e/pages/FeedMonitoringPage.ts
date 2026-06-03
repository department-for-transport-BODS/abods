import { Locator, Page } from "@playwright/test";

/**
 * Page object for the Feed Monitoring listing page (/feed-monitoring).
 */
export class FeedMonitoringPage {
  constructor(readonly page: Page) {}

  async goTo(): Promise<void> {
    await this.page.goto("/feed-monitoring", { waitUntil: "domcontentloaded" });
  }

  async openFromNavigationPanel(): Promise<void> {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.feedMonitoringNavLink().click();
  }

  feedMonitoringNavLink(): Locator {
    return this.page.getByRole("navigation").getByRole("link", { name: "NOC feed monitoring" });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "NOC feed monitoring" });
  }

  searchInputLabel(): Locator {
    return this.page.getByLabel("Search for an operator");
  }
  
  searchInput(): Locator {
    return this.page.getByTestId("operator-search-input");
  }

  inactiveTable(): Locator {
    return this.page.getByTestId("inactive-feeds-section").getByRole("table");
  }

  activeTable(): Locator {
    return this.page.getByTestId("active-feeds-section").getByRole("table");
  }

  async clickOperatorLink(nocCode: string): Promise<void> {
    await this.page.locator(`a[href="/feed-monitoring/${nocCode}"]`).click();
  }
}
