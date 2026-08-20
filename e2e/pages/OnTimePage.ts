import { Locator, Page } from "@playwright/test";

/**
 * Page object for on-time performance routes.
 */
export class OnTimePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.gotoIndex();
  }

  async gotoIndex(): Promise<void> {
    await this.page.goto("/on-time", { waitUntil: "domcontentloaded" });
  }

  async gotoOperator(nocCode: string): Promise<void> {
    await this.page.goto(`/on-time/${encodeURIComponent(nocCode)}`, {
      waitUntil: "domcontentloaded",
    });
  }

  async gotoService(nocCode: string, lineId: string): Promise<void> {
    await this.page.goto(
      `/on-time/${encodeURIComponent(nocCode)}/${encodeURIComponent(lineId)}`,
      { waitUntil: "domcontentloaded" },
    );
  }

  async openFromDashboardNav(): Promise<void> {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.page
      .getByLabel("Primary")
      .getByRole("link", { name: "On-time performance" })
      .click();
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: /All services/i });
  }

  loadingText(): Locator {
    return this.page.getByText(/Loading on-time data\.\.\./i);
  }

  serviceLoadingText(): Locator {
    return this.page.getByText(/Loading service data\.\.\./i);
  }

  operatorLinks(): Locator {
    return this.operatorTable().getByRole("link");
  }

  firstServiceDrillInLink(): Locator {
    return this.serviceTable().getByRole("link").first();
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
    return this.page.getByRole("button", {
      name: /\d{1,2} [A-Za-z]{3} \d{4} - \d{1,2} [A-Za-z]{3} \d{4}/,
    });
  }

  datePresetSelect(): Locator {
    return this.page.getByRole("combobox", { name: "Date preset" });
  }

  refineResultsButton(): Locator {
    return this.page.getByRole("button", { name: "Refine results" });
  }

  refineResultsHeading(): Locator {
    return this.page.getByRole("heading", { name: "Refine results", level: 2 });
  }

  refineResultsCloseButton(): Locator {
    return this.page
      .getByRole("dialog", { name: "Refine results" })
      .getByRole("button", { name: "Close" });
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

  csvExportButtons(): Locator {
    return this.page.getByRole("button", { name: /Export data/i });
  }

  summaryStats(): Locator {
    return this.page.getByRole("list", { name: "Summary stats" });
  }

  summaryStatItems(): Locator {
    return this.summaryStats().getByRole("listitem");
  }

  summaryStatItem(name: string): Locator {
    return this.summaryStatItems().filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  summaryStat(name: string): Locator {
    return this.summaryStatItem(name).getByText(name, { exact: true });
  }

  operatorTable(): Locator {
    return this.page.getByRole("table").first();
  }

  operatorTableHeader(name: string): Locator {
    return this.tableHeader(this.operatorTable(), name);
  }

  serviceHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  operatorSparklines(): Locator {
    return this.page.getByRole("img", { name: /On time stats/i });
  }

  boundariesMapContainer(): Locator {
    return this.page.getByLabel("On-time admin area boundaries map");
  }

  operatorSearchInput(): Locator {
    return this.page.getByRole("textbox", { name: "Search for an operator" });
  }

  // Operator (nocCode) page locators

  backToAllOperatorsLink(): Locator {
    return this.page.getByRole("link", { name: "All operators" });
  }

  operatorPageCaption(): Locator {
    return this.page.locator("main").getByText("On-time performance", {
      exact: true,
    });
  }

  serviceTable(): Locator {
    return this.page.getByRole("table").first();
  }

  serviceTableHeader(name: string): Locator {
    return this.tableHeader(this.serviceTable(), name);
  }

  serviceSearchInput(): Locator {
    return this.page.getByLabel("Search for a service");
  }

  directionsDropdown(): Locator {
    return this.page.getByRole("textbox", { name: "Directions" });
  }

  displayOptionsButton(): Locator {
    return this.page.getByRole("button", { name: /Display options/i });
  }

  // Service (lineId) page locators

  servicePageHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  backToOperatorLink(): Locator {
    return this.page.getByRole("link", { name: /Back to/i });
  }

  stopsTable(): Locator {
    return this.page.getByRole("table").first();
  }

  stopsTableHeader(name: string): Locator {
    return this.tableHeader(this.stopsTable(), name);
  }

  private tableHeader(table: Locator, name: string): Locator {
    const accessibleName = name === "Av. delay" ? "Average delay" : name;
    const escapedName = accessibleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return table.getByRole("columnheader", {
      name: new RegExp(`^(?:Sort by )?${escapedName}(?:\\s|$)`, "i"),
    });
  }

  // Operator not found page locators

  operatorNotFoundHeading(): Locator {
    return this.page.getByRole("heading", {
      name: /Not found/i,
    });
  }

  operatorNotFoundMessage(): Locator {
    return this.page.getByText(
      /Operator not found, or you do not have permission to view/i,
    );
  }

  operatorNotFoundBackLink(): Locator {
    return this.page.getByRole("link", { name: "On-time performance" });
  }

  async gotoOperatorNotFound(): Promise<void> {
    await this.page.goto("/on-time/operator-not-found", {
      waitUntil: "domcontentloaded",
    });
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
