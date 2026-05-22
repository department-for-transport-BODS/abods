import { Locator, Page } from "@playwright/test";
import { escapeRegExp } from "../utils/utils";

/**
 * Encapsulates interactions with the operator selector combobox.
 * Present on: Dashboard, On-time performance, Vehicle journeys, Corridors.
 *
 * Angular renders this as an ng-select with labelForId="operator_selector".
 * Options appear as role="option" elements when the dropdown is open.
 */
export class OperatorSelector {
  constructor(private readonly page: Page) {}

  /** The combobox input element. */
  combobox(): Locator {
    return this.page.getByRole("combobox", { name: "Operator" });
  }

  /** Opens the operator dropdown. */
  async openDropdown(): Promise<void> {
    await this.combobox().click();
  }

  /**
   * Selected option in the opened dropdown by its user-visible label.
   * Uses aria-selected state rather than framework-specific class names.
   */
  selectedOption(label: string): Locator {
    return this.page.locator('[role="option"][aria-selected="true"]', {
      hasText: new RegExp(`^${escapeRegExp(label)}$`),
    });
  }

  /**
   * Opens the dropdown and clicks the first operator that is not "All operators".
   * Waits for the option to be visible before clicking.
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
