import { Component, Input } from '@angular/core';
import { Granularity, VehicleStatsType } from 'src/generated/graphql';

@Component({
  selector: 'app-live-vehicle-stats',
  template: '<div></div>',
  styleUrls: [],
})

// Currently dumb but maybe in the future more interesting mock for the live stats chart
export class MockLiveVehicleStatsComponent {
  @Input() nocCode?: string | null;
  @Input() chartId?: string;
  @Input() label?: string;
  @Input() dataSource?: (VehicleStatsType | null | undefined)[];
  @Input() granularity?: Granularity;
}
