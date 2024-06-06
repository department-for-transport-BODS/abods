import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, share, takeUntil } from 'rxjs/operators';
import {
  OperatorDashboardFragment,
  OperatorDashboardVehicleCountsFragment,
  PerformanceFiltersInputType,
} from '../../generated/graphql';
import { DashboardService } from './dashboard.service';
import orderBy from 'lodash-es/orderBy';
import take from 'lodash-es/take';

type TimingPointsOption = 'timing-points' | 'all-stops';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  subs: Subscription[] = [];

  allOperatorsSubject = new Subject<OperatorDashboardFragment[]>();

  nocCodeSubject = new Subject<string | null>();
  nocCode: string | null = null;

  operatorSubject = new BehaviorSubject<OperatorDashboardFragment | { nocCode: 'all' }>({ nocCode: 'all' });

  selectedOperatorsSubject = new Subject<OperatorDashboardFragment[]>();
  selectedOperatorsVehicleCountsSubject = new Subject<OperatorDashboardVehicleCountsFragment[]>();

  private currentVehicles$: Observable<number> = this.selectedOperatorsVehicleCountsSubject.pipe(
    map((allOperators) => allOperators.reduce((v, op) => v + (op?.feedMonitoring.liveStats?.currentVehicles ?? 0), 0))
  );
  currentVehicles = 0;

  private expectedVehicles$: Observable<number> = this.selectedOperatorsVehicleCountsSubject.pipe(
    map((allOperators) => allOperators.reduce((v, op) => v + (op?.feedMonitoring.liveStats?.expectedVehicles ?? 0), 0))
  );
  expectedVehicles = 0;

  private feedStatusOperators$: Observable<OperatorDashboardFragment[]> = this.selectedOperatorsSubject.pipe(
    map((selectedOperators) =>
      take(
        orderBy(
          selectedOperators,
          [
            (op) => op?.feedMonitoring?.feedStatus,
            (op) => op?.feedMonitoring?.liveStats?.feedErrors,
            (op) => op?.feedMonitoring?.liveStats?.feedAlerts,
          ],
          ['asc', 'desc', 'desc']
        ),
        5
      )
    )
  );
  feedStatusOperators: OperatorDashboardFragment[] = [];

  timingPointsOption: TimingPointsOption = 'timing-points';

  performanceFilters$ = new BehaviorSubject<PerformanceFiltersInputType>({});

  constructor(private service: DashboardService, private route: ActivatedRoute, private router: Router) {}

  private onDestroy$ = new Subject<void>();

  ngOnInit(): void {
    this.currentVehicles$.pipe(takeUntil(this.onDestroy$)).subscribe((cv) => (this.currentVehicles = cv));
    this.expectedVehicles$.pipe(takeUntil(this.onDestroy$)).subscribe((ev) => (this.expectedVehicles = ev));
    this.feedStatusOperators$.pipe(takeUntil(this.onDestroy$)).subscribe((fsos) => (this.feedStatusOperators = fsos));
    this.nocCodeSubject.pipe(takeUntil(this.onDestroy$)).subscribe((nocCode) => (this.nocCode = nocCode));

    combineLatest([this.nocCodeSubject, this.allOperatorsSubject])
      .pipe(
        filter(([_, ops]) => ops && ops.length > 0),
        takeUntil(this.onDestroy$)
      )
      .subscribe(([latestNocCode, ops]) => {
        if (latestNocCode) {
          const operator = ops.find(({ nocCode }) => nocCode === latestNocCode);
          if (operator) {
            this.operatorSubject.next(operator);
            this.selectedOperatorsSubject.next([operator]);
          } else {
            this.router.navigate(['.'], {
              queryParams: { nocCode: null },
              queryParamsHandling: 'merge',
            });
          }
        } else {
          this.operatorSubject.next({ nocCode: 'all' });
          this.selectedOperatorsSubject.next(ops);
        }
      }),
      this.service.listOperators.subscribe((ops) => {
        this.allOperatorsSubject.next(ops);
        if (ops.length === 1) {
          this.nocCodeSubject.next(ops[0].nocCode as string);
        }
      });

    combineLatest([this.nocCodeSubject, this.service.listOperatorVehicleCounts.pipe(share())])
      .pipe(
        map(([latestNocCode, ops]) => {
          if (latestNocCode) {
            const operator = ops.find(({ nocCode }) => nocCode === latestNocCode);
            if (operator) {
              return [operator];
            } else return [];
          }
          return ops;
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe(this.selectedOperatorsVehicleCountsSubject);

    const nocCode$ = this.route.queryParamMap.pipe(
      map((pm) => pm.get('nocCode') as string),
      distinctUntilChanged()
    );

    const allStops$ = this.route.queryParamMap.pipe(map((queryParamMap) => queryParamMap.get('allStops') === 'true'));

    nocCode$.pipe(takeUntil(this.onDestroy$)).subscribe((nocCode) => {
      this.nocCodeSubject.next(nocCode);
    });

    combineLatest([this.operatorSubject, allStops$])
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(([operator, allStops]) => {
        operator = operator as OperatorDashboardFragment;
        this.timingPointsOption = allStops ? 'all-stops' : 'timing-points';
        this.performanceFilters$.next({
          timingPointsOnly: allStops ? undefined : true,
          operatorIds: operator.operatorId && operator.operatorId !== 'all' ? [operator.operatorId] : undefined,
        });
      });
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  changeOperator({ nocCode }: { nocCode: string; name?: string }) {
    this.router.navigate(['.'], {
      queryParams: { nocCode: nocCode === 'all' ? null : nocCode },
      queryParamsHandling: 'merge',
    });
  }

  onTimingPointsToggleChange() {
    const allStops = this.timingPointsOption === 'all-stops' ? true : null;
    this.router.navigate([], { queryParams: { allStops }, queryParamsHandling: 'merge' });
  }
}
