import { Component, Input } from "@angular/core";
import { DateTime } from "luxon";
import { AvlPoint, Stop } from "../../../../generated/graphql";

@Component({
  selector: "app-journey-info",
  templateUrl: "./journey-info.component.html",
  styleUrls: ["./journey-info.component.scss"],
})
export class JourneyInfoComponent {
  @Input() loading?: boolean;
  @Input() stops: Stop[] = [];
  @Input() avls: AvlPoint[] = [];

  get operatorName(): string {
    return this.stops[0]?.operatorName ?? "";
  }

  get operatorNocCode(): string {
    return this.stops[0]?.operatorNoc ?? "";
  }

  get servicePatternName(): string {
    return this.stops[0]?.serviceName ?? "";
  }

  get startTime(): DateTime | undefined {
    return this.stops[0]
      ? DateTime.fromISO(this.stops[0].startTime)
      : undefined;
  }

  get vehicleId(): string {
    return this.avls[0]?.vehicleRef ?? "Unknown";
  }
}
