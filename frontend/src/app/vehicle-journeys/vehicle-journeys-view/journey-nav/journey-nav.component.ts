import { Component, Input } from "@angular/core";
import { DateTime } from "luxon";
import { NgxTippyProps } from "ngx-tippy-wrapper";
import { Journey } from "../../../../generated/graphql";

export interface VehicleJourney extends Omit<Journey, "startTime"> {
  startTime: DateTime;
}

@Component({
  selector: "app-journey-nav",
  templateUrl: "journey-nav.component.html",
  styleUrls: ["./journey-nav.component.scss"],
})
export class JourneyNavComponent {
  @Input() loading = false;
  @Input() journeys: Journey[] = [];
  @Input() currentIndex = -1;

  toViewModel(journeyIndex: number): VehicleJourney | undefined {
    const journey = this.journeys[journeyIndex];
    if (!journey) return undefined;
    return {
      ...journey,
      startTime: DateTime.fromISO(journey.startTime),
    };
  }

  get next() {
    return this.toViewModel(this.currentIndex + 1);
  }

  get previous() {
    return this.toViewModel(this.currentIndex - 1);
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
