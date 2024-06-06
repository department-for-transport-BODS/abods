import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-vehicles-status',
  templateUrl: './vehicles-status.component.html',
  styleUrls: ['./vehicles-status.component.scss'],
})
export class VehiclesStatusComponent {
  @Input() expected?: number | null;
  @Input() actual?: number | null;
  @Input() nocCode?: string | null;

  get liveStatusRoute() {
    if (this.nocCode) {
      return ['/feed-monitoring', this.nocCode];
    }

    return ['/feed-monitoring'];
  }
}
