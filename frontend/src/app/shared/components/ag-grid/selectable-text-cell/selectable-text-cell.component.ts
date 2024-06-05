import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams, ValueGetterParams } from 'ag-grid-community';

export interface SelectableTextCellRendererParams extends ICellRendererParams {
  bold?: boolean;
  noWrap?: boolean;
  textOverflow?: 'ellipsis' | 'visible' | 'clip';
  tooltipValueGetter?: (params: ValueGetterParams) => any;
}

@Component({
  template: `<ng-template #selectableText>
      <div class="selectable-text-cell" [ngClass]="classNames">
        <span>{{ label }}</span>
      </div>
    </ng-template>

    <ng-container *ngIf="!withTooltip; else tooltip">
      <ng-container *ngTemplateOutlet="selectableText"></ng-container>
    </ng-container>

    <ng-template #tooltip>
      <app-tooltip [message]="tooltipText">
        <ng-container *ngTemplateOutlet="selectableText"></ng-container>
      </app-tooltip>
    </ng-template> `,
  styleUrls: ['./selectable-text-cell.component.scss'],
})
export class SelectableTextCellRendererComponent implements AgRendererComponent {
  label?: string;
  bold?: boolean;
  noWrap?: boolean;
  withTooltip = false;
  tooltipText?: string;

  textOverflow?: 'ellipsis' | 'visible' | 'clip';

  refresh(params: SelectableTextCellRendererParams): boolean {
    this.agInit(params);
    return true;
  }

  agInit(params: SelectableTextCellRendererParams) {
    this.label = params.valueFormatted ?? params.value;
    this.bold = params.bold;
    this.noWrap = params.noWrap;
    this.textOverflow = params.textOverflow ?? 'ellipsis';
    this.withTooltip = !!params.tooltipValueGetter;
    if (params.tooltipValueGetter) {
      this.tooltipText = params.tooltipValueGetter(params as ValueGetterParams);
    }
  }

  get classNames() {
    return {
      'selectable-text-cell--bold': this.bold,
      'selectable-text-cell--no-wrap': this.noWrap,
      [`selectable-text-cell--overflow-${this.textOverflow}`]: this.textOverflow,
    };
  }
}
