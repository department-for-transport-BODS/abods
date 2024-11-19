import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DateTime } from "luxon";
import { StopDetails } from "../../vehicle-journeys-view.component";
import { OtpEnum } from "../../../../../generated/graphql";

export type StopHoverEvent = {
  stop?: StopDetails;
  event: "enter" | "leave";
};

@Component({
  selector: "app-stop-item",
  templateUrl: "./stop-item.component.html",
  styleUrls: ["../stop-list.component.scss", "./stop-item.component.scss"],
})
export class StopItemComponent {
  @Input() stop?: StopDetails;
  @Input() timingPointsOnly = false;
  @Input() firstItem?: boolean;
  @Output() stopSelected = new EventEmitter<StopDetails>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();

  get displayTimingDetails() {
    return !this.timingPointsOnly || (this.stop?.isTimingPoint ?? false);
  }

  get otp() {
    return this.stop?.otp?.toString() ?? null;
  }

  get scheduledDeparture() {
    if (!this.stop) return null;
    return DateTime.fromISO(this.stop.scheduledDepartureUtc);
  }

  get actualDeparture() {
    if (!this.stop) return null;
    if (!this.stop.actualDepartureUtc) return null;
    return DateTime.fromISO(this.stop.actualDepartureUtc);
  }

  get delay() {
    const scheduled = this.scheduledDeparture;
    if (!scheduled) return null;
    return this.actualDeparture?.diff(scheduled);
  }
}
