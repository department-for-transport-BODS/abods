import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DateTime } from 'luxon';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { DayOfWeekFlagsInputType, PerformanceFiltersInputType } from 'src/generated/graphql';
import { FormControl } from '@angular/forms';
import { isEqual as _isEqual } from 'lodash-es';
import { PerformanceParams } from '../on-time.service';
import { FiltersComponent } from '../filters/filters.component';
import { DateRangeService } from '../../shared/services/date-range.service';
import { FromToPreset, Period, Preset } from '../../shared/components/date-range/date-range.types';
import { PanelService } from '../../shared/components/panel/panel.service';
import { ifNullOrUndefinedReturnEmptyString } from '../../shared/rxjs-operators';

export type TimingPoints = 'all-stops' | 'timing-points';

@Component({
  selector: 'app-controls',
  templateUrl: 'controls.component.html',
  styleUrls: ['./controls.component.scss'],
})
export class ControlsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() showAdminAreas = true;
  @Input() operatorId: string | null | undefined = '';
  @Output() params = new EventEmitter<PerformanceParams>();

  filtersSubject = new BehaviorSubject<PerformanceFiltersInputType>({});

  dateRange = new FormControl(this.getDateTimeParams(this.route.snapshot.queryParamMap), {
    nonNullable: true,
  });

  onDestroy$ = new Subject<void>();

  @ViewChild(FiltersComponent) filtersComponent?: FiltersComponent;

  // TODO ABOD-350 prefer a form to custom binding
  get timingPointsOption(): TimingPoints {
    return this.filtersSubject.value.timingPointsOnly ? 'timing-points' : 'all-stops';
  }

  set timingPointsOption(timingPointsOption: TimingPoints) {
    const allStops = timingPointsOption === 'all-stops' || null;
    this.router.navigate([], { queryParams: { allStops, timingPointsOnly: null }, queryParamsHandling: 'merge' });
  }

  /** @deprecated this will be removed in ABOD-350 */
  get filters(): PerformanceFiltersInputType {
    return this.filtersSubject.value;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dateRangeService: DateRangeService,
    public panelService: PanelService
  ) {}

  getDateTimeParams(queryParams: ParamMap): FromToPreset {
    let from, to: DateTime;
    let preset: Preset;

    if (queryParams.get('from') && queryParams.get('to')) {
      from = DateTime.fromFormat(queryParams.get('from') as string, 'yyyy-MM-dd').toLocal();
      to = DateTime.fromFormat(queryParams.get('to') as string, 'yyyy-MM-dd')
        .toLocal()
        .plus({ days: 1 }); // date range is exclusive on the to date
      preset = Preset.Custom;
    } else {
      preset = (queryParams.get('preset') as Period) ?? Period.Last7;
      const presetRange = this.dateRangeService.calculatePresetPeriod(preset, DateTime.local());
      from = presetRange.from;
      to = presetRange.to;
    }

    return { from, to, preset };
  }

  getPerformanceFilters(paramMap: ParamMap, queryParams: ParamMap): PerformanceFiltersInputType {
    const filters: PerformanceFiltersInputType = { timingPointsOnly: true };

    if (paramMap.get('nocCode')) {
      const operatorId = ifNullOrUndefinedReturnEmptyString(this.operatorId);
      filters.operatorIds = [operatorId];
    }
    if (paramMap.get('lineId')) {
      filters.lineIds = [paramMap.get('lineId')];
    }

    if (queryParams.get('dayOfWeek')) {
      const dayOfWeekFlags: DayOfWeekFlagsInputType = {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      };

      queryParams
        .get('dayOfWeek')
        ?.split(',')
        .map((day) => {
          if (day as keyof DayOfWeekFlagsInputType) dayOfWeekFlags[day as keyof DayOfWeekFlagsInputType] = true;
        });

      filters.dayOfWeekFlags = dayOfWeekFlags;
    }

    if (queryParams.get('startTime')) {
      filters.startTime = queryParams.get('startTime');
    }

    if (queryParams.get('endTime')) {
      filters.endTime = queryParams.get('endTime');
    }

    if (queryParams.get('minDelay')) {
      filters.minDelay = parseInt(queryParams.get('minDelay') as string);
    }

    if (queryParams.get('maxDelay')) {
      filters.maxDelay = parseInt(queryParams.get('maxDelay') as string);
    }

    if (queryParams.has('timingPointsOnly')) {
      filters.timingPointsOnly = queryParams.get('timingPointsOnly') === 'true' || undefined;
    }

    if (queryParams.has('allStops')) {
      filters.timingPointsOnly = queryParams.get('allStops') !== 'true' || undefined;
    }

    if (queryParams.has('adminAreaId')) {
      filters.adminAreaIds = queryParams.getAll('adminAreaId');
    }

    return filters;
  }

  ngOnInit(): void {
    this.setFilterPanelComponent();

    const paramMap$ = this.route.paramMap;
    const queryParamMap$ = this.route.queryParamMap;

    const fromTo$ = queryParamMap$.pipe(
      map((queryParams) => this.getDateTimeParams(queryParams)),
      distinctUntilChanged(
        ({ from: from1, to: to1, preset: preset1 }, { from: from2, to: to2, preset: preset2 }) =>
          preset1 === preset2 && from1.equals(from2) && to1.equals(to2)
      ),
      takeUntil(this.onDestroy$)
    );
    fromTo$.subscribe((fromTo) => this.dateRange.setValue(fromTo));

    combineLatest([paramMap$, queryParamMap$])
      .pipe(
        map(([paramMap, queryParamMap]) => this.getPerformanceFilters(paramMap, queryParamMap)),
        distinctUntilChanged(_isEqual),
        takeUntil(this.onDestroy$)
      )
      .subscribe(this.filtersSubject);

    combineLatest([this.filtersSubject, fromTo$])
      .pipe(
        map(([filters, { from, to }]) => ({
          fromTimestamp: from,
          toTimestamp: to,
          filters,
        }))
      )
      .subscribe((params) => this.params.emit(params));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['operatorId'] && changes['operatorId'].currentValue) {
      this.filtersSubject.next({ ...this.filtersSubject.value, operatorIds: [changes['operatorId'].currentValue] });
    }
  }

  ngAfterViewInit(): void {
    this.dateRange.valueChanges.subscribe(({ from, to, preset }) => {
      if (preset === Preset.Custom) {
        this.router.navigate([], {
          queryParams: {
            from: from.toFormat('yyyy-MM-dd'),
            to: to.minus({ days: 1 }).toFormat('yyyy-MM-dd'),
            preset: undefined,
          },
          queryParamsHandling: 'merge',
        });
      } else {
        this.router.navigate([], {
          queryParams: {
            from: undefined,
            to: undefined,
            preset: preset,
          },
          queryParamsHandling: 'merge',
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyFilterPanel();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  changeAdminAreaIds(adminAreaId: string[]) {
    this.router.navigate([], {
      queryParams: { adminAreaId },
      queryParamsHandling: 'merge',
    });
  }

  changeOperator(operator: { name?: string | null; nocCode: string }) {
    this.router.navigate(['/on-time', operator.nocCode], { queryParamsHandling: 'preserve' });
  }

  updateFilters(value: PerformanceFiltersInputType) {
    this.router.navigate([], {
      queryParams: {
        dayOfWeek: value.dayOfWeekFlags
          ? Object.entries(value.dayOfWeekFlags)
              .filter(([_s, v]) => v)
              .map(([s, _v]) => s)
              .join()
          : undefined,
        startTime: value.startTime,
        endTime: value.endTime,
        minDelay: value.minDelay,
        maxDelay: value.maxDelay,
        adminAreaId: value.adminAreaIds,
      },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters() {
    this.filtersComponent?.resetFilters();
  }

  overviewModeChanged(overview: string) {
    this.router.navigate([], { queryParams: { overview }, queryParamsHandling: 'merge' });
  }

  onMoreFiltersClick() {
    this.panelService.toggle();
  }

  setFilterPanelComponent() {
    this.panelService.setComponent({
      component: FiltersComponent,
      inputs: [
        {
          name: 'filters',
          value: this.filtersSubject,
        },
        {
          name: 'showAdminAreas',
          value: this.showAdminAreas,
        },
      ],
      outputs: [
        {
          name: 'filtersChange',
          outputEvent: ($event: PerformanceFiltersInputType) => this.updateFilters($event),
        },
        {
          name: 'closeFilters',
          outputEvent: () => this.panelService.close(),
        },
      ],
    });
  }

  destroyFilterPanel() {
    this.panelService.destroy();
  }
}
