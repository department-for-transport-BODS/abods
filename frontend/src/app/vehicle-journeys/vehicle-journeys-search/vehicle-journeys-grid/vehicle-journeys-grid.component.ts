import { Component, Input } from "@angular/core";
import { Journey } from "../../../../generated/graphql";
import { formatJourneyStartTime } from "../../vehicleJourneyUtils";

@Component({
  selector: "app-vehicle-journeys-grid",
  templateUrl: "./vehicle-journeys-grid.component.html",
  styleUrls: ["./vehicle-journeys-grid.component.scss"],
})
export class VehicleJourneysGridComponent {
  @Input() set data(data: Journey[]) {
    const grouped = data.reduce(
      (groups, item) => {
        const key = item.serviceName;
        return { ...groups, [key]: [...(groups[key] ?? []), item] };
      },
      {} as Record<string, Journey[]>,
    );
    this.patterns = Array.from(Object.values(grouped));
  }

  @Input() date?: string;
  @Input() operatorId?: string;
  @Input() serviceId?: string;
  @Input() loading = false;
  patterns: Journey[][] = [];

  formatStartTime = formatJourneyStartTime;
}
