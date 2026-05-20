import { Locator, Page } from "@playwright/test";
import { OperatorSelector } from "../components/OperatorSelector";
import { StopTypeToggle } from "../components/StopTypeToggle";

/**
 * Page object for the Dashboard page (/dashboard).
 *
 * Composes shared component objects and exposes locators and actions
 * for dashboard-specific elements. Tests should use these methods rather
 * than constructing locators inline, so that selector changes are fixed
 * in one place.
 *
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
   * Waits for the DOM to be loaded before returning.
   */
  async goto(queryParams?: Record<string, string>): Promise<void> {
    const search = queryParams
      ? "?" + new URLSearchParams(queryParams).toString()
      : "";
    await this.page.goto(`/dashboard${search}`, {
      waitUntil: "domcontentloaded",
    });
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

  /**
   * The period selector combobox inside the on-time widget.
   * Angular labels it "period"; Next.js may use a different accessible name.
   */
  periodSelector(): Locator {
    return this.page
      .getByRole("combobox", { name: /period|last/i })
      .or(this.page.getByRole("combobox").nth(1));
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

  /**
   * The feed status summary table.
   * Angular uses class="feed-status-summary"; Next.js may differ.
   */
  feedStatusTable(): Locator {
    return this.page.locator("table.feed-status-summary");
  }

  /**
   * The "NOC feed monitoring" link inside the main content area.
   * Scoped to <main> to exclude the identically-named nav sidebar link.
   */
  nocFeedMonitoringLink(): Locator {
    return this.page
      .locator("main")
      .getByRole("link", { name: /noc feed monitoring/i });
  }
}
