import { Locator, Page } from "@playwright/test";

/**
 * Component object for the global Helpdesk side panel that can be opened from
 * the header "Help" link or the nav "Help" button on any authenticated page.
 */
export class HelpdeskPanel {
  constructor(private readonly page: Page) {}

  // ── Openers ──────────────────────────────────────────────────────────────

  headerHelpButton(): Locator {
    return this.page.getByRole("button", { name: "Help" }).first();
  }

  navToggleButton(): Locator {
    return this.page.locator("#nav-toggle");
  }

  navHelpButton(): Locator {
    return this.page.locator("nav#navigation").getByRole("button", {
      name: "Help",
    });
  }

  async openFromHeader(): Promise<void> {
    await this.headerHelpButton().click();
  }

  async openFromNav(): Promise<void> {
    if (await this.navToggleButton().isVisible()) {
      await this.navToggleButton().click();
    }
    await this.navHelpButton().click();
  }

  // ── Panel ────────────────────────────────────────────────────────────────

  overlay(): Locator {
    return this.page.locator(".helpdesk-overlay");
  }

  panel(): Locator {
    return this.page.getByRole("dialog");
  }

  heading(): Locator {
    return this.panel().getByRole("heading", { level: 2 });
  }

  closeButton(): Locator {
    return this.panel().getByRole("button", { name: /^Close/ });
  }

  async close(): Promise<void> {
    await this.closeButton().click();
  }

  accordion(): Locator {
    return this.panel().locator(".govuk-accordion");
  }

  accordionSectionButtons(): Locator {
    return this.panel().locator(".govuk-accordion__section-button");
  }

  noArticlesHeading(): Locator {
    return this.panel().getByRole("heading", {
      name: /no help articles/i,
    });
  }

  supportEmailLink(): Locator {
    return this.panel().getByRole("link", { name: /@/ });
  }
}
