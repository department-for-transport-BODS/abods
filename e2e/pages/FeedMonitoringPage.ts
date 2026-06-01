import { Locator, Page } from "@playwright/test";

/**
 * Page object for the Feed Monitoring listing page (/feed-monitoring).
 */
export class FeedMonitoringPage {
  constructor(private readonly page: Page) {}

  async goTo(): Promise<void> {
    await this.page.goto("/feed-monitoring", { waitUntil: "domcontentloaded" });
  }

  async openFromNavigationPanel(): Promise<void> {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.feedMonitoringNavLink().click();
  }

  feedMonitoringNavLink(): Locator {
    return this.page.getByRole("link", { name: "Feed monitoring" });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "NOC feed monitoring" });
  }

  searchInput(): Locator {
    return this.page.locator("#operator-search");
  }

  inactiveTable(): Locator {
    return this.page.getByRole("heading", { name: "Inactive feeds" }).locator("..");
  }

  activeTable(): Locator {
    return this.page.getByRole("heading", { name: "Active feeds" }).locator("..");
  }

  noDataMessage(): Locator {
    return this.page.getByText("No operator data found");
  }

  async clickOperatorLink(nocCode: string): Promise<void> {
    await this.page.getByRole("link", { name: new RegExp(nocCode, "i") }).first().click();
  }
}
