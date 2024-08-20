import { AgRendererComponent } from 'ag-grid-angular';
import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

export interface IconCellRendererParams extends ICellRendererParams {
  src: string;
  label: string;
}

@Component({
  template: `<div class="icon-cell" tabindex="-1" *ngIf="params?.value">
    <svg-icon class="icon-cell__icon" [applyClass]="true" [src]="params?.src || ''" aria-hidden="true"></svg-icon>
    <span class="govuk-visually-hidden">{{ params?.label }}</span>
  </div>`,
  styleUrls: ['./icon-cell-renderer.component.scss'],
})
export class IconCellRendererComponent implements AgRendererComponent {
  params?: IconCellRendererParams;

  agInit(params: IconCellRendererParams) {
    this.params = params;
  }

  refresh(params: IconCellRendererParams): boolean {
    this.agInit(params);
    return true;
  }
}
