import { Locator, Page } from "@playwright/test";

/**
 * Page object for the Live Status page (/feed-monitoring/[nocCode]).
 */
export class LiveStatusPage {
  constructor(private readonly page: Page) {}

  async goTo(nocCode: string): Promise<void> {
    await this.page.goto(`/feed-monitoring/${nocCode}`, { waitUntil: "domcontentloaded" });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Live status" });
  }

  operatorDropdownLabel(): Locator {
    return this.page.getByText(/Operator/);
  }

  viewFeedHistoryLink(): Locator {
    return this.page.getByRole("link", { name: /View feed history/i });
  }

  backToAllOperatorsLink(): Locator {
    return this.page.getByRole("link", { name: "All operators" });
  }

  feedStatusStat(): Locator {
    return this.page.getByText("Feed status").locator("..");
  }

  currentVehiclesStat(): Locator {
    return this.page.getByText("Current vehicles").locator("..");
  }

  expectedVehiclesStat(): Locator {
    return this.page.getByText("Expected vehicles").locator("..");
  }

  updateFrequencyStat(): Locator {
    return this.page.getByText("Update frequency").locator("..");
  }
}
