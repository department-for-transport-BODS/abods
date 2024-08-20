import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { VehicleJourney } from '../vehicle-journeys-search.service';
import { groupBy as _groupBy } from 'lodash-es';

@Component({
  selector: 'app-vehicle-journeys-grid',
  templateUrl: './vehicle-journeys-grid.component.html',
  styleUrls: ['./vehicle-journeys-grid.component.scss'],
})
export class VehicleJourneysGridComponent implements OnChanges {
  @Input() data: VehicleJourney[] = [];
  @Input() operatorId?: string;
  @Input() serviceId?: string;
  @Input() loading = false;

  patterns: VehicleJourney[][] = [];

  ngOnChanges(simpleChanges: SimpleChanges): void {
    if (simpleChanges['data'] && simpleChanges['data'].currentValue.length > 0) {
      this.patterns = Array.from(Object.values(_groupBy(simpleChanges['data'].currentValue, 'servicePattern')));
    } else {
      this.patterns = [];
    }
  }
}
