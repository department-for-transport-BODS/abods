import { Component, Input } from '@angular/core';
import { VehicleJourney } from '../../vehicle-journeys-search/vehicle-journeys-search.service';
import { DateTime } from 'luxon';
import { NgxTippyProps } from 'ngx-tippy-wrapper';

@Component({
  selector: 'app-journey-nav',
  templateUrl: 'journey-nav.component.html',
  styleUrls: ['./journey-nav.component.scss'],
})
export class JourneyNavComponent {
  @Input() previous: VehicleJourney | null = null;
  @Input() next: VehicleJourney | null = null;

  @Input() set prevNext([prev, next]: [VehicleJourney | null, VehicleJourney | null]) {
    this.previous = prev;
    this.next = next;
  }
  @Input() loading = false;

  // I would use a pipe, but luxon-angular doesn't support ToISOTimeOptions.
  formatStartTime(startTime?: DateTime) {
    return startTime?.toUTC().toISO({ format: 'basic', suppressSeconds: true });
  }

  tippyProps: NgxTippyProps = {
    allowHTML: true,
    theme: 'gds-tooltip',
    zIndex: 100,
  };
}
