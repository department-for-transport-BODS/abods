import { Component, Input } from "@angular/core";
import { DateTime } from "luxon";
import { JourneyInfo } from "../vehicle-journeys-view.component";
import { Journey } from "../../../../generated/graphql";

@Component({
  selector: "app-journey-info",
  templateUrl: "./journey-info.component.html",
  styleUrls: ["./journey-info.component.scss"],
})
export class JourneyInfoComponent {
  @Input() loading?: boolean;
  @Input() journeyInfo?: JourneyInfo | null;
  @Input() journey?: Journey = undefined;

  get operatorName(): string {
    return this.journey?.operatorName ?? "";
  }

  get operatorNocCode(): string {
    return this.journey?.operatorNoc ?? "";
  }

  get servicePatternName(): string {
    return this.journey?.serviceName ?? "";
  }

  get startTime(): DateTime | undefined {
    return this.journey ? DateTime.fromISO(this.journey.startTime) : undefined;
  }

  get vehicleId(): string {
    return this.journeyInfo?.avls[0]?.vehicleRef ?? "Unknown";
  }
}
