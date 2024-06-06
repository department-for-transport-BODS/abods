import { Component, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { Params, QueryParamsHandling } from '@angular/router';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface RouterLinkCellRendererParams extends ICellRendererParams {
  routerLinkGetter: (params: ICellRendererParams) => unknown[] | string | null;
  queryParamsGetter?: (params: ICellRendererParams) => Params | null;
  queryParams?: (params: ICellRendererParams) => Params | null;
  queryParamsHandling?: QueryParamsHandling;
  bold?: boolean;
  noWrap?: boolean;
  textOverflow?: 'ellipsis' | 'visible' | 'clip';
  display: 'block' | 'flex';
  flexDirection: 'row' | 'row-reverse';
}

@Component({
  template: `<div class="router-link-cell" [ngClass]="classNames">
    <a
      #link
      class="govuk-link"
      [routerLink]="routerLink"
      [queryParams]="queryParams"
      [queryParamsHandling]="queryParamsHandling"
      >{{ label }}</a
    >
  </div>`,
  styleUrls: ['./router-link-cell.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RouterLinkCellRendererComponent implements AgRendererComponent {
  label?: string;
  routerLink?: unknown[] | string | null;
  queryParams?: Params | null;
  queryParamsHandling?: QueryParamsHandling | null;
  bold?: boolean;
  noWrap?: boolean;
  textOverflow?: 'ellipsis' | 'visible' | 'clip';
  display?: 'block' | 'flex';
  flexDirection?: 'row' | 'row-reverse';

  @ViewChild('link') linkElement?: ElementRef<HTMLElement>;

  refresh(params: RouterLinkCellRendererParams): boolean {
    this.agInit(params);
    return true;
  }

  agInit(params: RouterLinkCellRendererParams) {
    this.label = params.valueFormatted ?? params.value;
    this.routerLink = params.routerLinkGetter(params);
    if (params.queryParams) {
      this.queryParams = params.queryParams;
    } else {
      this.queryParams = params.queryParamsGetter?.(params);
    }
    this.queryParamsHandling = params.queryParamsHandling;
    this.bold = params.bold;
    this.noWrap = params.noWrap;
    this.textOverflow = params.textOverflow ?? 'ellipsis';
    this.display = params.display;
    this.flexDirection = params.flexDirection;

    // accessibility - ag-grid seems to swallow keyboard events.
    params.eGridCell.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        this.linkElement?.nativeElement.click();
      }
    });
  }

  get classNames() {
    return {
      'router-link-cell--bold': this.bold,
      'router-link-cell--no-wrap': this.noWrap,
      [`router-link-cell--overflow-${this.textOverflow}`]: this.textOverflow,
      'router-link-cell--flex-row': this.display === 'flex' && this.flexDirection === 'row',
      'router-link-cell--flex-row-reverse': this.display === 'flex' && this.flexDirection === 'row-reverse',
    };
  }
}
