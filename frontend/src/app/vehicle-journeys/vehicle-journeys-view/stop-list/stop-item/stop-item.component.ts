import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DateTime } from "luxon";
import { MatchType, Stop } from "../../../../../generated/graphql";
import { incompleteIdToString } from "../../../../shared/incompleteReasonUtils";

export interface StopHoverEvent {
  stop: Stop;
  event: "enter" | "leave";
}

@Component({
  selector: "app-stop-item",
  templateUrl: "./stop-item.component.html",
  styleUrls: ["../stop-list.component.scss", "./stop-item.component.scss"],
})
export class StopItemComponent {
  @Input() stop!: Stop;
  @Input() timingPointsOnly = false;
  @Input() matchType = MatchType.Evidenced;
  @Input() firstItem?: boolean;
  @Output() stopSelected = new EventEmitter<Stop>();
  @Output() stopHovered = new EventEmitter<StopHoverEvent>();

  get displayTimingDetails() {
    return !this.timingPointsOnly || (this.stop?.isTimingPoint ?? false);
  }

  get otp() {
    if (!this.stop) return null;
    if (
      this.matchType === MatchType.Evidenced &&
      this.stop.estimatedDepartureUtc
    )
      return null;
    return this.stop.otp?.toString() ?? null;
  }

  get scheduledDeparture() {
    if (!this.stop) return null;
    return DateTime.fromISO(this.stop.scheduledDepartureUtc);
  }

  get actualDeparture() {
    if (!this.stop) return null;
    if (this.stop.actualDepartureUtc)
      return DateTime.fromISO(this.stop.actualDepartureUtc);
    if (
      this.matchType === MatchType.Estimated &&
      this.stop.estimatedDepartureUtc
    )
      return DateTime.fromISO(this.stop.estimatedDepartureUtc);
    return null;
  }

  get delay() {
    const scheduled = this.scheduledDeparture;
    if (!scheduled) return null;
    return this.actualDeparture?.diff(scheduled);
  }

  get incompleteReason() {
    if (!this.stop) return null;
    return incompleteIdToString(this.stop.incompleteReason) ?? null;
  }
}
