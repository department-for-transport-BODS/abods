import { Component, Input } from '@angular/core';
import { DateTime } from 'luxon';
import { VehicleJourneyInfo } from '../vehicle-journey-view.model';

@Component({
  selector: 'app-journey-info',
  templateUrl: './journey-info.component.html',
  styleUrls: ['./journey-info.component.scss'],
})
export class JourneyInfoComponent {
  @Input() journeyInfo?: VehicleJourneyInfo | null;
  @Input() loading?: boolean;

  get operatorName(): string {
    return this.journeyInfo?.operatorInfo?.operatorName ?? '';
  }

  get operatorNocCode(): string {
    return this.journeyInfo?.operatorInfo?.nocCode ?? '';
  }

  get servicePatternName(): string {
    return this.journeyInfo?.serviceInfo?.serviceName ?? '';
  }

  get startTime(): DateTime | undefined {
    return this.journeyInfo?.startTime;
  }

  get vehicleId(): string {
    return this.journeyInfo?.vehicleId ?? '';
  }
}
