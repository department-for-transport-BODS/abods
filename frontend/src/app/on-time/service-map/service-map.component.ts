import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Feature, FeatureCollection, LineString, Point, Position } from 'geojson';
import { featureCollection, lineString, point } from '@turf/helpers';
import bbox from '@turf/bbox';
import { BBox2d } from '@turf/helpers/dist/js/lib/geojson';
import { TransitModelService } from '../transit-model.service';
import { PerformanceInputType, ServiceLinkType, StopType } from '../../../generated/graphql';
import { combineLatest, ReplaySubject, Subject } from 'rxjs';
import { tap, map, switchMap, takeUntil } from 'rxjs/operators';
import { EventData, LngLatLike, Map, MapboxGeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { OnTimeService, PerformanceParams } from '../on-time.service';
import { StopPerformanceService } from '../stop-performance.service';
import { BRITISH_ISLES_BBOX, position } from '../../shared/geo';
import { removeAdminAreaIds } from '../view-service/view-service.component';
import { ConfigService } from '../../config/config.service';
import { pairwise } from 'src/app/shared/array-operators';

export type Stop = { naptan: string; stopName: string; stopLocality?: string };

export interface StopInfo {
  type: 'stop';
  position: LngLatLike;
  stop: Stop;
}

export type PopupInfo = StopInfo;

@Component({
  selector: 'app-service-map',
  templateUrl: 'service-map.component.html',
  styleUrls: ['./service-map.component.scss'],
})
export class ServiceMapComponent implements OnInit, OnDestroy {
  @Input()
  set params(value: PerformanceParams | null) {
    if (value?.filters?.lineIds) {
      this.params$.next(value as PerformanceInputType);
    }
  }
  @Input() timingPointsOnly = false;
  private params$ = new ReplaySubject<PerformanceInputType>(1);

  isNoData = ['get', 'noData'];
  onTimePercentage = ['/', ['*', ['get', 'onTime'], 100], ['get', 'actualDepartures']];

  servicePatterns?: FeatureCollection<LineString>;
  stops?: FeatureCollection<Point>;
  bounds: BBox2d = BRITISH_ISLES_BBOX;
  popupInfo?: PopupInfo;
  map!: Map;
  isLoading = false;
  errored = false;

  // Angular doesn't recognise discriminated unions with fullTemplateTypeCheck on :sadface:
  get stopInfo(): StopInfo | undefined {
    return this.popupInfo?.type === 'stop' ? this.popupInfo : undefined;
  }

  get mapboxStyle(): string {
    return this.config.mapboxStyle;
  }

  private destroy$ = new Subject<void>();

  constructor(
    private transitModelService: TransitModelService,
    private onTimeService: OnTimeService,
    private stopPerformanceService: StopPerformanceService,
    private config: ConfigService
  ) {}

  ngOnInit() {
    this.params$
      .pipe(
        tap(() => {
          this.isLoading = true;
        }),
        map((params) => removeAdminAreaIds(params as PerformanceParams)),
        switchMap((params) =>
          combineLatest([
            this.onTimeService.fetchStopPerformanceList(params),
            this.transitModelService.fetchServicePatternStops(
              params.filters?.operatorIds ? params.filters.operatorIds[0] : null,
              params.filters?.lineIds ? params.filters.lineIds[0] : null
            ),
          ])
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ([stopPerformance, servicePatterns]) => {
          const features: Feature<LineString>[] = [];
          //ABOD-883 filtering out the synthetic stops positioned in the middle of the sea
          const syntheticStopFilter = {
            lat: 51,
            lon: -6.5,
          };
          servicePatterns.map(({ servicePatternId, stops, serviceLinks }) => {
            stops = stops.filter((stop) => stop.lat >= syntheticStopFilter.lat && stop.lon >= syntheticStopFilter.lon);
            return pairwise(stops).map((segment) => {
              const line = this.setCoordinates(segment, serviceLinks, features);
              if (line) {
                features.push(
                  lineString(line, {
                    servicePatternId,
                    segmentId: segment[0].stopId + segment[1].stopId,
                    dashedLine: line.length <= 2,
                  })
                );
              }
            });
          });
          this.servicePatterns = featureCollection(features);
          this.bounds = bbox(this.servicePatterns) as BBox2d;
          const stopData = this.stopPerformanceService.mergeStops(stopPerformance, servicePatterns);

          this.stops = featureCollection(
            stopData
              .filter((stop) => stop.lat >= syntheticStopFilter.lat && stop.lon >= syntheticStopFilter.lon)
              .map((stop) => point(position(stop), stop))
          );
          this.isLoading = false;
        },
        error: () => (this.errored = true),
      });
  }

  setCoordinates(
    segment: StopType[],
    serviceLinks: ServiceLinkType[],
    features: Feature<LineString>[]
  ): Position[] | undefined {
    const serviceLink = serviceLinks.find(
      (serviceLink) => serviceLink.fromStop === segment[0].stopId && serviceLink.toStop === segment[1].stopId
    );
    if (serviceLink?.routeValidity === 'VALID') {
      return JSON.parse(serviceLink.linkRoute as string);
    } else if (!features.find((feature) => feature.properties?.segmentId === segment[0].stopId + segment[1].stopId)) {
      return [position(segment[0]), position(segment[1])];
    }
    return;
  }

  ngOnDestroy() {
    this.params$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  setHoveredStop(event: MapMouseEvent & { features?: MapboxGeoJSONFeature[] } & EventData) {
    const pos = (event.features?.[0].geometry as Point).coordinates as [number, number];
    const props = event.features?.[0].properties;
    if (props) {
      this.popupInfo = {
        type: 'stop',
        position: pos,
        stop: { naptan: props.naptan, stopName: props.stopName, stopLocality: props.stopLocality },
      };
    }
  }

  clearHoveredStop() {
    this.popupInfo = undefined;
  }
}
