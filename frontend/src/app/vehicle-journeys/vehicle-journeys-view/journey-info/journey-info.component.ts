import { Component, Input } from "@angular/core";
import { DateTime } from "luxon";
import { JourneyInfo } from "../vehicle-journeys-view.component";

@Component({
  selector: "app-journey-info",
  templateUrl: "./journey-info.component.html",
  styleUrls: ["./journey-info.component.scss"],
})
export class JourneyInfoComponent {
  @Input() loading?: boolean;
  @Input() journeyInfo?: JourneyInfo | null;

  get operatorName(): string {
    return this.journeyInfo?.stops[0]?.operatorName ?? "";
  }

  get operatorNocCode(): string {
    return this.journeyInfo?.stops[0]?.operatorNoc ?? "";
  }

  get servicePatternName(): string {
    return this.journeyInfo?.stops[0]?.serviceName ?? "";
  }

  get startTime(): DateTime | undefined {
    return this.journeyInfo?.stops[0]
      ? DateTime.fromISO(this.journeyInfo?.stops[0].startTime)
      : undefined;
  }

  get vehicleId(): string {
    return this.journeyInfo?.avls[0]?.vehicleRef ?? "Unknown";
  }
}
