import { Component, forwardRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateTime, Interval } from 'luxon';

let nextUniqueId = 0;

@Component({
  selector: 'app-date',
  templateUrl: 'date.component.html',
  styleUrls: ['./date.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateComponent),
      multi: true,
    },
  ],
})
export class DateComponent implements ControlValueAccessor {
  @Input() inputId = `date-${nextUniqueId++}`;
  @Input() label?: string;
  @Input() error?: string;
  @Input() width?: '2' | '3' | '5' | '10' | '20';
  @Input() validRange = Interval.before(DateTime.local(), { years: 5 });
  @Input() required = false;

  readonly today = DateTime.local();
  value?: DateTime | null;
  month = this.today.startOf('month');
  open = false;

  onChange: (value: DateTime | null | undefined) => void = () => undefined;

  registerOnChange(fn: (value: DateTime | null | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched() {
    // Not implemented
  }

  writeValue(value: DateTime | null | undefined): void {
    this.value = value;
  }

  openControls() {
    this.open = true;
  }

  @HostListener('document:keydown.escape')
  closeControls() {
    this.open = false;
  }

  toggleControls() {
    this.open = !this.open;
  }

  nextMonth($event: Event) {
    $event.preventDefault();
    this.month = this.month.plus({ months: 1 });
  }

  prevMonth($event: Event) {
    $event.preventDefault();
    this.month = this.month.minus({ months: 1 });
  }

  inputChange(value: string | null | undefined) {
    this.value = typeof value === 'string' ? DateTime.fromISO(value) : value;
    if (this.value?.isValid) {
      this.month = this.value?.startOf('month');
    }
    this.onChange(this.value);
  }

  calendarChange(value: DateTime | null | undefined) {
    this.value = value;
    this.open = false;
    this.onChange(this.value);
  }
}
