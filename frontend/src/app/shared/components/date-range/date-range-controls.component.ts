import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DateTime, Duration, Interval } from 'luxon';
import { FromTo } from './date-range.types';

// Analogous to a Luxon Interval, but allows for partially constructed object
export type DateRange = Partial<Pick<Interval, 'start' | 'end'>>;

@Component({
  selector: 'app-date-range-controls',
  templateUrl: './date-range-controls.component.html',
  styleUrls: ['./date-range-controls.component.scss'],
})
export class DateRangeControlsComponent implements OnInit {
  /*
   * fromTo represents a half open interval - the to date is not inclusive but the from date is
   */
  @Input()
  set fromTo(fromTo: FromTo | null) {
    if (!fromTo) {
      return;
    }
    this.start = fromTo.from;
    this.end = fromTo.to.minus({ days: 1 });
  }
  @Output() fromToChange = new EventEmitter<FromTo>();

  @Output() closeControls = new EventEmitter();

  get ending(): string {
    return this.end?.isValid ? this.end.toFormat('yyyy-MM-dd') : '';
  }
  set ending(value: string) {
    this.end = DateTime.fromFormat(value, 'yyyy-MM-dd').startOf('day');
  }

  get starting(): string {
    return this.start?.isValid ? this.start.toFormat('yyyy-MM-dd') : '';
  }
  set starting(value: string) {
    this.start = DateTime.fromFormat(value, 'yyyy-MM-dd').startOf('day');
  }

  start?: DateTime;
  end?: DateTime;
  monthLeft!: Interval;
  monthRight!: Interval;
  today = DateTime.local().startOf('day');
  validInterval = Interval.before(this.today, Duration.fromObject({ years: 5 }));
  handlingBlur = false;
  startFocused = false;
  endFocused = false;
  readonly placeholder = 'dd/mm/yyyy';

  get invalidDates(): boolean {
    if (!this.end?.isValid) {
      return !(this.start?.isValid && this.validInterval.contains(this.start));
    }
    return !(
      this.start?.isValid &&
      this.end?.isValid &&
      this.validInterval.contains(this.start) &&
      this.validInterval.contains(this.end)
    );
  }

  get prevMonthDisabled() {
    return this.monthLeft.start < DateTime.local().minus({ years: 5 });
  }

  get nextMonthDisabled() {
    return this.monthRight.end >= DateTime.local();
  }

  get rangeInclusive(): DateRange {
    if (this.start?.isValid && this.end?.isValid) {
      return { start: DateTime.min(this.start, this.end), end: DateTime.max(this.start, this.end) };
    } else if (this.start?.isValid || this.end?.isValid) {
      const date = this.start?.isValid ? this.start : this.end;
      return { start: date, end: date };
    } else {
      return {};
    }
  }

  ngOnInit() {
    const thisMonth = this.start?.isValid ? this.start.startOf('month') : DateTime.local().startOf('month');

    this.monthLeft = Interval.after(thisMonth.minus({ months: 1 }), { months: 1 });
    this.monthRight = Interval.after(thisMonth, { months: 1 });
  }

  selectDay(selectedDate: DateTime) {
    if (this.start?.isValid && this.end?.isValid) {
      // Reset
      this.start = this.end = undefined;
    }

    if (!this.start?.isValid) {
      this.start = selectedDate;
    } else if (this.start <= selectedDate) {
      this.end = selectedDate;
    } else if (this.start > selectedDate) {
      [this.start, this.end] = [selectedDate, this.start];
    }
  }

  nextMonth($event: Event) {
    $event.preventDefault();
    const nextMonth = this.monthRight.start;
    this.monthLeft = Interval.after(nextMonth, { months: 1 });
    this.monthRight = Interval.after(nextMonth.plus({ months: 1 }), { months: 1 });
  }

  prevMonth($event: Event) {
    $event.preventDefault();
    const prevMonth = this.monthLeft.start;
    this.monthLeft = Interval.after(prevMonth.minus({ months: 1 }), { months: 1 });
    this.monthRight = Interval.after(prevMonth, { months: 1 });
  }

  cancel() {
    this.closeControls.emit();
  }

  apply() {
    const { start, end } = this.rangeInclusive;
    if (start && end) {
      // Convert inclusive range to exclusive for the API
      this.fromToChange.emit({ from: start, to: end?.plus({ days: 1 }) });
      this.closeControls.emit();
    }
  }
}
