import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { PerformanceFiltersInputType } from '../../../generated/graphql';
import { AdminArea, AdminAreaService } from '../admin-area/admin-area.service';
import { isNotNullOrUndefined } from '../../shared/rxjs-operators';
import { map } from 'rxjs/operators';
import { entries as _entries } from 'lodash-es';

export type DayOfWeekLabel = {
  monday: 'Mon';
  tuesday: 'Tue';
  wednesday: 'Wed';
  thursday: 'Thur';
  friday: 'Fri';
  saturday: 'Sat';
  sunday: 'Sun';
};

@Component({
  selector: 'app-filter-chips',
  templateUrl: './filter-chips.component.html',
  styleUrls: ['./filter-chips.component.scss'],
})
export class FilterChipsComponent implements OnChanges {
  @Input() showAdminAreas = true;
  @Input() filters: PerformanceFiltersInputType = {};
  @Output() filterChange = new EventEmitter<PerformanceFiltersInputType>();

  get isDayOfWeek(): boolean {
    return !!this.filters.dayOfWeekFlags;
  }

  get isTimeRange(): boolean {
    return !!this.filters.startTime || !!this.filters.endTime;
  }

  get isMinDelay(): boolean {
    return !!this.filters.minDelay;
  }

  get isMaxDelay(): boolean {
    return !!this.filters.maxDelay;
  }

  dayOfWeekValueMap: DayOfWeekLabel = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thur',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  private readonly weekends = 'Sat, Sun';
  private readonly weekdays = 'Mon, Tue, Wed, Thur, Fri';

  get dayOfWeekValues(): string {
    const value = _entries(this.filters.dayOfWeekFlags ?? {})
      .filter(([, value]) => value)
      .map(([day]) => this.dayOfWeekValueMap[day as keyof DayOfWeekLabel])
      .join(', ');

    if (value === this.weekdays) {
      return 'Weekdays';
    }
    if (value === this.weekends) {
      return 'Weekends';
    }

    return value;
  }

  get timeRange(): string {
    return this.filters.startTime + ' - ' + this.filters.endTime;
  }

  get minDelay(): string {
    if (this.filters.minDelay) {
      return this.filters.minDelay * -1 + ' minutes';
    }
    return '';
  }

  get maxDelay(): string {
    return this.filters.maxDelay + ' minutes';
  }

  adminAreas: AdminArea[] = [];

  constructor(private adminAreaService: AdminAreaService) {}

  ngOnChanges() {
    const nocCode = this.filters.nocCodes?.[0];
    const adminAreaIds = this.filters.adminAreaIds?.filter(isNotNullOrUndefined) ?? [];

    // This ought to happen synchronously, since admin area data should be cached and never change
    (nocCode ? this.adminAreaService.fetchAdminAreasForOperator(nocCode) : this.adminAreaService.fetchAdminAreas())
      .pipe(map((adminAreas) => adminAreas.filter((adminArea) => adminAreaIds.includes(adminArea.id))))
      .subscribe((adminAreas) => (this.adminAreas = adminAreas));
  }

  onClearDayOfWeekFilter() {
    const { dayOfWeekFlags, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  onClearTimeRangeFilter() {
    const { startTime, endTime, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  onClearMinDelayFilter() {
    const { minDelay, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  onClearMaxDelayFilter() {
    const { maxDelay, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  clearAdminAreaFilter(adminAreaId: string) {
    this.updateFilters({
      ...this.filters,
      adminAreaIds: this.filters.adminAreaIds?.filter((id) => id !== adminAreaId),
    });
  }

  updateFilters(filters: PerformanceFiltersInputType) {
    this.filters = filters;
    this.filterChange.emit(filters);
  }
}
