import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import {
  DayOfWeekFlagsInputType,
  PerformanceFiltersInputType,
} from "../../../../generated/graphql";
import { MultiselectCheckboxOption } from "../../gds/multiselect-checkbox/multiselect-checkbox.component";

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
  selector: "app-filters",
  templateUrl: "./filters.component.html",
  styleUrls: ["./filters.component.scss"],
})
export class FiltersComponent implements OnDestroy {
  dayOfWeekFlags: DayOfWeekFlagsInputType = defaultDayOfWeekFlags;
  _startTime = "00:00";
  get startTime() {
    return this._startTime;
  }
  set startTime(val: string) {
    this._startTime = val;
    this.validationErrors = {
      ...this.validationErrors,
      startTime: "",
      startEndTime: "",
    };
  }
  _endTime = "23:59";
  get endTime() {
    return this._endTime;
  }
  set endTime(val: string) {
    this._endTime = val;
    this.validationErrors = {
      ...this.validationErrors,
      endTime: "",
      startEndTime: "",
    };
  }
  minDelay: number | null = null;
  get minDelayStr() {
    if (this.minDelay === null) {
      return "none";
    }
    return this.minDelay.toString();
  }
  set minDelayStr(val: string) {
    if (val === "none") {
      this.minDelay = null;
    } else {
      this.minDelay = parseInt(val, 10);
    }
  }
  maxDelay: number | null = null;
  get maxDelayStr() {
    if (this.maxDelay === null) {
      return "none";
    }
    return this.maxDelay.toString();
  }
  set maxDelayStr(val: string) {
    if (val === "none") {
      this.maxDelay = null;
    } else {
      this.maxDelay = parseInt(val, 10);
    }
  }
  excludeItoLineId = "";

  validationErrors: Record<string, string | undefined> = {};

  @Input() set filters(value: PerformanceFiltersInputType | null) {
    if (!value) {
      value = {};
    }

    this.setFilters(value);
  }
  @Input() showAdminAreas = true;

  adminAreas$ = new BehaviorSubject<MultiselectCheckboxOption[]>([]);
  adminAreaIds: string[] = [];

  @Output() filtersChange = new EventEmitter<PerformanceFiltersInputType>();
  @Output() closeFilters = new EventEmitter();
  @Output() resetFilters = new EventEmitter();

  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setFilters(value: PerformanceFiltersInputType) {
    this.validationErrors = {};
    const {
      dayOfWeekFlags,
      startTime,
      endTime,
      minDelay,
      maxDelay,
      excludeItoLineId,
    } = value;

    this.dayOfWeekFlags = dayOfWeekFlags
      ? { ...dayOfWeekFlags }
      : { ...defaultDayOfWeekFlags };
    this.startTime = startTime ?? "00:00";
    this.endTime = endTime ?? "23:59";
    this.minDelay = minDelay ?? null;
    this.maxDelay = maxDelay ?? null;
    this.excludeItoLineId = excludeItoLineId ?? "";
  }

  toggleDayOfTheWeek(k: keyof DayOfWeekFlagsInputType) {
    this.dayOfWeekFlags[k] = !this.dayOfWeekFlags[k];
    this.validationErrors = { ...this.validationErrors, dayOfWeekFlags: "" };
  }

  validate() {
    const errors: Record<string, string | undefined> = {};

    errors.dayOfWeekFlags = Object.values(this.dayOfWeekFlags).some((v) => v)
      ? ""
      : "Please select at least one day.";

    const startHour = parseInt(this.startTime, 10);
    const endHour = parseInt(this.endTime, 10);

    if (
      !/^\d\d:\d\d$/.test(this.startTime) ||
      isNaN(startHour) ||
      startHour < 0 ||
      startHour > 23
    )
      errors.startTime = "Start time must be between '00:00' and '23:00'";
    if (
      !/^\d\d:\d\d$/.test(this.endTime) ||
      isNaN(endHour) ||
      endHour < 0 ||
      endHour > 23
    )
      errors.endTime = "End time must be between '00:59' and '23:59'";
    if (!errors.startTime && !errors.endTime && startHour > endHour)
      errors.startEndTime = "Start time must be before end time.";
    return errors;
  }

  getErrors(...ks: string[]) {
    return ks.reduce((e, k) => {
      const ek = this.getError(k);
      if (ek) {
        return `${e} ${ek}`;
      }
      return e;
    }, "");
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

    if (this.startTime !== "00:00" || this.endTime !== "23:59") {
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

    this.filtersChange.emit(newFilters);
  }

  cancel() {
    this.closeFilters.emit();
  }

  resetToDefault() {
    this.resetFilters.emit({});
  }
}
