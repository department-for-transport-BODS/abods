import { AgRendererComponent } from 'ag-grid-angular';
import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  template: `<div class="timing-cell" tabindex="-1" *ngIf="params?.value">
    <svg-icon
      class="timing-cell__icon"
      [applyClass]="true"
      src="/assets/icons/timing.svg"
      aria-hidden="true"
    ></svg-icon>
    <span class="govuk-visually-hidden">Timing point</span>
  </div>`,
  styleUrls: ['./timing-renderer.component.scss'],
})
export class TimingRendererComponent implements AgRendererComponent {
  params?: ICellRendererParams;

  agInit(params: ICellRendererParams) {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}
