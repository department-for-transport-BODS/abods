import { Component, Input } from '@angular/core';
import { PerformanceCategories } from '../../dashboard.types';

@Component({
  selector: 'app-performance-chart',
  template: '<div></div>',
  styleUrls: [],
})

// Currently dumb but maybe in the future more interesting mock for the punctuality chart
export class MockPerformanceChartComponent {
  @Input() nocCode?: string | null;
  @Input() sourceData?: { [key in PerformanceCategories]: number };
}
