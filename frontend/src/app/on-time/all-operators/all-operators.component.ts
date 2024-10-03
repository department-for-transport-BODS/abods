import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { PerformanceParams, PunctualityOverview } from '../on-time.service';
import { Headway } from '../headway.service';
import { PerformanceService } from '../performance.service';
import { MultiselectCheckboxOption } from '../../shared/gds/multiselect-checkbox/multiselect-checkbox.component';
import { AdminAreaService } from '../admin-area/admin-area.service';
import { nonNullishArray } from '../../shared/array-operators';

@Component({
  templateUrl: 'all-operators.component.html',
  styleUrls: ['./all-operators.component.scss'],
})
export class AllOperatorsComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  params$ = new ReplaySubject<PerformanceParams>();

  overview?: PunctualityOverview;
  headwayOverview?: Headway;
  overviewLoading = true;

  adminAreas = this.adminAreaService
    .fetchAdminAreas()
    .pipe(map((areas) => areas.map((area) => <MultiselectCheckboxOption>{ label: area.name, value: area.id })));

  constructor(private performanceService: PerformanceService, private adminAreaService: AdminAreaService) {}

  nonNullishArray = nonNullishArray;

  ngOnInit() {
    this.params$
      .pipe(
        tap(() => {
          this.overview = undefined;
          this.overviewLoading = true;
        }),
        switchMap((params: PerformanceParams) => this.performanceService.fetchOverviewStats(params)),
        takeUntil(this.destroy$)
      )
      .subscribe(({ onTime, headway }) => {
        this.overview = onTime;
        this.headwayOverview = headway;
        this.overviewLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
