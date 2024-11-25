import { Injectable } from "@angular/core";
import { Journey, JourneysGQL } from "../../../generated/graphql";
import { DateTime } from "luxon";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { sortBy } from "lodash-es";

@Injectable({ providedIn: "root" })
export class VehicleJourneysSearchService {
  constructor(private journeysGQL: JourneysGQL) {}

  fetchDayJourneys(date: string, lineId: string): Observable<Journey[]> {
    // filterOnStartTime is set to true so we filter on start times directly,
    // rather than on gps_time which is the default behaviour.
    const dateOfJourney = DateTime.fromISO(date)
      .setZone("Europe/London")
      .startOf("day")
      .toISO();
    return this.journeysGQL
      .fetch({ dateOfJourney, lineId }, { fetchPolicy: "no-cache" })
      .pipe(map((journeys) => sortBy(journeys.data.findJourneys, "startTime")));
  }
}
