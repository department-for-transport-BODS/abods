import { Locator, Page } from "@playwright/test";

// Functionality related to / within the stop type toggle
export class StopTypeToggle {
  constructor(private readonly page: Page) {}

  allStopsRadio(): Locator {
    return this.page.getByRole("radio", { name: "All stops" });
  }

  timingPointsRadio(): Locator {
    return this.page.getByRole("radio", { name: "Timing points" });
  }

  async selectAllStops(): Promise<void> {
    await this.page.getByText("All stops").click();
  }

  async selectTimingPoints(): Promise<void> {
    await this.page.getByText("Timing points").click();
  }
}
