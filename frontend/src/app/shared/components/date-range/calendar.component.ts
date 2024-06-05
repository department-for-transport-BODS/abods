import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DateTime, Interval } from 'luxon';
import { Day, NullDay } from './date-range.types';
import { DateRange } from './date-range-controls.component';

function* daysOf(interval: Interval) {
  let cursor = interval.start.startOf('day');
  while (cursor < interval.end) {
    yield cursor;
    cursor = cursor.plus({ days: 1 });
  }
}

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.component.html',
  styleUrls: ['date-range-controls.component.scss'],
})
export class CalendarComponent implements OnChanges {
  @Input() selectableRange = Interval.before(DateTime.local().minus({ days: 1 }), { years: 5 });
  @Output() dateChange = new EventEmitter<DateTime>();

  _selected: DateRange = {};
  selectedInterval?: Interval;
  today = DateTime.local().startOf('day');
  dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  table: Day[][] = [];

  @Input()
  set selected(value: DateTime | DateRange | null | undefined) {
    if (value instanceof DateTime) {
      value = { start: value, end: value };
    } else if (!value) {
      value = {};
    }
    this._selected = value;
    this.selectedInterval =
      value.start?.isValid && value.end?.isValid ? Interval.fromDateTimes(value.start, value.end) : undefined;
  }

  @Input() month?: Interval | DateTime;

  ngOnChanges(changes: SimpleChanges) {
    if ((!changes.month && !changes.selectableRange) || !this.month?.isValid) {
      return;
    }
    this.table = [];
    const month =
      this.month instanceof DateTime ? Interval.after(this.month.startOf('month'), { month: 1 }) : this.month;

    const leadingBlanks: NullDay[] = Array.from({ length: month.start.weekday - 1 }).map(() => new NullDay());
    const days: Day[] = Array.from(daysOf(month)).map((date) => ({
      date,
      isToday: date.equals(this.today),
      isSelectable: this.selectableRange.contains(date),
      isSelected: false,
      isVisible: true,
      isSaturday: date.weekday === 6,
    }));
    const allCells: Day[] = leadingBlanks.concat(days);

    for (let i = 0; i < allCells.length; i += 7) {
      const row = allCells.slice(i, i + 7);
      this.table.push(row);
    }
  }
}
