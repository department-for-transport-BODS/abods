import { Locator, Page } from "@playwright/test";

/**
 * Encapsulates interactions with the "Show performance using data from" toggle.
 * Present on: Dashboard, On-time performance, Vehicle journeys, Stop analysis.
 *
 * Angular renders the radio inputs as govuk-visually-hidden; users click the
 * visible label text. Use selectAllStops() / selectTimingPoints() for actions.
 */
export class StopTypeToggle {
  constructor(private readonly page: Page) {}

  /** The "All stops" radio input. Use with toBeChecked() / toBeVisible(). */
  allStopsRadio(): Locator {
    return this.page.getByRole("radio", { name: "All stops" });
  }

  /** The "Timing points" radio input. Use with toBeChecked() / toBeVisible(). */
  timingPointsRadio(): Locator {
    return this.page.getByRole("radio", { name: "Timing points" });
  }

  /**
   * Clicks the visible "All stops" label to select that option.
   * The radio input itself is visually hidden; clicking the label is how real
   * users interact with the GOV.UK segmented toggle pattern.
   */
  async selectAllStops(): Promise<void> {
    await this.page.getByText("All stops").click();
  }

  /** Clicks the visible "Timing points" label to select that option. */
  async selectTimingPoints(): Promise<void> {
    await this.page.getByText("Timing points").click();
  }
}
