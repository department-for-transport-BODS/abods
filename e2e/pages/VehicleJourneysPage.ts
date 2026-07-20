import { Locator, Page, expect } from "@playwright/test";

export class VehicleJourneysPage {
  constructor(readonly page: Page) {}

  async gotoSearch(query?: Record<string, string>): Promise<void> {
    const search = query ? `?${new URLSearchParams(query).toString()}` : "";
    await this.page.goto(`/vehicle-journeys${search}`, {
      waitUntil: "domcontentloaded",
    });
  }

  async gotoDetail(
    journeyId: string,
    query?: Record<string, string>,
  ): Promise<void> {
    const search = query ? `?${new URLSearchParams(query).toString()}` : "";
    await this.page.goto(
      `/vehicle-journeys/${encodeURIComponent(journeyId)}${search}`,
      {
        waitUntil: "domcontentloaded",
      },
    );
  }

  searchHeading(): Locator {
    return this.page.getByRole("heading", { name: "Vehicle journeys" });
  }

  dateInput(): Locator {
    return this.page.getByLabel("Date");
  }

  operatorSelect(): Locator {
    return this.page
      .locator(".vehicle-journeys-search__operator")
      .getByRole("button", { name: /select|loading/i });
  }

  serviceSelect(): Locator {
    return this.page
      .locator(".vehicle-journeys-search__service")
      .getByRole("button", { name: /select|loading/i });
  }

  operatorSelectLabel(): Locator {
    return this.page.getByText("Operator", { exact: true });
  }

  serviceSelectLabel(): Locator {
    return this.page.getByText("Service name", { exact: true });
  }

  resultsNavigation(): Locator {
    return this.page.getByRole("navigation", { name: "results" });
  }

  previousDateLink(): Locator {
    return this.resultsNavigation().getByRole("button", { name: "Previous" });
  }

  nextDateLink(): Locator {
    return this.resultsNavigation().getByRole("button", { name: "Next" });
  }

  resultLinks(): Locator {
    return this.page.locator(".journey-search-grid__time");
  }

  patternHeadings(): Locator {
    return this.page.locator("main h2");
  }

  noJourneysAlert(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "No journeys found" });
  }

  searchErrorAlert(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: /problem finding vehicle journeys/i });
  }

  detailBackLink(): Locator {
    return this.page.getByRole("link", { name: "Search" });
  }

  detailCaption(): Locator {
    return this.page.locator(".govuk-caption-xl").filter({
      hasText: "Vehicle journeys",
    });
  }

  detailHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  notFoundHeading(): Locator {
    return this.page.getByRole("heading", { name: "Not found" });
  }

  notFoundMessage(): Locator {
    return this.page.getByText(
      /Vehicle journey not found, or you do not have permission to view\./i,
    );
  }

  journeyInfo(): Locator {
    return this.page.locator(".vehicle-journeys__summary-list");
  }

  journeyNav(): Locator {
    return this.page.locator(".journey-nav");
  }

  estimatedRadio(): Locator {
    return this.page.getByRole("radio", { name: "Estimated" });
  }

  evidencedRadio(): Locator {
    return this.page.getByRole("radio", { name: "Evidenced" });
  }

  allStopsRadio(): Locator {
    return this.page.getByRole("radio", { name: "All stops" });
  }

  timingPointsRadio(): Locator {
    return this.page.getByRole("radio", { name: "Timing points" });
  }

  stopListItems(): Locator {
    return this.page.locator(".stop-list-item");
  }

  otpStats(): Locator {
    return this.page.locator(".vehicle-journeys__otp-stats");
  }

  journeyMap(): Locator {
    return this.page.getByRole("region", { name: "Map" });
  }

  async openOperatorOptions(): Promise<Locator> {
    await this.operatorSelect().click();
    const options = this.page
      .locator(".vehicle-journeys-search__operator")
      .getByRole("listitem");
    await expect(options.first()).toBeVisible({ timeout: 60000 });
    return options;
  }

  async openServiceOptions(): Promise<Locator> {
    await this.serviceSelect().click();
    const options = this.page
      .locator(".vehicle-journeys-search__service")
      .getByRole("listitem");
    await expect(options.first()).toBeVisible({ timeout: 60000 });
    return options;
  }

  async selectFirstOperator(): Promise<string> {
    const options = await this.openOperatorOptions();
    const label = (await options.first().textContent())?.trim() ?? "";
    await options.first().click();
    return label;
  }

  async selectFirstService(): Promise<string> {
    const options = await this.openServiceOptions();
    const label = (await options.first().textContent())?.trim() ?? "";
    await options.first().click();
    return label;
  }

  async waitForSearchOutcome(): Promise<void> {
    await expect(
      this.resultLinks()
        .first()
        .or(this.noJourneysAlert())
        .or(this.searchErrorAlert()),
    ).toBeVisible({ timeout: 60000 });
  }

  async openFirstJourneyResult(): Promise<void> {
    await expect(this.resultLinks().first()).toBeVisible({ timeout: 60000 });
    await this.resultLinks().first().click();
  }

  async selectEstimatedMatchType(): Promise<void> {
    await this.page.locator("label", { hasText: "Estimated" }).click();
  }

  async selectAllStops(): Promise<void> {
    await this.page.locator("label", { hasText: "All stops" }).click();
  }
}
