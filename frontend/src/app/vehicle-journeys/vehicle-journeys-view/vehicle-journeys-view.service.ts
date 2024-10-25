import { Injectable } from '@angular/core';
import { sortBy } from 'lodash-es';
import { map, mergeMap, Observable, switchMap, throwError } from 'rxjs';
import {
  GpsFeedType,
  Maybe,
  OperatorInfoType,
  ServiceInfoType,
  StopInfoType,
  TimingPatternDetailGQL,
  TimingPatternDetailType,
  VehicleJourneyTimingPatternGQL,
} from '../../../generated/graphql';
import { nonNullishArray } from '../../shared/array-operators';
import { VehicleJourneyView, VehicleJourneyViewParams } from './vehicle-journey-view.model';
import {
  VehicleJourney,
  VehicleJourneysSearchService,
} from '../vehicle-journeys-search/vehicle-journeys-search.service';
import { DateTime } from 'luxon';

export type ApolloGpsFeedType = Pick<
  GpsFeedType,
  | 'ts'
  | 'lat'
  | 'lon'
  | 'vehicleId'
  | 'vehicleJourneyId'
  | 'servicePatternId'
  | 'delay'
  | 'actualDelay'
  | 'startTime'
  | 'scheduledDeparture'
  | 'feedStatus'
  | 'journeyStatus'
  | 'isTimingPoint'
> & {
  operatorInfo?: Maybe<
    { __typename?: 'OperatorInfoType' } & Pick<OperatorInfoType, 'operatorId' | 'operatorName' | 'nocCode'>
  >;
  serviceInfo: { __typename?: 'ServiceInfoType' } & Pick<
    ServiceInfoType,
    'serviceId' | 'serviceName' | 'serviceNumber'
  >;
  previousStopInfo?: Maybe<{ __typename?: 'StopInfoType' } & Pick<StopInfoType, 'stopId' | 'stopName'>>;
};

export type TimingPatternDetail = Maybe<
  Pick<
    TimingPatternDetailType,
    'stopIndex' | 'timingPoint' | 'arrivalTimeOffset' | 'departureTimeOffset' | 'timingPatternId'
  >
>;

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
  constructor(
    private vehicleJourneysSearchService: VehicleJourneysSearchService,
    private vehicleJourneyTimingPatternGQL: VehicleJourneyTimingPatternGQL,
    private timingPatternDetailGQL: TimingPatternDetailGQL
  ) {}

  getVehicleJourneyViewWithNextPrevJourneys(
    journeyId: string,
    startTime: DateTime,
    viewParams: VehicleJourneyViewParams
  ): Observable<{ view: VehicleJourneyView; prevNextJourneys: [VehicleJourney | null, VehicleJourney | null] }> {
    return this.vehicleJourneysSearchService.getJourney(journeyId, startTime, viewParams);
  }

  getTimingPatternForVehicleJourney(vehicleJourneyId: string): Observable<TimingPatternDetail[]> {
    return this.vehicleJourneyTimingPatternGQL.fetch({ vehicleJourneyId }).pipe(
      map(({ data: { vehicleJourney } }) => vehicleJourney?.[0]?.timingPatternId as string),
      switchMap((timingPatternId) =>
        this.timingPatternDetailGQL
          .fetch({ timingPatternId })
          .pipe(
            map(({ data: { timingPatternDetail } }) =>
              sortBy(nonNullishArray(timingPatternDetail), (stop) => stop.stopIndex)
            )
          )
      )
    );
  }
}
