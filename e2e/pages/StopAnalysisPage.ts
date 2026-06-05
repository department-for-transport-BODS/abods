import { Locator, Page } from "@playwright/test";

/**
 * Page object for the Stop analysis page (/stop-analysis).
 */
export class StopAnalysisPage {
  constructor(private readonly page: Page) {}

  async goto(queryParams?: Record<string, string>): Promise<void> {
    const search = queryParams
      ? "?" + new URLSearchParams(queryParams).toString()
      : "";

    await this.page.goto(`/stop-analysis${search}`, {
      waitUntil: "domcontentloaded",
    });
  }

  async openFromDashboardNav(): Promise<void> {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.page.getByRole("link", { name: "Stop analysis" }).click();
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Stop Analysis" });
  }

  refineResultsButton(): Locator {
    return this.page.getByRole("button", { name: "Refine results" });
  }

  refinePanel(): Locator {
    return this.page.locator("#refine-panel");
  }

  closeRefineButton(): Locator {
    return this.refinePanel().getByRole("button", { name: "Close" });
  }

  resetToDefaultsButton(): Locator {
    return this.refinePanel().getByRole("button", {
      name: "Reset to defaults",
    });
  }

  applyButton(): Locator {
    return this.refinePanel().getByRole("button", { name: "Apply" });
  }

  displayOptionsButton(): Locator {
    return this.page.getByRole("button", { name: "Display options" });
  }

  dateFromInput(): Locator {
    return this.page.locator("#sa-from-date");
  }

  dateToInput(): Locator {
    return this.page.locator("#sa-to-date");
  }

  presetDateRangeSelect(): Locator {
    return this.page.getByLabel("Preset date range");
  }

  adminAreasTrigger(): Locator {
    return this.page.getByLabel("Admin Areas");
  }

  matchTypeRadio(name: "Estimated" | "Evidenced"): Locator {
    return this.page.getByRole("radio", { name });
  }

  stopTypeRadio(name: "All stops" | "Timing points"): Locator {
    return this.page.getByRole("radio", { name });
  }

  locationSearch(): Locator {
    return this.page.getByLabel("Search for location");
  }

  operatorsTrigger(): Locator {
    return this.page.getByLabel("Operators");
  }

  servicesTrigger(): Locator {
    return this.page.getByLabel("Services");
  }

  directionCheckbox(name: "Inbound" | "Outbound"): Locator {
    return this.page.getByRole("checkbox", { name });
  }

  searchStopsInput(): Locator {
    return this.page.getByLabel("Search stops");
  }

  chip(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }
}
