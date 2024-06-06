import { Injectable } from '@angular/core';
import {
  CorridorGranularity,
  CorridorJourneyTimeStatsType,
  CorridorsListGQL,
  CorridorsStopSearchGQL,
  CorridorsSubsequentStopsGQL,
  CorridorStatsDayOfWeekType,
  CorridorStatsGQL,
  CorridorStatsInputType,
  CorridorStatsTimeOfDayType,
  CorridorStatsType,
  CorridorType,
  CorridorUpdateInputType,
  CreateCorridorGQL,
  DeleteCorridorGQL,
  GetCorridorGQL,
  ICorridorJourneyTimeStats,
  ServiceLinkType,
  StopInfoType,
  StopType,
  UpdateCorridorGQL,
} from '../../generated/graphql';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { assertNonNullish } from '../shared/rxjs-operators';
import { FeatureCollection, Point } from 'geojson';
import { featureCollection, point } from '@turf/helpers';
import { position } from '../shared/geo';
import { DateTime, Duration, Interval } from 'luxon';
import {
  keyBy as _keyBy,
  max as _max,
  mergeWith as _mergeWith,
  min as _min,
  range as _range,
  sortBy as _sortBy,
  values as _values,
} from 'lodash-es';
import { HistogramChartDataItem } from './view/histogram-chart/histogram-chart.component';
import { BoxPlotChartDataItem } from './view/box-plot-chart/box-plot-chart.component';
import { Definitely, nonNullishArray } from '../shared/array-operators';
import { LngLatBounds } from 'mapbox-gl';
import { OperatorService } from '../shared/services/operator.service';

export type Stop = Pick<StopType, 'stopId' | 'stopName' | 'lon' | 'lat' | 'localityName' | 'adminAreaId'> & {
  naptan: string;
  intId: number;
};

export type CorridorSummary = Definitely<Pick<CorridorType, 'id' | 'name'>> & { numStops: number };

export type Corridor = Pick<CorridorType, 'id' | 'name'> & { stops: Stop[] };

export type CorridorStats = Pick<Definitely<CorridorStatsType>, 'summaryStats' | 'journeyTimePerServiceStats'> & {
  journeyTimeTimeOfDayStats: (CorridorStatsTimeOfDayType & BoxPlotChartDataItem)[];
  journeyTimeDayOfWeekStats: (CorridorStatsDayOfWeekType & BoxPlotChartDataItem)[];
  journeyTimeHistogram: HistogramChartDataItem[];
  journeyTimeStats: (CorridorJourneyTimeStatsType & BoxPlotChartDataItem)[];
  serviceLinks: ServiceLinkType[];
};

export type CorridorStatsParams = Pick<
  CorridorStatsInputType,
  'corridorId' | 'fromTimestamp' | 'toTimestamp' | 'stopList'
> &
  Definitely<Pick<CorridorStatsInputType, 'granularity'>>;

export interface CorridorStatsViewParams {
  corridorId: string;
  from: DateTime;
  to: DateTime;
  granularity: CorridorGranularity;
  stops: Stop[];
}

let uniqueId = 0;

function isStopLocation(
  obj: Pick<StopType, 'lon' | 'lat'> | Pick<StopInfoType, 'stopLocation'>
): obj is Pick<StopInfoType, 'stopLocation'> {
  return Object.prototype.hasOwnProperty.call(obj, 'stopLocation');
}
const toStop: (stop: StopType | StopInfoType) => Stop = ({ __typename, stopId, stopName, ...stop }) => ({
  stopId,
  stopName,
  ...(isStopLocation(stop) ? { lon: stop.stopLocation.longitude, lat: stop.stopLocation.latitude } : stop),
  naptan: stopId.substring(2),
  intId: ++uniqueId,
});

export const asGeoJsonPoints: (stops: Stop[]) => FeatureCollection<Point, Stop> = (stops) =>
  featureCollection(stops.map((stop) => point(position(stop), stop, { id: stop.intId })));

function* timeSeriesRange(interval: Interval, granularity: CorridorGranularity) {
  let cursor = interval.start;
  while (cursor <= interval.end) {
    yield cursor;
    cursor = cursor.plus({ [granularity]: 1 });
  }
}

export const fillGaps = <T, U, K extends keyof T>(
  key: K,
  data: T[],
  defaultRange: T[K][],
  formatter: (n: T[K]) => U = () => ({} as U),
  sortKey?: keyof U
): (T & U)[] => {
  const defaults = defaultRange.map((n) => ({ [key]: n }));
  const completeData = _values(_mergeWith(_keyBy(defaults, key), _keyBy(nonNullishArray(data), key))).map((item) => ({
    ...item,
    ...formatter(item[key]),
  }));
  return sortKey ? _sortBy(completeData, sortKey) : completeData;
};

const formatMinuteSeconds = (minute: number) => Duration.fromObject({ minute }).toFormat('m:ss');
const formatDuration = (minute: number) => {
  const min = Duration.fromObject({ minute });
  return `${min.toFormat('m:ss')} - ${min.plus({ seconds: 59 }).toFormat('m:ss')}`;
};
const formatDayOfWeekShort = (weekday: number) => DateTime.fromObject({ weekday }).toFormat('ccc');
const formatDayOfWeek = (weekday: number) => DateTime.fromObject({ weekday }).toFormat('cccc');
const isoDayOfWeek = (dow: number) => (dow === 0 ? 7 : dow);

const addBoxPlotChartDataItems = (stat: ICorridorJourneyTimeStats & BoxPlotChartDataItem) => {
  stat.yAxisMaxValue = stat.maxTransitTime;
  stat.yAxisMinValue = stat.minTransitTime;
  stat.yAxisMeanValue = stat.avgTransitTime;
};

export const filterServiceLinksByStopsOrReturnServiceLinks = (
  serviceLinks: ServiceLinkType[] = [],
  stops: Stop[] = []
): ServiceLinkType[] => {
  if (stops.length) {
    const filtered = filterServiceLinksByStops(serviceLinks, stops);
    return filtered.length === 0 ? serviceLinks : filtered;
  }
  return serviceLinks;
};

export const filterServiceLinksByStops = (
  serviceLinks: ServiceLinkType[] = [],
  stops: Stop[] = []
): ServiceLinkType[] =>
  serviceLinks.filter(
    (links) =>
      stops.find((stop) => stop.stopId === links.fromStop) && stops.find((stop) => stop.stopId === links.toStop)
  );

export interface StopLists {
  orgStops: Stop[];
  nonOrgStops: Stop[];
}

@Injectable({ providedIn: 'root' })
export class CorridorsService {
  constructor(
    private corridorsStopSearchQuery: CorridorsStopSearchGQL,
    private corridorsSubsequentStopsQuery: CorridorsSubsequentStopsGQL,
    private corridorsListQuery: CorridorsListGQL,
    private getCorridorGQL: GetCorridorGQL,
    private corridorStatsQuery: CorridorStatsGQL,
    private createCorridorMutation: CreateCorridorGQL,
    private deleteCorridorMutation: DeleteCorridorGQL,
    private operatorService: OperatorService,
    private updateCorridorGQL: UpdateCorridorGQL
  ) {}

  queryStops(searchString?: string, bounds?: LngLatBounds): Observable<StopLists> {
    return this.operatorService.fetchAdminAreaIds().pipe(
      switchMap((adminAreaIds) => {
        return this.corridorsStopSearchQuery
          .fetch(
            {
              inputs: {
                searchString,
                boundingBox: bounds && {
                  minLongitude: bounds.getWest(),
                  minLatitude: bounds.getSouth(),
                  maxLongitude: bounds.getEast(),
                  maxLatitude: bounds.getNorth(),
                },
              },
            },
            { fetchPolicy: 'no-cache' }
          )
          .pipe(
            map((result) => {
              const allStops = nonNullishArray(result?.data?.corridor.addFirstStop).map(toStop);
              const orgStops = allStops.filter((stop) => adminAreaIds.some((id) => id === stop.adminAreaId));
              const nonOrgStops = allStops.filter((stop) => adminAreaIds.every((id) => id !== stop.adminAreaId));
              return {
                orgStops: orgStops,
                nonOrgStops: nonOrgStops,
              };
            })
          );
      })
    );
  }

  fetchSubsequentStops(stopList: string[]): Observable<Stop[]> {
    return this.corridorsSubsequentStopsQuery
      .fetch({ stopList }, { fetchPolicy: 'no-cache' })
      .pipe(map((result) => nonNullishArray(result?.data?.corridor.addSubsequentStops).map(toStop)));
  }

  fetchCorridors(): Observable<CorridorSummary[]> {
    return this.corridorsListQuery.fetch(undefined, { fetchPolicy: 'no-cache' }).pipe(
      map((result) =>
        nonNullishArray(result.data?.corridor.corridorList).map(({ stops, ...corridor }) => ({
          ...corridor,
          numStops: nonNullishArray(stops).length,
        }))
      )
    );
  }

  fetchCorridorById(corridorId: number): Observable<Corridor> {
    return this.getCorridorGQL.fetch({ corridorId }, { fetchPolicy: 'no-cache' }).pipe(
      map((result) => {
        if (result.errors && result.errors.length > 0) {
          throw result.errors[0].message;
        }
        return result.data?.corridor.getCorridor;
      }),
      assertNonNullish(),
      map(({ stops, ...corridor }) => ({ stops: nonNullishArray(stops).map(toStop), ...corridor }))
    );
  }

  fetchStats(params: CorridorStatsViewParams): Observable<CorridorStats> {
    const { corridorId, from, to, granularity, stops } = params;
    return this.corridorStatsQuery
      .fetch({
        params: {
          corridorId,
          fromTimestamp: from.toISO(),
          toTimestamp: to.toISO(),
          granularity,
          stopList: stops.map((stop) => stop.stopId),
        },
      })
      .pipe(
        map((result) => result.data?.corridor.stats),
        assertNonNullish(),
        map((stats) => this.convertStats(stats, params)),
        map((stats) => this.addBoxPlotData(stats))
      );
  }

  convertStats(stats: CorridorStatsType, params: CorridorStatsViewParams): CorridorStats {
    const timeSeries = nonNullishArray(stats.journeyTimeStats);
    const dayOfWeek = nonNullishArray(stats.journeyTimeDayOfWeekStats);
    const timeOfDay = nonNullishArray(stats.journeyTimeTimeOfDayStats);
    const histogram = nonNullishArray(nonNullishArray(stats.journeyTimeHistogram)?.[0]?.hist);
    const histBins = histogram.map((h) => h.bin);
    const histRange = _range(_min(histBins) ?? 0, (_max(histBins) ?? 0) + 2);

    return {
      summaryStats: stats.summaryStats ?? {},
      journeyTimeStats: fillGaps(
        'ts',
        timeSeries,
        Array.from(
          timeSeriesRange(Interval.fromDateTimes(params.from, params.to), params.granularity)
        ).map((dateTime) => dateTime.toISO({ suppressMilliseconds: true }).replace('Z', '+00:00'))
      ),
      journeyTimePerServiceStats: nonNullishArray(stats.journeyTimePerServiceStats),
      journeyTimeDayOfWeekStats: fillGaps(
        'dow',
        dayOfWeek,
        _range(0, 7),
        (dow) => ({
          category: formatDayOfWeekShort(isoDayOfWeek(dow)),
          binLabel: formatDayOfWeek(isoDayOfWeek(dow)),
          isoDayOfWeek: isoDayOfWeek(dow),
        }),
        'isoDayOfWeek'
      ),
      journeyTimeTimeOfDayStats: fillGaps('hour', timeOfDay, _range(0, 25), (hour) => {
        /**
         * This deliberately styles midnight at the start of the day as '00:00' and midnight
         * at the end the day as '24:00' so that amCharts can distinguish the 2 categories
         */
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        return {
          category: startTime,
          binLabel: `${startTime} - ${endTime}`,
        };
      }),
      journeyTimeHistogram: fillGaps('bin', histogram, histRange, (bin) => ({
        xAxisCategory: formatMinuteSeconds(Number(bin)),
        xAxisLabel: formatDuration(Number(bin)),
      })),
      serviceLinks: (stats.serviceLinks as ServiceLinkType[]) ?? [],
    };
  }

  createCorridor(name: string, stopIds: string[]): Observable<void> {
    return this.createCorridorMutation.mutate({ name, stopIds }).pipe(
      map((result) => {
        if (!result.data?.createCorridor.success) {
          throw result.data?.createCorridor.error ?? result.errors?.map((err) => err.message) ?? 'Unknown error';
        }
      })
    );
  }

  deleteCorridor(corridorId: number): Observable<void> {
    return this.deleteCorridorMutation.mutate({ corridorId }).pipe(
      map((result) => {
        if (!result.data?.deleteCorridor.success) {
          throw result.data?.deleteCorridor.error ?? result.errors?.map((err) => err.message) ?? 'Unknown error';
        }
      })
    );
  }

  updateCorridor(inputs: CorridorUpdateInputType): Observable<void> {
    return this.updateCorridorGQL.mutate({ inputs }).pipe(
      map((result) => {
        if (!result.data?.updateCorridor.success) {
          throw result.data?.updateCorridor.error ?? result.errors?.map((err) => err.message) ?? 'Unknown error';
        }
      })
    );
  }

  private addBoxPlotData(stats: CorridorStats): CorridorStats {
    stats.journeyTimeStats.forEach((stat) => {
      addBoxPlotChartDataItems(stat);
    });
    stats.journeyTimeDayOfWeekStats.forEach((stat) => {
      addBoxPlotChartDataItems(stat);
    });
    stats.journeyTimeTimeOfDayStats.forEach((stat) => {
      addBoxPlotChartDataItems(stat);
    });
    return stats;
  }
}
