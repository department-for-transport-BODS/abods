import { Locator, Page } from "@playwright/test";

/**
 * Page object for on-time performance routes.
 */
export class OnTimePage {
  constructor(private readonly page: Page) {}

  async gotoIndex(): Promise<void> {
    await this.page.goto("/on-time", { waitUntil: "domcontentloaded" });
  }

  async gotoOperator(nocCode: string): Promise<void> {
    await this.page.goto(`/on-time/${encodeURIComponent(nocCode)}`, {
      waitUntil: "domcontentloaded",
    });
  }

  async openFromDashboardNav(): Promise<void> {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.page
      .getByLabel("Primary")
      .getByRole("link", { name: "On-time performance" })
      .click();
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: /On-time performance/i });
  }

  loadingText(): Locator {
    return this.page.getByText(/Loading on-time data\.\.\./i);
  }

  operatorLinks(): Locator {
    return this.page.locator('main ul.govuk-list a[href^="/on-time/"]');
  }

  firstServiceDrillInLink(): Locator {
    return this.page
      .locator("p", { hasText: "Drill in to a service:" })
      .getByRole("link")
      .first();
  }

  distributionTab(): Locator {
    return this.page.getByRole("button", { name: "Distribution" });
  }

  timeOfDayTab(): Locator {
    return this.page.getByRole("button", { name: "Time of day" });
  }

  dayOfWeekTab(): Locator {
    return this.page.getByRole("button", { name: "Day of week" });
  }

  delayFrequencyChart(): Locator {
    return this.page.getByTestId("delay-frequency-chart");
  }

  timeOfDayChart(): Locator {
    return this.page.getByTestId("time-of-day-chart");
  }

  dayOfWeekChart(): Locator {
    return this.page.getByTestId("day-of-week-chart");
  }

  stackedHistogramChart(): Locator {
    return this.page.getByTestId("stacked-histogram-chart");
  }

  excessWaitTimeChart(): Locator {
    return this.page.getByTestId("excess-wait-time-chart");
  }

  excessWaitUnavailableMessage(): Locator {
    return this.page.getByText(
      "Excess waiting time is unavailable for this service in the selected period because no frequent service hours were found.",
    );
  }
}
