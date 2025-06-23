import { Component, Input } from "@angular/core";
import { DateTime } from "luxon";
import { Journey } from "../../../../generated/graphql";

@Component({
  selector: "app-journey-info",
  templateUrl: "./journey-info.component.html",
  styleUrls: ["./journey-info.component.scss"],
  standalone: false,
})
export class JourneyInfoComponent {
  @Input() loading = false;
  @Input() vehicleRef: string | null = null;
  @Input() journey: Journey | null = null;
  @Input() distance?: number | null = null;

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
    return this.vehicleRef ?? "Unknown";
  }

  get serviceDistance(): number | string {
    return this.distance ?? "Unknown";
  }
}
