import { Injectable } from "@angular/core";
import { Journey, JourneysGQL } from "../../../generated/graphql";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { sortBy } from "lodash-es";

@Injectable({ providedIn: "root" })
export class VehicleJourneysSearchService {
  constructor(private journeysGQL: JourneysGQL) {}

  fetchDayJourneys(
    dateOfJourney: string,
    lineId: string,
  ): Observable<Journey[]> {
    return this.journeysGQL
      .fetch({ dateOfJourney, lineId }, { fetchPolicy: "no-cache" })
      .pipe(map((journeys) => sortBy(journeys.data.findJourneys, "startTime")));
  }
}
