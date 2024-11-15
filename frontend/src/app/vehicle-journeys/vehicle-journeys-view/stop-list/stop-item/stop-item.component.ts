import { Component, EventEmitter, Input, Output } from "@angular/core";
import { VehiclePingStop } from "../../vehicle-ping-stop.model";

export type StopHoverEvent = {
  stop?: VehiclePingStop;
  event: "enter" | "leave";
};

@Component({
  selector: "app-stop-item",
  templateUrl: "./stop-item.component.html",
  styleUrls: ["../stop-list.component.scss", "./stop-item.component.scss"],
})
export class StopItemComponent {
  @Input() stop?: VehiclePingStop;
  @Input() timingPointsOnly = false;
  @Input() estimated = false;
  @Input() firstItem?: boolean;
  @Output() stopSelected = new EventEmitter<VehiclePingStop>();
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

  get actualDeparture() {
    if (!this.stop) return undefined;
    if (this.stop.actualDeparture) return this.stop.actualDeparture;
    if (!this.estimated) return undefined;
    return this.stop.estimatedDeparture;
  }

  get delay() {
    if (!this.stop) return undefined;
    if (this.stop.delay) return this.stop.delay;
    if (!this.estimated) return undefined;
    return this.stop.delayEstimate;
  }
}
