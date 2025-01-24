import { Component, EventEmitter, Input, Output } from "@angular/core";
import { entries as _entries } from "lodash-es";
import { PerformanceFiltersInputType } from "../../../../generated/graphql";

export interface DayOfWeekLabel {
  monday: "Mon";
  tuesday: "Tue";
  wednesday: "Wed";
  thursday: "Thur";
  friday: "Fri";
  saturday: "Sat";
  sunday: "Sun";
}

@Component({
  selector: "app-filter-chips",
  templateUrl: "./filter-chips.component.html",
  styleUrls: ["./filter-chips.component.scss"],
})
export class FilterChipsComponent {
  @Input() enableChip = false;
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
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thur",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  private readonly weekends = "Sat, Sun";
  private readonly weekdays = "Mon, Tue, Wed, Thur, Fri";

  get dayOfWeekValues(): string {
    const value = _entries(this.filters.dayOfWeekFlags ?? {})
      .filter(([, value]) => value)
      .map(([day]) => this.dayOfWeekValueMap[day as keyof DayOfWeekLabel])
      .join(", ");

    if (value === this.weekdays) {
      return "Weekdays";
    }
    if (value === this.weekends) {
      return "Weekends";
    }

    return value;
  }

  get timeRange(): string {
    return this.filters.startTime + " - " + this.filters.endTime;
  }

  get minDelay(): string {
    if (this.filters.minDelay) {
      return this.filters.minDelay * -1 + " minutes";
    }
    return "";
  }

  get maxDelay(): string {
    return this.filters.maxDelay + " minutes";
  }

  onClearDayOfWeekFilter() {
    const { dayOfWeekFlags: _, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  onClearTimeRangeFilter() {
    const { startTime: _, endTime: __, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  onClearMinDelayFilter() {
    const { minDelay: _, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  onClearMaxDelayFilter() {
    const { maxDelay: _, ...filters } = this.filters;
    this.updateFilters(filters);
  }

  updateFilters(filters: PerformanceFiltersInputType) {
    this.filters = filters;
    this.filterChange.emit(filters);
  }
}
