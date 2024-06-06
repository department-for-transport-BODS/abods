import { Component } from '@angular/core';

import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SparklineCellTemplateComponent } from './sparkline-cell-template.component';

@Component({
  selector: 'app-feed-monitoring-sparkline-cell',
  template: '<div class="vehicle-sparkline" [innerHTML]="svg | trustMe"></div>',
  styleUrls: ['./sparkline-cell.component.scss'],
})
export class SparklineCellComponent implements AgRendererComponent {
  svg?: string;

  refresh({ value, context: { sparklineTemplate } }: ICellRendererParams): boolean {
    (sparklineTemplate as SparklineCellTemplateComponent).createStaticImage(value, (svg) => {
      this.svg = svg;
    });
    return true;
  }

  agInit({ value, context: { sparklineTemplate } }: ICellRendererParams): void {
    (sparklineTemplate as SparklineCellTemplateComponent).createStaticImage(value, (svg) => {
      this.svg = svg;
    });
  }
}
