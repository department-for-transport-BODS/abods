import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DayOfWeekFlagsInputType, PerformanceFiltersInputType } from '../../../generated/graphql';
import { AdminAreaService } from '../admin-area/admin-area.service';
import { isNotNullOrUndefined } from '../../shared/rxjs-operators';
import { map, switchMap, take, takeUntil } from 'rxjs/operators';
import { MultiselectCheckboxOption } from '../../shared/gds/multiselect-checkbox/multiselect-checkbox.component';
import { BehaviorSubject, of, Subject } from 'rxjs';

const defaultDayOfWeekFlags: DayOfWeekFlagsInputType = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
};

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent implements OnDestroy {
  oldFilters?: PerformanceFiltersInputType;
  dayOfWeekFlags: DayOfWeekFlagsInputType = defaultDayOfWeekFlags;
  _startTime = '00:00';
  get startTime() {
    return this._startTime;
  }
  set startTime(val: string) {
    this._startTime = val;
    this.validationErrors = { ...this.validationErrors, startTime: '', startEndTime: '' };
  }
  _endTime = '23:59';
  get endTime() {
    return this._endTime;
  }
  set endTime(val: string) {
    this._endTime = val;
    this.validationErrors = { ...this.validationErrors, endTime: '', startEndTime: '' };
  }
  minDelay: number | null = null;
  get minDelayStr() {
    if (this.minDelay === null) {
      return 'none';
    }
    return this.minDelay.toString();
  }
  set minDelayStr(val: string) {
    if (val === 'none') {
      this.minDelay = null;
    } else {
      this.minDelay = parseInt(val, 10);
    }
  }
  maxDelay: number | null = null;
  get maxDelayStr() {
    if (this.maxDelay === null) {
      return 'none';
    }
    return this.maxDelay.toString();
  }
  set maxDelayStr(val: string) {
    if (val === 'none') {
      this.maxDelay = null;
    } else {
      this.maxDelay = parseInt(val, 10);
    }
  }
  excludeItoLineId = '';

  validationErrors: { [k: string]: string | undefined } = {};

  @Input() set filters(value: PerformanceFiltersInputType | null) {
    if (!value) {
      value = {};
    }

    this.setAdminAreaDropdown(value);
    this.oldFilters = value;
    this.setFilters(value);
  }
  @Input() showAdminAreas = true;

  adminAreas$ = new BehaviorSubject<MultiselectCheckboxOption[]>([]);
  adminAreaIds: string[] = [];

  @Output() filtersChange = new EventEmitter<PerformanceFiltersInputType>();
  @Output() closeFilters = new EventEmitter();

  private destroy$ = new Subject<void>();

  constructor(private adminAreaService: AdminAreaService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setAdminAreaDropdown(newFilters: PerformanceFiltersInputType): void {
    const oldOpId = this.oldFilters && this.oldFilters.operatorIds && this.oldFilters.operatorIds[0];
    const newOpId = newFilters && newFilters.operatorIds && newFilters.operatorIds[0];
    if (oldOpId !== newOpId) {
      this.adminAreaService
        .fetchAdminAreasForOperator(newOpId as string)
        .pipe(
          takeUntil(this.destroy$),
          map((areas) =>
            areas
              .map((area) => <MultiselectCheckboxOption>{ label: area.name, value: area.id })
              .sort((a: MultiselectCheckboxOption, b: MultiselectCheckboxOption) => a.label.localeCompare(b.label))
          )
        )
        .subscribe((data) => {
          this.adminAreas$.next(data);
        });
    }
  }

  private setFilters(value: PerformanceFiltersInputType) {
    this.validationErrors = {};
    const { dayOfWeekFlags, startTime, endTime, minDelay, maxDelay, excludeItoLineId, adminAreaIds } = value;

    this.dayOfWeekFlags = dayOfWeekFlags ? { ...dayOfWeekFlags } : { ...defaultDayOfWeekFlags };
    this.startTime = startTime ?? '00:00';
    this.endTime = endTime ?? '23:59';
    this.minDelay = minDelay ?? null;
    this.maxDelay = maxDelay ?? null;
    this.excludeItoLineId = excludeItoLineId ?? '';
    this.setSelectedAdminAreaIds(adminAreaIds as string[]);
  }

  private setSelectedAdminAreaIds(adminAreaIds: string[]) {
    of(adminAreaIds)
      .pipe(
        take(1),
        switchMap(() => this.adminAreas$)
      )
      .subscribe((adminAreas) => {
        const adminAreasIds: string[] = adminAreaIds?.filter(isNotNullOrUndefined) ?? [];
        // We only want to show admin areas that this operator operates in for the admin area dropdown
        this.adminAreaIds = adminAreasIds.filter((id) => adminAreas.map((area) => area.value).includes(id));
      });
  }

  toggleDayOfTheWeek(k: keyof DayOfWeekFlagsInputType) {
    this.dayOfWeekFlags[k] = !this.dayOfWeekFlags[k];
    this.validationErrors = { ...this.validationErrors, dayOfWeekFlags: '' };
  }

  validate() {
    const errors: { [k: string]: string | undefined } = {};

    errors.dayOfWeekFlags = Object.values(this.dayOfWeekFlags).some((v) => v) ? '' : 'Please select at least one day.';

    const startHour = parseInt(this.startTime, 10);
    const endHour = parseInt(this.endTime, 10);

    if (!/^\d\d:\d\d$/.test(this.startTime) || isNaN(startHour) || startHour < 0 || startHour > 23)
      errors.startTime = "Start time must be between '00:00' and '23:00'";
    if (!/^\d\d:\d\d$/.test(this.endTime) || isNaN(endHour) || endHour < 0 || endHour > 23)
      errors.endTime = "End time must be between '00:59' and '23:59'";
    if (!errors.startTime && !errors.endTime && startHour > endHour)
      errors.startEndTime = 'Start time must be before end time.';
    return errors;
  }

  getErrors(...ks: string[]) {
    return ks.reduce((e, k) => {
      const ek = this.getError(k);
      if (ek) {
        return `${e} ${ek}`;
      }
      return e;
    }, '');
  }
  getError(k: string) {
    return this.validationErrors[k];
  }

  apply() {
    this.validationErrors = this.validate();

    if (Object.values(this.validationErrors).some((v) => !!v)) {
      return;
    }

    const newFilters: PerformanceFiltersInputType = {};

    if (!Object.values(this.dayOfWeekFlags).every((v) => v)) {
      newFilters.dayOfWeekFlags = { ...this.dayOfWeekFlags };
    }

    if (this.startTime !== '00:00' || this.endTime !== '23:59') {
      newFilters.startTime = this.startTime;
      newFilters.endTime = this.endTime;
    }

    if (this.minDelay !== null) {
      newFilters.minDelay = this.minDelay;
    }

    if (this.maxDelay !== null) {
      newFilters.maxDelay = this.maxDelay;
    }

    if (this.excludeItoLineId) {
      newFilters.excludeItoLineId = this.excludeItoLineId;
    }

    if (this.adminAreaIds.length) {
      newFilters.adminAreaIds = this.adminAreaIds;
    }

    if (!this.showAdminAreas) {
      // We preserve the admin areas for returning to All services page
      newFilters.adminAreaIds = this.oldFilters?.adminAreaIds as string[];
    }

    this.filtersChange.emit(newFilters);
  }

  cancel() {
    this.closeFilters.emit();
  }

  resetFilters() {
    if (this.oldFilters) {
      this.setFilters(this.oldFilters);
    }
  }

  resetToDefault() {
    this.setFilters({});
  }
}
