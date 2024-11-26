import { Component, Input } from "@angular/core";
import { Journey } from "../../../../generated/graphql";
import { DateTime } from "luxon";

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

  @Input() operatorId?: string;
  @Input() serviceId?: string;
  @Input() loading = false;
  patterns: Journey[][] = [];

  formatStartTime(startTime: string) {
    return DateTime.fromISO(startTime).toFormat("HH:mm");
  }
}
