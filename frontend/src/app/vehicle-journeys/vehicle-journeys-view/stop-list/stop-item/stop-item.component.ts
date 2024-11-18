import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Stop } from "../../../../../generated/graphql";
import { DateTime } from "luxon";

export type StopHoverEvent = {
  stop?: Stop;
  event: "enter" | "leave";
};

@Component({
  selector: "app-stop-item",
  templateUrl: "./stop-item.component.html",
  styleUrls: ["../stop-list.component.scss", "./stop-item.component.scss"],
})
export class StopItemComponent {
  @Input() stop?: Stop;
  @Input() timingPointsOnly = false;
  @Input() estimated = false;
  @Input() firstItem?: boolean;
  @Output() stopSelected = new EventEmitter<Stop>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();

  get displayTimingDetails() {
    return !this.timingPointsOnly || (this.stop?.isTimingPoint ?? false);
  }

  get otp() {
    if (!this.stop) return undefined;
    if (this.stop.otp) return this.stop.otp;
    if (!this.estimated) return undefined;
    return this.stop.otpEstimate;
  }

  get scheduledDeparture() {
    if (!this.stop) return undefined;
    return DateTime.fromISO(this.stop.scheduledDepartureUtc);
  }

  get actualDeparture() {
    if (!this.stop) return undefined;
    if (this.stop.actualDepartureUtc)
      return DateTime.fromISO(this.stop.actualDepartureUtc);
    if (!this.estimated) return undefined;
    if (this.stop.estimatedDepartureUtc)
      return DateTime.fromISO(this.stop.estimatedDepartureUtc);
    return undefined;
  }

  get delay() {
    const scheduled = this.scheduledDeparture;
    if (!scheduled) return undefined;
    return this.actualDeparture?.diff(scheduled);
  }
}
