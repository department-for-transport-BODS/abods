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

  /**
   * Waits for the summary section to finish loading. Uses a generous timeout so
   * it is resilient on slower engines (WebKit) and dev-server first compiles.
   */
  async waitForSummaryLoaded(): Promise<void> {
    await this.onTimeStat().waitFor({ state: "visible", timeout: 60000 });
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

  dateRangeButton(): Locator {
    return this.page.locator(".date-range-select__button");
  }

  datePresetSelect(): Locator {
    return this.page.locator('select[name="date-preset"]');
  }

  refineResultsButton(): Locator {
    return this.page.locator(".on-time-refine-results-button");
  }

  refineResultsHeading(): Locator {
    return this.page.getByRole("heading", { name: "Refine results", level: 2 });
  }

  refineResultsCloseButton(): Locator {
    return this.page
      .locator(".refine-results-panel")
      .locator(".refine-results-panel__close");
  }

  refineResultsMaximumEarlySelect(): Locator {
    return this.page.getByLabel("Maximum early");
  }

  refineResultsMaximumLateSelect(): Locator {
    return this.page.getByLabel("Maximum late");
  }

  matchTypeEstimatedButton(): Locator {
    return this.page.getByLabel("Estimated");
  }

  matchTypeEvidencedButton(): Locator {
    return this.page.getByLabel("Evidenced");
  }

  stopTypeAllStopsButton(): Locator {
    return this.page.getByLabel("All stops");
  }

  stopTypeTimingPointsButton(): Locator {
    return this.page.getByLabel("Timing points");
  }

  // --- Overview summary stats ---------------------------------------------

  onTimeStat(): Locator {
    return this.page.locator("#on-time-overview-stat-on-time");
  }

  lateStat(): Locator {
    return this.page.locator("#on-time-overview-stat-late");
  }

  earlyStat(): Locator {
    return this.page.locator("#on-time-overview-stat-early");
  }

  incompleteDataStat(): Locator {
    return this.page.locator("#on-time-overview-stat-no-data");
  }

  averageDelayStat(): Locator {
    return this.page.locator("#on-time-overview-stat-average-delay");
  }

  // --- Compare thresholds (OTP) modal -------------------------------------

  compareThresholdsLink(): Locator {
    return this.page.getByRole("button", { name: "Compare thresholds" });
  }

  thresholdModal(): Locator {
    return this.page.getByRole("dialog");
  }

  thresholdModalHeading(): Locator {
    return this.thresholdModal().getByRole("heading", {
      name: /compare on-time performance thresholds/i,
    });
  }

  thresholdEarlyInput(): Locator {
    return this.thresholdModal().locator("#otp-threshold-early");
  }

  thresholdLateInput(): Locator {
    return this.thresholdModal().locator("#otp-threshold-late");
  }

  thresholdCompareButton(): Locator {
    return this.thresholdModal().getByRole("button", { name: "Compare" });
  }

  thresholdComparisonCell(rowName: string | RegExp): Locator {
    return this.thresholdModal()
      .getByRole("row", { name: rowName })
      .locator("td")
      .last();
  }

  thresholdValidationError(): Locator {
    return this.thresholdModal().getByText(/between 1 and 20 minutes/i);
  }
}
