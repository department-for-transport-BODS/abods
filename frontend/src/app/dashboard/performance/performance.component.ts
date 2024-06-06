import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { Subject } from 'rxjs';
import { delay, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Period, Preset } from '../../shared/components/date-range/date-range.types';
import { DateRangeService, WindowDatetimes } from '../../shared/services/date-range.service';
import { PerformanceFiltersInputType, RankingOrder, ServicePunctualityType } from '../../../generated/graphql';
import { DashboardService } from '../dashboard.service';
import { PerformanceCategories } from '../dashboard.types';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss'],
})
export class PerformanceComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() operators?: { nocCode?: string | null; operatorId?: string | null; name?: string | null }[] | null;
  @Input() filters!: BehaviorSubject<PerformanceFiltersInputType>;
  @Input() nocCode: string | null = null;

  constructor(private service: DashboardService, private dateRange: DateRangeService) {}

  fromTo: WindowDatetimes | null = null;
  fromToSubject = new Subject<WindowDatetimes>();

  period: Period = Period.Last7;
  rankingOrderSubject = new Subject<RankingOrder>();
  services: ServicePunctualityType[] = [];

  servicesLoaded = false;

  stats:
    | {
        [key in PerformanceCategories]: number;
      }
    | null = null;
  loaded = false;
  errored = false;

  get hasData() {
    return this.stats !== null;
  }

  private onDestroy$ = new Subject<void>();

  ngOnInit(): void {
    combineLatest([this.filters, this.fromToSubject])
      .pipe(
        switchMap(([filters, { from, to }]) => this.service.getPunctualityStats(filters, from, to)),
        map((stats) => {
          if (stats?.success && !stats?.result?.early && !stats?.result?.late && !stats?.result?.onTime) {
            // To prevent a divide by zero error later
            return { success: true, result: null };
          }
          return stats;
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe((stats) => {
        this.loaded = true;
        this.errored = !stats?.success;
        this.stats = stats?.result;
      });

    combineLatest([this.filters, this.fromToSubject, this.rankingOrderSubject])
      .pipe(
        tap(() => (this.servicesLoaded = false)),
        switchMap(([filters, { from, to, trendFrom, trendTo }, order]) =>
          this.service.getServiceRanking(filters, from, to, order, trendFrom, trendTo)
        ),
        takeUntil(this.onDestroy$)
      )
      .subscribe((rankings) => {
        this.services = (rankings as ServicePunctualityType[]) ?? [];
        this.servicesLoaded = true;
      });

    this.fromToSubject.pipe(delay(0), takeUntil(this.onDestroy$)).subscribe((fromTo) => (this.fromTo = fromTo));
  }

  ngAfterViewInit(): void {
    this.fromToSubject.next(this.dateRange.calculatePresetPeriod(Preset.Last7, DateTime.local()));
    this.rankingOrderSubject.next(RankingOrder.Descending);
  }

  ngOnDestroy(): void {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  changePeriod(event: Event) {
    this.period = ((event.target as HTMLInputElement).value as Period) ?? Period.Last7;

    const now: DateTime = DateTime.local();

    return this.fromToSubject.next(this.dateRange.calculatePresetPeriod(this.period, now));
  }

  changeOrder(order: RankingOrder) {
    this.rankingOrderSubject.next(order);
  }
}
