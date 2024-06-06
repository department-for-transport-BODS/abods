import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';
import { Component } from '@angular/core';

export interface IconHeaderParams extends IHeaderParams {
  src: string;
  label: string;
  tooltip?: string;
}

@Component({
  template: `<div class="ag-cell-label-container" role="presentation">
    <div class="ag-header-cell-label" role="presentation" (click)="sortClicked($event)">
      <span
        class="ag-header-cell-text icon-header"
        ngxTippy
        [tippyProps]="{ theme: 'gds-tooltip', content: params?.tooltip }"
      >
        <svg-icon class="icon-header__icon" [applyClass]="true" [src]="params?.src || ''" aria-hidden="true"></svg-icon>
        <span class="govuk-visually-hidden">{{ params?.displayName }}</span>
      </span>
      <span *ngIf="params?.enableSorting" class="ag-header-icon ag-header-label-icon">
        <span class="ag-icon ag-icon-{{ sort }}"></span>
      </span>
    </div>
  </div>`,
  styleUrls: ['./icon-header.component.scss'],
})
export class IconHeaderComponent implements IHeaderAngularComp {
  public params?: IconHeaderParams;
  public sort: 'asc' | 'desc' | 'none' = 'none';

  agInit(params: IconHeaderParams) {
    this.params = params;

    params.column.addEventListener('sortChanged', this.onSortChanged.bind(this));
    this.onSortChanged();
  }

  onSortChanged() {
    this.sort = (this.params?.column.getSort() as 'asc' | 'desc' | null) ?? 'none';
  }

  sortClicked(event: MouseEvent) {
    this.params?.progressSort(event.shiftKey);
  }

  refresh(): boolean {
    return false;
  }
}
