import { Locator, Page } from "@playwright/test";

/**
 * Page object for the Service Monitoring page (/service-monitoring).
 */
export class ServiceMonitoringPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/service-monitoring", {
      waitUntil: "domcontentloaded",
    });
  }

  async openFromDashboardNav(): Promise<void> {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.serviceMonitoringNavLink().click();
  }

  serviceMonitoringNavLink(): Locator {
    return this.page.getByRole("link", { name: "Service monitoring" });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Service monitoring" });
  }

  panelIframe(): Locator {
    return this.page
      .locator(".service-monitoring__iframe-container iframe")
      .or(this.page.locator("main iframe"));
  }

  panelLoadErrorMessage(): Locator {
    return this.page.getByText(
      "Unable to load dashboard. Please contact admin",
    );
  }
}
