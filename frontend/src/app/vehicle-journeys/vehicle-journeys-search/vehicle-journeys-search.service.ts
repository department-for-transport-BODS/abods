import { Injectable } from '@angular/core';
import { JourneysGQL } from '../../../generated/graphql';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { nonNullishArray } from '../../shared/array-operators';
import { findIndex, sortBy, uniqBy } from 'lodash-es';
import { FindJourneysCache } from './find-journeys-cache';

export interface VehicleJourney {
  vehicleJourneyId?: string;
  startTime?: DateTime;
  servicePattern: string;
  lineNumber: string;
}

@Injectable({ providedIn: 'root' })
export class VehicleJourneysSearchService {
  private findJourneysCache = new FindJourneysCache();

  constructor(private journeysGQL: JourneysGQL) {}

  fetchJourneys(from: DateTime, to: DateTime, lineId: string): Observable<VehicleJourney[]> {
    // filterOnStartTime is set to true so we filter on start times directly,
    // rather than on gps_time which is the default behaviour.
    return this.journeysGQL
      .fetch(
        { fromTimestamp: from.toISO(), toTimestamp: to.toISO(), lineId, filterOnStartTime: true },
        { fetchPolicy: 'no-cache' }
      )
      .pipe(
        map((result) => nonNullishArray(result.data.vehicleReplay.findJourneys)),
        map((journeys) => uniqBy(sortBy(journeys, 'startTime'), 'vehicleJourneyId')),
        map((journeys) =>
          journeys.map((journey) => ({
            vehicleJourneyId: journey.vehicleJourneyId ?? undefined,
            startTime: DateTime.fromISO(journey.startTime),
            servicePattern: journey.serviceInfo.serviceName,
            lineNumber: journey.serviceInfo.serviceNumber,
          }))
        ),
        tap((journeys) => {
          // Cache the result for use on vehice journey view page
          const cacheKey = FindJourneysCache.generateKey(from, to, lineId);
          this.findJourneysCache.setItem(cacheKey, journeys);
        })
      );
  }

  fetchNextPrevJourneys(
    startTime: DateTime,
    lineId: string,
    journeyId: string
  ): Observable<[VehicleJourney | null, VehicleJourney | null]> {
    const from = startTime.startOf('day');
    const to = startTime.startOf('day').plus({ day: 1 });
    const cacheKey = FindJourneysCache.generateKey(from, to, lineId);

    let obs$ = this.fetchJourneys(from, to, lineId);

    // Return cached result from search page
    if (this.findJourneysCache.hasItem(cacheKey)) {
      obs$ = this.findJourneysCache.getItem(cacheKey);
    }

    return obs$.pipe(
      map((journeys) => {
        const idx = findIndex(
          journeys,
          (journey) => journey.startTime?.toMillis() === startTime.toMillis() && journey.vehicleJourneyId === journeyId
        );
        const prev = idx > 0 ? journeys[idx - 1] : null;
        const next = idx < journeys.length - 1 ? journeys[idx + 1] : null;
        return [prev, next];
      })
    );
  }
}
