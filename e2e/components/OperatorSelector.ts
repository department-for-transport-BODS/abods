import { Locator, Page } from "@playwright/test";
import { escapeRegExp } from "../utils/utils";

// Functionality related to / within the operator selector dropdown
export class OperatorSelector {
  constructor(private readonly page: Page) {}

  combobox(): Locator {
    return this.page.getByRole("combobox", { name: "Operator" });
  }

  async openDropdown(): Promise<void> {
    await this.combobox().click();
  }

  selectedOption(label: string): Locator {
    return this.page.locator('[role="option"][aria-selected="true"]', {
      hasText: new RegExp(`^${escapeRegExp(label)}$`),
    });
  }

  /*
    QOL Improvement: Opens dropdown and selects the first operator option that isn't "All operators".
  */
  async selectFirstOperator(): Promise<void> {
    await this.openDropdown();
    await this.page
      .getByRole("option")
      .filter({ hasNotText: /all operators/i })
      .first()
      .click();
  }
}
