import { Injectable, Type, ViewChild } from "@angular/core";
import { FiltersComponent } from "../filters/filters.component";

export interface PanelInterface {
  getComponent(): Type<unknown>;
  resetFilters(): void;
}

@Injectable({
  providedIn: "root",
})
export class OnTimePanelService implements PanelInterface {
  resetFilters(): void {
    this.filtersComponent?.resetFilters();
  }
  getComponent(): Type<unknown> {
    return FiltersComponent;
  }
  @ViewChild(FiltersComponent) filtersComponent?: FiltersComponent;
}
