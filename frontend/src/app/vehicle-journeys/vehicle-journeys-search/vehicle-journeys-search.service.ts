import { Injectable } from "@angular/core";
import { Journey, JourneysGQL } from "../../../generated/graphql";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DateTime } from "luxon";

@Injectable({ providedIn: "root" })
export class VehicleJourneysSearchService {
  constructor(private journeysGQL: JourneysGQL) {}

  fetchDayJourneys(
    dateOfJourney: string,
    lineId: string,
  ): Observable<Journey[]> {
    return this.journeysGQL
      .fetch({ dateOfJourney, lineId }, { fetchPolicy: "no-cache" })
      .pipe(
        map((journeys) => {
          const now = DateTime.now();
          return journeys.data.findJourneys
            .filter((n) => DateTime.fromISO(n.startTime) <= now)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        }),
      );
  }
}
