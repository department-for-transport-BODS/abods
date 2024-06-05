import { Component, Input } from '@angular/core';
import { OnTimePerformanceStats } from '../vehicle-journey-view.model';

@Component({
  selector: 'app-otp-stats',
  templateUrl: './otp-stats.component.html',
  styleUrls: ['./otp-stats.component.scss'],
})
export class OtpStatsComponent {
  @Input() otpStats?: OnTimePerformanceStats;
  @Input() loading?: boolean;

  get completed(): number {
    const completed = this.early + this.onTime + this.late;
    return completed ?? NaN;
  }

  get early(): number {
    return this.otpStats?.early?.value ?? NaN;
  }

  get onTime(): number {
    return this.otpStats?.onTime?.value ?? NaN;
  }

  get late(): number {
    return this.otpStats?.late?.value ?? NaN;
  }

  get total(): number {
    return this.otpStats?.noData?.total ?? NaN;
  }

  get noData(): number {
    return this.otpStats?.noData?.value ?? NaN;
  }
}
