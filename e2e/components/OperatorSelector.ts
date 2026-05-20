import { Locator, Page } from "@playwright/test";

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

  /**
   * The "All operators" label shown when no operator is selected.
   * Use with toBeVisible() / not.toBeVisible().
   */
  defaultValueLabel(): Locator {
    return this.page.getByText("All operators", { exact: true });
  }

  /**
   * Opens the dropdown and clicks the first operator that is not "All operators".
   * Waits for the option to be visible before clicking.
   */
  async selectFirstOperator(): Promise<void> {
    await this.combobox().click();
    await this.page
      .getByRole("option")
      .filter({ hasNotText: /all operators/i })
      .first()
      .click();
  }
}
