import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, HostListener } from '@angular/core';
import { FromTo, FromToPreset, Period, Preset } from './date-range.types';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateTime } from 'luxon';
import { DateRangeService } from '../../services/date-range.service';

@Component({
  selector: 'app-date-range',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangeComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeComponent implements ControlValueAccessor {
  value: FromToPreset;
  open = false;

  get fromTo(): FromTo {
    return this.value;
  }
  set fromTo(fromTo: FromTo) {
    this.writeValue({ ...fromTo, preset: Preset.Custom });
  }

  constructor(private dateRangeService: DateRangeService, private changeDetector: ChangeDetectorRef) {
    this.value = dateRangeService.calculatePresetPeriod(Period.Last7, DateTime.local());
  }

  onChange: (value: FromToPreset) => void = () => {
    // Do nothing
  };

  registerOnChange(fn: (value: FromToPreset) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(_fn: unknown): void {
    // Unused
  }

  writeValue(value: FromToPreset): void {
    this.value = value;
    this.changeDetector.detectChanges();
  }

  get fromToStr(): string {
    const { from, to } = this.value;
    if (from && to) {
      return `${from.toFormat('dd MMM yyyy')} - ${to.minus({ days: 1 }).toFormat('dd MMM yyyy')}`;
    }
    return '';
  }

  openControls() {
    this.open = true;
  }

  @HostListener('document:keydown.escape')
  closeControls() {
    this.open = false;
  }

  toggleControls(event: Event) {
    event.preventDefault();
    this.open = !this.open;
  }

  preventKeystroke(event: Event) {
    event.returnValue = false;
    event.preventDefault();
  }

  pickDateRange(value: FromTo) {
    this.onChange({ ...value, preset: Preset.Custom });
  }

  selectPresetDateRange(preset: string) {
    const period = preset as Preset;
    if (period !== Preset.Custom) {
      this.value = this.dateRangeService.calculatePresetPeriod(period, DateTime.local());
      this.onChange(this.value);
    }
  }
}
