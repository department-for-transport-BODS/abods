import { Injectable } from "@angular/core";
import { AvlsGQL, JourneysGQL, RouteGQL } from "../../../generated/graphql";
import { DateTime } from "luxon";
import { mergeMap, Observable, of, zip } from "rxjs";
import { map, tap } from "rxjs/operators";
import { nonNullishArray } from "../../shared/array-operators";
import { sortBy, uniqBy } from "lodash-es";
import { FindJourneysCache } from "./find-journeys-cache";
import {
  createVehicleJourneyView,
  VehicleJourneyView,
} from "../vehicle-journeys-view/vehicle-journey-view.model";

export interface VehicleJourney {
  groupId?: string;
  startTime?: DateTime;
  servicePattern: string;
  lineNumber: string;
}

@Injectable({ providedIn: "root" })
export class VehicleJourneysSearchService {
  private findJourneysCache = new FindJourneysCache();

  constructor(
    private journeysGQL: JourneysGQL,
    private avlsGQL: AvlsGQL,
    private routeGQL: RouteGQL,
  ) {}

  fetchDayJourneys(
    date: DateTime,
    lineId: string,
  ): Observable<VehicleJourney[]> {
    // filterOnStartTime is set to true so we filter on start times directly,
    // rather than on gps_time which is the default behaviour.
    const from = date.startOf("day");
    const to = from.plus({ day: 1 });

    // Return cached result if available
    const cached = this.findJourneysCache.getItem(from, to, lineId);
    if (cached) {
      return of(cached);
    }

    return this.journeysGQL
      .fetch(
        {
          fromTimestamp: from.toISO(),
          toTimestamp: to.toISO(),
          lineId,
          filterOnStartTime: true,
        },
        { fetchPolicy: "no-cache" },
      )
      .pipe(
        map((result) =>
          nonNullishArray(result.data.vehicleReplay?.findJourneys),
        ),
        map((journeys) => uniqBy(sortBy(journeys, "startTime"), "groupId")),
        map((journeys) =>
          journeys.map((journey) => ({
            groupId: journey.groupId ?? undefined,
            startTime: DateTime.fromISO(journey.startTime),
            servicePattern: journey.serviceInfo.serviceName,
            lineNumber: journey.serviceInfo.serviceNumber,
          })),
        ),
        tap((journeys) => {
          // Cache the result for use on vehicle journey view page
          this.findJourneysCache.setItem(from, to, lineId, journeys);
        }),
      );
  }

  getJourney(
    journeyId: string,
    startTime: DateTime,
    timingPointsOnly: boolean,
  ): Observable<VehicleJourneyView> {
    return zip(
      this.avlsGQL.fetch({ groupId: journeyId }),
      this.routeGQL.fetch({ groupId: journeyId }),
    ).pipe(
      mergeMap(
        ([
          {
            data: { avls },
          },
          {
            data: { route },
          },
        ]) =>
          this.fetchDayJourneys(
            startTime.setZone("Europe/London"),
            route?.[0]?.serviceId ?? "",
          ).pipe(
            map((journeys) =>
              createVehicleJourneyView(
                avls,
                route,
                timingPointsOnly,
                journeys,
                startTime,
                journeyId,
              ),
            ),
          ),
      ),
    );
  }
}
