import { Locator, Page } from "@playwright/test";
import { OperatorSelector } from "../components/OperatorSelector";
import { StopTypeToggle } from "../components/StopTypeToggle";

/**
 * Page object for the Dashboard page (/dashboard).
 * Usage:
 *   const dashboard = new DashboardPage(loggedInPage);
 *   await dashboard.goto();
 */
export class DashboardPage {
  readonly operatorSelector: OperatorSelector;
  readonly stopTypeToggle: StopTypeToggle;

  constructor(private readonly page: Page) {
    this.operatorSelector = new OperatorSelector(page);
    this.stopTypeToggle = new StopTypeToggle(page);
  }

  /**
   * Navigates to the dashboard, optionally with query params.
   * Waits for the DOM load before return
   */
  async goto(queryParams?: Record<string, string>): Promise<void> {
    const search = queryParams
      ? "?" + new URLSearchParams(queryParams).toString()
      : "";
    await this.page.goto(`/dashboard${search}`, {
      waitUntil: "domcontentloaded",
    });
    await this.onTimeHeading().waitFor({ state: "visible" });
  }

  // ── Page-level ─────────────────────────────────────────────────────────────

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Dashboard", level: 1 });
  }

  // ── On-time performance section ─────────────────────────────────────────────

  onTimeHeading(): Locator {
    return this.page.getByRole("heading", {
      name: "On-time performance",
      level: 2,
    });
  }

  periodSelector(): Locator {
    return this.page
      .getByRole("combobox", { name: /period|last/i })
      .or(this.page.getByRole("combobox").nth(1));
  }

  topThreeTab(): Locator {
    return this.page
      .locator(".app-performance-ranking")
      .getByText("Top 3", { exact: true });
  }

  bottomThreeTab(): Locator {
    return this.page
      .locator(".app-performance-ranking")
      .getByText("Bottom 3", { exact: true });
  }

  rankingRows(): Locator {
    return this.page.locator("table.ranking-table__data tbody tr");
  }

  async selectTopThree(): Promise<void> {
    await this.topThreeTab().click();
  }

  async selectBottomThree(): Promise<void> {
    await this.bottomThreeTab().click();
  }

  // ── Vehicle count section ───────────────────────────────────────────────────

  vehicleCountHeading(): Locator {
    return this.page.getByRole("heading", { name: "Vehicle count", level: 2 });
  }

  currentLabel(): Locator {
    return this.page.getByText("Current");
  }

  expectedLabel(): Locator {
    return this.page.getByText("Expected");
  }

  liveStatusLink(): Locator {
    return this.page.getByRole("link", { name: /live status/i });
  }

  // ── Feed status section ─────────────────────────────────────────────────────

  feedStatusHeading(): Locator {
    return this.page.getByRole("heading", { name: "Feed status", level: 2 });
  }

  feedStatusTable(): Locator {
    return this.page.locator("table.feed-status-summary");
  }

  nocFeedMonitoringLink(): Locator {
    return this.page
      .locator("main")
      .getByRole("link", { name: /noc feed monitoring/i });
  }
}
