import { Injectable } from "@angular/core";
import {
  Journey,
  JourneysGQL,
  ServicePatternDistanceGeomGQL,
} from "../../../generated/graphql";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DateTime } from "luxon";

@Injectable({ providedIn: "root" })
export class VehicleJourneysSearchService {
  constructor(
    private journeysGQL: JourneysGQL,
    private servicePatternDistanceGeomGQL: ServicePatternDistanceGeomGQL,
  ) {}

  fetchDayJourneys(
    dateOfJourney: string,
    lineId: string,
  ): Observable<Journey[]> {
    return this.journeysGQL.fetch({ dateOfJourney, lineId }).pipe(
      map((journeys) => {
        const now = DateTime.now();
        return journeys.data.findJourneys
          .filter((n) => DateTime.fromISO(n.startTime) <= now)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      }),
    );
  }

  getServicePatternDistanceGeom(
    vehicleJourneyId: string,
  ): Observable<{ distance: number; geom: [number, number][] }> {
    return this.servicePatternDistanceGeomGQL
      .fetch({ vehicleJourneyId }, { fetchPolicy: "no-cache" })
      .pipe(
        map((result) => ({
          distance: result.data.getServicePatternDistanceGeom.distance,
          geom: result.data.getServicePatternDistanceGeom.geom,
        })),
      );
  }
}
