import { Locator, Page } from "@playwright/test";

/**
 * Page object for corridors routes.
 */
export class CorridorsPage {
  constructor(private readonly page: Page) {}

  async gotoList(): Promise<void> {
    await this.page.goto("/corridors", { waitUntil: "domcontentloaded" });
  }

  async gotoCreate(): Promise<void> {
    await this.page.goto("/corridors/create", {
      waitUntil: "domcontentloaded",
    });
  }

  async gotoView(corridorId: number | string): Promise<void> {
    await this.page.goto(`/corridors/${corridorId}`, {
      waitUntil: "domcontentloaded",
    });
  }

  async gotoEdit(corridorId: number | string): Promise<void> {
    await this.page.goto(`/corridors/edit/${corridorId}`, {
      waitUntil: "domcontentloaded",
    });
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "Corridors", level: 1 });
  }

  createNewCorridorButton(): Locator {
    return this.page.getByRole("button", { name: "Create new corridor" });
  }

  searchInput(): Locator {
    return this.page.getByLabel("Search for a corridor");
  }

  editLinkFirst(): Locator {
    return this.page.getByRole("link", { name: "Edit" }).first();
  }

  noMatchesMessage(): Locator {
    return this.page.getByText("No corridors matched the search query.");
  }

  async searchForCorridor(query: string): Promise<void> {
    await this.searchInput().fill(query);
  }

  async openFirstCorridorFromList(): Promise<void> {
    await this.page
      .locator("tbody tr")
      .first()
      .getByRole("link")
      .first()
      .click();
  }

  async openFirstEditFromList(): Promise<void> {
    await this.editLinkFirst().click();
  }

  createHeading(): Locator {
    return this.page.getByRole("heading", { name: "Create new corridor" });
  }

  allCorridorsBackLink(): Locator {
    return this.page.getByRole("link", { name: "All corridors" });
  }

  corridorNameInput(): Locator {
    return this.page.getByLabel("Enter a corridor name");
  }

  stopSearchInput(): Locator {
    return this.page.getByLabel("Location name or postcode");
  }

  viewHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  editCorridorButton(): Locator {
    return this.page.getByRole("button", { name: "Edit corridor" });
  }

  recordedTransitsStat(): Locator {
    return this.page.getByText("Recorded transits").first();
  }

  missingTransitsStat(): Locator {
    return this.page.getByText("Missing transits");
  }

  averageJourneyTimeStat(): Locator {
    return this.page.getByText("Average journey time").first();
  }

  servicesHeading(): Locator {
    return this.page.getByRole("heading", { name: "Services" });
  }

  editHeading(): Locator {
    return this.page.getByRole("heading", { name: "Edit corridor" });
  }

  deleteThisCorridorButton(): Locator {
    return this.page.getByRole("button", { name: "Delete this corridor" });
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: "Save", exact: true });
  }

  deleteCorridorConfirmButton(): Locator {
    return this.page.getByRole("button", { name: "Delete corridor" });
  }

  notFoundHeading(): Locator {
    return this.page.getByRole("heading", { name: "Not found" });
  }

  async openDeleteConfirmation(): Promise<void> {
    await this.deleteThisCorridorButton().click();
  }
}
