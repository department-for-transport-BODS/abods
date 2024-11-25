import { Component, Input } from "@angular/core";
import { VehicleJourney } from "../../vehicle-journeys-search/vehicle-journeys-search.service";
import { DateTime } from "luxon";
import { NgxTippyProps } from "ngx-tippy-wrapper";

@Component({
  selector: "app-journey-nav",
  templateUrl: "journey-nav.component.html",
  styleUrls: ["./journey-nav.component.scss"],
})
export class JourneyNavComponent {
  @Input() loading = false;
  @Input() journeys: VehicleJourney[] = [];
  @Input() currentIndex = -1;

  get next(): VehicleJourney | undefined {
    return this.journeys[this.currentIndex + 1] ?? undefined;
  }

  get previous(): VehicleJourney | undefined {
    return this.journeys[this.currentIndex - 1];
  }

  // I would use a pipe, but luxon-angular doesn't support ToISOTimeOptions.
  formatStartTime(startTime?: DateTime) {
    return startTime?.toUTC().toISO({ format: "basic", suppressSeconds: true });
  }

  tippyProps: NgxTippyProps = {
    allowHTML: true,
    theme: "gds-tooltip",
    zIndex: 100,
  };
}
