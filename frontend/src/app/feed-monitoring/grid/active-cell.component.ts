import { Component, ViewEncapsulation } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-feed-monitoring-active-cell',
  templateUrl: './active-cell.component.html',
  styleUrls: ['./active-cell.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ActiveCellComponent implements AgRendererComponent {
  params?: ICellRendererParams;

  get status() {
    return this.params?.value ? 'active' : 'inactive';
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  get cellClasses() {
    return {
      'active-cell': true,
      'active-cell--active': this.params?.value,
    };
  }
}
