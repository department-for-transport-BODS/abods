import { Injectable, Type, ViewChild } from "@angular/core";
import { OnTimeFiltersComponent } from "../on-time-filters/on-time-filters.component";

export interface PanelInterface {
  getComponent(): Type<unknown>;
}

@Injectable({
  providedIn: "root",
})
export class OnTimePanelService implements PanelInterface {
  getComponent(): Type<unknown> {
    return OnTimeFiltersComponent;
  }
  @ViewChild(OnTimeFiltersComponent) filtersComponent?: OnTimeFiltersComponent;
}
