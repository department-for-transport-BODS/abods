import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest, of, ReplaySubject, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { FrequentServiceInfoType, ServiceInfoType } from 'src/generated/graphql';
import { OnTimeService, PerformanceParams, PunctualityOverview } from '../on-time.service';
import { Headway, HeadwayService } from '../headway.service';
import { TabsComponent } from '../../shared/components/tabs/tabs.component';
import { TabComponent } from '../../shared/components/tabs/tab/tab.component';
import { PerformanceService } from '../performance.service';
import { nonNullOrUndefined } from '../../shared/rxjs-operators';
import { Operator, OperatorService } from '../../shared/services/operator.service';
import { cloneDeep } from 'lodash-es';

export const removeAdminAreaIds = (params: PerformanceParams) => {
  const paramsWithoutAdminAreas = cloneDeep(params);
  delete paramsWithoutAdminAreas.filters?.adminAreaIds;
  return paramsWithoutAdminAreas;
};

@Component({
  templateUrl: 'view-service.component.html',
  styleUrls: ['../on-time.component.scss'],
})
export class ViewServiceComponent implements OnInit, OnDestroy {
  allOperators: Operator[] = [];
  operator?: Operator;
  singleOperator = false;
  service: ServiceInfoType | null = null;
  lineNotFound = false;

  destroy$ = new Subject<void>();
  params$ = new ReplaySubject<PerformanceParams>();

  overview?: PunctualityOverview;
  headwayOverview?: Headway;
  overviewLoading = true;

  frequentServiceInfo?: FrequentServiceInfoType;
  frequentServiceInfoLoading = false;

  overviewMode: 'on-time-performance' | 'excess-wait-time' = 'on-time-performance';

  @ViewChild(TabsComponent) tabs?: TabsComponent;
  @ViewChild('mapTab') mapTab?: TabComponent;

  get noData() {
    return !!this.overview && this.overview.completed === 0;
  }

  get dataExpected() {
    return !!this.overview && this.overview.scheduled > 0;
  }

  timingPointsOnly = false;
  minMaxDelay = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private operatorService: OperatorService,
    private onTimeService: OnTimeService,
    private headwayService: HeadwayService,
    private performanceService: PerformanceService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const paramMap$ = this.route.paramMap;
    const queryParamMap$ = this.route.queryParamMap;

    this.params$
      .pipe(
        tap((params) => {
          this.overview = undefined;
          this.overviewLoading = true;
          this.timingPointsOnly = params.filters.timingPointsOnly ?? false;
          this.minMaxDelay = !!params.filters.minDelay || !!params.filters.maxDelay;
        }),
        map((params) => removeAdminAreaIds(params)),
        switchMap((params: PerformanceParams) => this.performanceService.fetchOverviewStats(params)),
        takeUntil(this.destroy$)
      )
      .subscribe(({ onTime, headway }) => {
        this.overview = onTime;
        this.headwayOverview = headway;
        this.overviewLoading = false;
      });

    paramMap$
      .pipe(
        filter((paramMap) => paramMap.has('nocCode')),
        map((paramMap) => paramMap.get('nocCode') as string),
        switchMap((nocCode) => this.operatorService.fetchOperator(nocCode)),
        takeUntil(this.destroy$)
      )
      .subscribe((operator) => {
        this.operator = operator;
      });

    this.operatorService.fetchOperators().subscribe((operators) => {
      this.allOperators = operators;
      this.singleOperator = operators.length === 1;
    });

    paramMap$
      .pipe(
        map((paramMap) => paramMap.get('lineId')),
        tap(() => {
          this.lineNotFound = false;
          this.changeDetectorRef.detectChanges();
        }),
        nonNullOrUndefined(),
        distinctUntilChanged(),
        switchMap((lineId) => this.onTimeService.fetchServiceInfo(lineId)),
        catchError(() => of(null)),
        withLatestFrom(queryParamMap$),
        takeUntil(this.destroy$)
      )
      .subscribe(([service, queryParamMap]) => {
        this.service = service;
        if (!service) {
          this.lineNotFound = true;
        }
        if (!queryParamMap.has('tab')) this.tabs?.openTab('map', { emit: false });
      });

    const overviewMode$ = queryParamMap$.pipe(
      filter(
        (paramMap) =>
          (paramMap.has('overview') && paramMap.get('overview') === 'on-time-performance') ||
          paramMap.get('overview') === 'excess-wait-time'
      ),
      map((paramMap) => paramMap.get('overview') as 'on-time-performance' | 'excess-wait-time')
    );

    const frequent$ = this.params$.pipe(
      filter((params) => !!params.filters.lineIds?.[0]),
      distinctUntilChanged(),
      tap(() => (this.frequentServiceInfoLoading = true)),
      switchMap((params) => this.headwayService.fetchFrequentServiceInfo(params)),
      tap(() => (this.frequentServiceInfoLoading = false)),
      shareReplay(1)
    );

    frequent$.pipe(takeUntil(this.destroy$)).subscribe((frequentServiceInfo) => {
      this.frequentServiceInfo = frequentServiceInfo;
      if (frequentServiceInfo.numHours === 0) this.overviewMode = 'on-time-performance';
    });

    combineLatest([frequent$, overviewMode$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([frequentServiceInfo, overviewMode]) => {
        if (frequentServiceInfo.numHours === 0) {
          this.overviewMode = 'on-time-performance';
        } else {
          this.overviewMode = overviewMode;
        }
      });

    queryParamMap$
      .pipe(
        filter((paramMap) => paramMap.has('tab')),
        map((paramMap) => paramMap.get('tab') as string)
      )
      .subscribe((tab) => {
        this.tabs?.openTab(tab, { emit: false });
      });

    queryParamMap$
      .pipe(
        filter(
          (paramMap) =>
            paramMap.has('overview') &&
            paramMap.get('overview') !== 'on-time-performance' &&
            paramMap.get('overview') !== 'excess-wait-time'
        )
      )
      .subscribe(() =>
        this.router.navigate([], { queryParams: { overview: undefined }, queryParamsHandling: 'merge' })
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeOperator(operator: { name?: string | null; nocCode: string }) {
    this.router.navigate(['/on-time', operator.nocCode], { queryParamsHandling: 'preserve' });
  }

  tabChanged(tab: TabComponent) {
    this.router.navigate([], { queryParams: { tab: tab.id }, queryParamsHandling: 'merge' });
  }

  overviewModeChanged(overview: string) {
    this.router.navigate([], { queryParams: { overview }, queryParamsHandling: 'merge' });
  }

  get allServicesQueryParams() {
    const ret: Params = { overview: null };
    if (this.mapTab?.active) ret.tab = null;
    return ret;
  }
}
