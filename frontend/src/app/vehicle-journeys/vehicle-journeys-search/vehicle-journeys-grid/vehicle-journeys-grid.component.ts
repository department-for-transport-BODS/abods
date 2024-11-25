import { Component, Input } from "@angular/core";
import { Journey } from "../../../../generated/graphql";
import { DateTime } from "luxon";

export interface VehicleJourney extends Omit<Journey, "startTime"> {
  startTime: DateTime;
}

@Component({
  selector: "app-vehicle-journeys-grid",
  templateUrl: "./vehicle-journeys-grid.component.html",
  styleUrls: ["./vehicle-journeys-grid.component.scss"],
})
export class VehicleJourneysGridComponent {
  @Input() set data(data: Journey[]) {
    const grouped = data
      .map((j) => ({
        ...j,
        startTime: DateTime.fromISO(j.startTime),
      }))
      .reduce(
        (groups, item) => {
          const key = item.serviceName;
          return { ...groups, [key]: [...(groups[key] ?? []), item] };
        },
        {} as Record<string, VehicleJourney[]>,
      );
    this.patterns = Array.from(Object.values(grouped));
  }

  @Input() operatorId?: string;
  @Input() serviceId?: string;
  @Input() loading = false;
  patterns: VehicleJourney[][] = [];
}
