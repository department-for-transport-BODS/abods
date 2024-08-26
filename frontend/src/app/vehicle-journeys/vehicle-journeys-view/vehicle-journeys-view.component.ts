import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest, map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { VehicleJourneysViewService } from './vehicle-journeys-view.service';
import { VehicleJourneyView, VehicleJourneyViewParams } from './vehicle-journey-view.model';
import { VehicleJourneyNotFoundView } from './vehicle-journey-not-found-view.model';
import { VehiclePingStop } from './vehicle-ping-stop.model';
import { StopHoverEvent } from './stop-list/stop-item/stop-item.component';
import { VehicleJourney } from '../vehicle-journeys-search/vehicle-journeys-search.service';
import { DateTime } from 'luxon';

type TimingPointsOption = 'timing-points' | 'all-stops';

@Component({
  selector: 'app-vehicle-journeys-view',
  templateUrl: './vehicle-journeys-view.component.html',
  styleUrls: ['./vehicle-journeys-view.component.scss'],
})
export class VehicleJourneysViewComponent implements OnInit, OnDestroy {
  view?: VehicleJourneyView;
  errorView?: VehicleJourneyNotFoundView;
  loading = false;
  timingPointsOption: TimingPointsOption = 'timing-points';
  prevNextJourneys: [VehicleJourney | null, VehicleJourney | null] = [null, null];

  selectedStop?: VehiclePingStop;
  hoveredStop?: StopHoverEvent;

  returnRoute = '/vehicle-journeys';
  returnQueryParams: Params | null = null;

  get journeyTitle(): string {
    return `${this.view?.journeyInfo.serviceInfo?.serviceNumber}: ${this.view?.journeyInfo.serviceInfo?.serviceName}`;
  }

  constructor(
    private route: ActivatedRoute,
    private vehicleJourneysViewService: VehicleJourneysViewService,
    private router: Router
  ) {}

  private onDestroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((queryParams) => ({
          date: DateTime.fromISO(queryParams.get('startTime') as string)
            .startOf('day')
            .toUTC()
            ?.toISO({ format: 'basic', suppressSeconds: true }),
          operator: queryParams.get('operator'),
          service: queryParams.get('service'),
        })),
        takeUntil(this.onDestroy$)
      )
      .subscribe((params) => (this.returnQueryParams = params));

    const journeyId$ = this.route.paramMap.pipe(
      map((paramMap) => paramMap.get('journeyId') as string),
      takeUntil(this.onDestroy$)
    );

    const startTime$ = this.route.queryParamMap.pipe(
      map((queryParamMap) => DateTime.fromISO(queryParamMap.get('startTime') as string)),
      takeUntil(this.onDestroy$)
    );

    const viewParams$ = this.route.queryParamMap.pipe(
      map((queryParamMap) => {
        return <VehicleJourneyViewParams>{
          timingPointsOnly:
            queryParamMap.get('timingPointsOnly') === 'true' || queryParamMap.get('allStops') !== 'true',
        };
      }),
      takeUntil(this.onDestroy$)
    );

    viewParams$.subscribe((viewParams) => {
      this.timingPointsOption = viewParams.timingPointsOnly ? 'timing-points' : 'all-stops';
    });

    combineLatest([journeyId$, startTime$, viewParams$])
      .pipe(
        tap(() => (this.loading = true)),
        switchMap(([journeyId, startTime, viewParams]) =>
          this.vehicleJourneysViewService.getVehicleJourneyViewWithNextPrevJourneys(journeyId, startTime, viewParams)
        ),
        takeUntil(this.onDestroy$)
      )
      .subscribe({
        next: ({ view, prevNextJourneys }) => {
          this.view = view;
          this.prevNextJourneys = prevNextJourneys;
          this.loading = false;
        },
        error: () => (this.errorView = new VehicleJourneyNotFoundView()),
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  onTimingPointsToggleChange() {
    const allStops = this.timingPointsOption === 'all-stops' ? true : null;
    this.router.navigate([], { queryParams: { allStops }, queryParamsHandling: 'merge' });
  }

  onStopSelected(stop: VehiclePingStop) {
    this.selectedStop = stop;
  }

  onStopHovered(stop: StopHoverEvent) {
    this.hoveredStop = stop;
  }
}
