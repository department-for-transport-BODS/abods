import { Locator, Page } from "@playwright/test";
import { DateTime } from "luxon";

/**
 * Page object for the Feed History page (/feed-monitoring/[nocCode]/feed-history).
 */
export class FeedHistoryPage {
  constructor(private readonly page: Page) {}

  async goTo(nocCode: string, date?: DateTime): Promise<void> {
    const d = date ? date.toISODate() : new Date(Date.now() - 86400000).toISOString().split("T")[0];
    await this.page.goto(`/feed-monitoring/${nocCode}/feed-history?date=${d}`, { waitUntil: "domcontentloaded" });
  }

  backToLiveStatusLink(): Locator {
    return this.page.getByRole("link", { name: "Live status" });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Feed history" });
  }

  previousLink(): Locator {
    return this.page.getByRole("link", { name: /‹ Previous/i }).first();
  }

  nextLink(): Locator {
    return this.page.getByRole("link", { name: /Next ›/i }).first();
  }

  feedAvailabilityStat(): Locator {
    return this.page.getByText("Feed availability").locator("..");
  }

  averageUpdateFreqStat(): Locator {
    return this.page.getByText("Average update frequency").locator("..");
  }

  async selectDate(label: string): Promise<void> {
    await this.page.getByRole("button", { name: label }).click();
  }
}
