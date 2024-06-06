import { Injectable } from '@angular/core';
import { sortBy } from 'lodash-es';
import { map, mergeMap, Observable, switchMap, throwError } from 'rxjs';
import {
  GpsFeedType,
  Maybe,
  OperatorInfoType,
  ServiceInfoType,
  ServicePatternsGQL,
  StopInfoType,
  StopType,
  TimingPatternDetailGQL,
  TimingPatternDetailType,
  VehicleJourneyGQL,
  VehicleJourneyTimingPatternGQL,
} from '../../../generated/graphql';
import { nonNullishArray } from '../../shared/array-operators';
import { VehicleJourneyView, VehicleJourneyViewParams } from './vehicle-journey-view.model';
import {
  VehicleJourney,
  VehicleJourneysSearchService,
} from '../vehicle-journeys-search/vehicle-journeys-search.service';
import { DateTime } from 'luxon';

export type ApolloStopType = Maybe<
  {
    __typename?: 'StopType' | undefined;
  } & Pick<StopType, 'lat' | 'lon' | 'stopId' | 'stopName'>
>;

export type ApolloGpsFeedType = Pick<
  GpsFeedType,
  | 'ts'
  | 'lat'
  | 'lon'
  | 'vehicleId'
  | 'vehicleJourneyId'
  | 'servicePatternId'
  | 'delay'
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
    private servicePatternsGQL: ServicePatternsGQL,
    private vehicleJourneyGQL: VehicleJourneyGQL,
    private vehicleJourneysSearchService: VehicleJourneysSearchService,
    private vehicleJourneyTimingPatternGQL: VehicleJourneyTimingPatternGQL,
    private timingPatternDetailGQL: TimingPatternDetailGQL
  ) {}

  getVehicleJourneyView(
    journeyId: string,
    startTime: DateTime,
    viewParams: VehicleJourneyViewParams
  ): Observable<VehicleJourneyView> {
    return this.getVehicleJourney(journeyId, startTime).pipe(
      switchMap((journey: ApolloGpsFeedType[]) => {
        if (journey.length && journey[0].servicePatternId) {
          return this.getStopList([journey[0].servicePatternId], journeyId, startTime).pipe(
            map((stops) => VehicleJourneyView.createView(stops, journey, viewParams))
          );
        } else {
          return throwError(() => new Error('Journey not found'));
        }
      })
    );
  }

  getStopList(servicePatternIds: string[], journeyId: string, startTime: DateTime): Observable<StopDetails[]> {
    return this.servicePatternsGQL.fetch({ servicePatternIds }).pipe(
      map(({ data }) => data?.servicePatternsInfo?.[0]?.stops || []),
      switchMap((stops) =>
        this.getTimingPatternForVehicleJourney(journeyId).pipe(
          map((timingPattern) =>
            timingPattern.map((pattern, index) => {
              return { ...pattern, ...stops[index], startTime: startTime };
            })
          )
        )
      )
    );
  }

  getVehicleJourney(journeyId: string, startTime: DateTime): Observable<ApolloGpsFeedType[]> {
    return this.vehicleJourneyGQL
      .fetch({ journeyId, startTime: startTime.toUTC().toISO() }, { fetchPolicy: 'no-cache' })
      .pipe(
        map(({ data }) => {
          // Sort GPS pings by timestamp
          return sortBy(nonNullishArray(data?.vehicleReplay?.getJourney), (ping: ApolloGpsFeedType) => ping.ts);
        })
      );
  }

  getVehicleJourneyViewWithNextPrevJourneys(
    journeyId: string,
    startTime: DateTime,
    viewParams: VehicleJourneyViewParams
  ): Observable<{ view: VehicleJourneyView; prevNextJourneys: [VehicleJourney | null, VehicleJourney | null] }> {
    return this.getVehicleJourneyView(journeyId, startTime, viewParams).pipe(
      mergeMap((view) =>
        this.vehicleJourneysSearchService
          .fetchNextPrevJourneys(startTime, view.journeyInfo.serviceInfo?.serviceId as string, journeyId)
          .pipe(map((prevNextJourneys) => ({ view, prevNextJourneys })))
      )
    );
  }

  getTimingPatternForVehicleJourney(vehicleJourneyId: string): Observable<TimingPatternDetail[]> {
    return this.vehicleJourneyTimingPatternGQL.fetch({ vehicleJourneyId }).pipe(
      map(({ data: { vehicleJourney } }) => vehicleJourney[0]?.timingPatternId as string),
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
