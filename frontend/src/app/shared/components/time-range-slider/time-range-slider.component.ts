import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * TODO This class has too many responsibilities. Split off a time-formatter control
 *  and a 'two inputs reflecting one model value' control.
 */
@Component({
  selector: 'app-time-range-slider',
  templateUrl: './time-range-slider.component.html',
  styleUrls: ['./time-range-slider.component.scss'],
})
export class TimeRangeSliderComponent {
  @Input() labelMin?: string;
  @Input() labelMax?: string;
  @Input() legend?: string;
  @Input() legendSize?: 's' | 'm' | 'l';
  @Input() error = '';
  _startHour = 0;
  get sliderStartHour() {
    return this._startHour;
  }
  set sliderStartHour(val: number) {
    this._startHour = val;
    this.startTimeChange.emit(this.startTime);
  }

  get inputStartHour() {
    return this._startHour.toString().padStart(2, '0');
  }
  set inputStartHour(val: string) {
    this._startHour = parseInt(val, 10);
    this.startTimeChange.emit(this.startTime);
  }

  _endHour = 24;
  get sliderEndHour() {
    return this._endHour;
  }
  set sliderEndHour(val: number) {
    this._endHour = val;
    this.endTimeChange.emit(this.endTime);
  }

  get inputEndHour() {
    return (this._endHour - 1).toString().padStart(2, '0');
  }
  set inputEndHour(val: string) {
    this._endHour = parseInt(val, 10) + 1;
    this.endTimeChange.emit(this.endTime);
  }

  @Input() set startTime(val: string) {
    if (!/\d\d:00/.test(val)) {
      this._startHour = 0;
    } else {
      this._startHour = parseInt(val, 10);
    }
  }
  get startTime() {
    return `${this._startHour.toString().padStart(2, '0')}:00`;
  }
  @Output() startTimeChange = new EventEmitter<string>();

  @Input() set endTime(val: string) {
    if (!/\d\d:59/.test(val)) {
      this._endHour = 24;
    } else {
      this._endHour = parseInt(val, 10) + 1;
    }
  }
  get endTime() {
    return `${(this._endHour - 1).toString().padStart(2, '0')}:59`;
  }
  @Output() endTimeChange = new EventEmitter<string>();

  get legendClasses() {
    return {
      [`govuk-fieldset__legend--${this.legendSize}`]: this.legendSize,
    };
  }

  get formGroupClasses() {
    return {
      ['govuk-form-group--error']: !!this.error,
    };
  }
}
