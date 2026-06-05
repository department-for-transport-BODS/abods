import { Locator, Page } from "@playwright/test";

/**
 * Page object for the Live Status page (/feed-monitoring/[nocCode]).
 */
export class LiveStatusPage {
  constructor(readonly page: Page) {}

  async goTo(nocCode: string): Promise<void> {
    await this.page.goto(`/feed-monitoring/${nocCode}`, {
      waitUntil: "domcontentloaded",
    });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Live status" });
  }

  operatorDropdownLabel(): Locator {
    return this.page.getByText(/Operator/);
  }

  operatorDropdown(): Locator {
    return this.page.locator(".operator-dropdown__button");
  }

  viewFeedHistoryLink(): Locator {
    return this.page.getByRole("link", { name: /View feed history/i });
  }

  backToAllOperatorsLink(): Locator {
    return this.page.getByRole("link", { name: /All operators/i });
  }

  feedStatusStat(): Locator {
    return this.page.getByTestId("feed-status-stat");
  }

  currentVehiclesStat(): Locator {
    return this.page.getByTestId("current-vehicles-stat");
  }

  expectedVehiclesStat(): Locator {
    return this.page.getByTestId("expected-vehicles-stat");
  }

  updateFrequencyStat(): Locator {
    return this.page.getByTestId("update-frequency-stat");
  }
}
