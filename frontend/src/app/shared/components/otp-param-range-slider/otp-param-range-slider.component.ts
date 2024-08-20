import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-otp-param-range-slider',
  templateUrl: './otp-param-range-slider.component.html',
  styleUrls: ['./otp-param-range-slider.component.scss'],
})
export class OtpParamRangeSliderComponent {
  @Input() early!: number;
  @Output() earlyChange = new EventEmitter<number>();
  get sliderEarly(): number {
    return this.early * -1;
  }
  set sliderEarly(val: number) {
    this.early = val * -1;
    this.earlyChange.emit(this.early);
  }

  @Input() late!: number;
  @Output() lateChange = new EventEmitter<number>();
  get sliderLate(): number {
    return this.late;
  }
  set sliderLate(val: number) {
    this.late = val;
    this.lateChange.emit(this.late);
  }
}
