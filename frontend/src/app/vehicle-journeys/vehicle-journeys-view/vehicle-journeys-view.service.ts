import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VehicleJourneyView } from './vehicle-journey-view.model';
import {
  VehicleJourney,
  VehicleJourneysSearchService,
} from '../vehicle-journeys-search/vehicle-journeys-search.service';
import { DateTime } from 'luxon';

export interface StopDetails {
  stopIndex?: number;
  timingPoint?: boolean;
  arrivalTimeOffset?: number;
  departureTimeOffset?: number;
  timingPatternId?: string;
  lat?: number;
  lon?: number;
  stopId?: string;
  stopName?: string;
  startTime: DateTime;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleJourneysViewService {
  constructor(private vehicleJourneysSearchService: VehicleJourneysSearchService) {}

  getVehicleJourneyViewWithNextPrevJourneys(
    journeyId: string,
    startTime: DateTime,
    timingPointsOnly: boolean
  ): Observable<{ view: VehicleJourneyView; prevNextJourneys: [VehicleJourney | null, VehicleJourney | null] }> {
    return this.vehicleJourneysSearchService.getJourney(journeyId, startTime, timingPointsOnly);
  }
}
