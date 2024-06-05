import { Component, Input } from '@angular/core';
import { GridApi, PaginationChangedEvent } from 'ag-grid-community';

const MINIMUM_PAGES = 8;
const STICKY_THRESHOLD = 4;
const PAGES_STICKY = 5;
const PAGES_MIDDLE = 3;

@Component({
  selector: 'app-paging-panel',
  templateUrl: 'paging-panel.component.html',
  styleUrls: ['./paging-panel.component.scss'],
})
export class PagingPanelComponent {
  @Input() noun = 'row';
  firstRow?: number;
  lastRow?: number;
  current?: number;
  total?: number;
  rowCount?: number;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  stickToStart?: boolean;
  stickToEnd?: boolean;
  pages?: number[];

  private gridApi?: GridApi;

  paginationChanged({ api }: PaginationChangedEvent) {
    this.gridApi = api;
    const pageSize = api.paginationGetPageSize() ?? 0;
    this.current = api.paginationGetCurrentPage() ?? 0;
    this.total = api.paginationGetTotalPages() ?? 0;
    this.rowCount = api.paginationGetRowCount() ?? 0;

    this.firstRow = this.total === 0 ? 0 : pageSize * this.current + 1;
    this.lastRow = this.total === 0 ? 0 : Math.min(this.firstRow + pageSize - 1, this.rowCount);

    this.isFirstPage = this.current === 0;
    this.isLastPage = this.current === this.total - 1;

    this.stickToStart = this.total <= MINIMUM_PAGES || this.current < STICKY_THRESHOLD;
    this.stickToEnd = this.total <= MINIMUM_PAGES || this.total - this.current - 1 < STICKY_THRESHOLD;

    const offset = this.stickToStart
      ? 0
      : this.stickToEnd
      ? this.total - STICKY_THRESHOLD - 1
      : this.current - Math.floor(PAGES_MIDDLE / 2);
    const numPages =
      this.total <= MINIMUM_PAGES
        ? this.total
        : Math.min(this.total, this.stickToStart || this.stickToEnd ? PAGES_STICKY : PAGES_MIDDLE);

    this.pages = Array(numPages)
      .fill(0)
      .map((_, i) => i + offset);
  }

  firstPage() {
    this.gridApi?.paginationGoToFirstPage();
  }

  previousPage() {
    this.gridApi?.paginationGoToPreviousPage();
  }

  goToPage(page: number) {
    this.gridApi?.paginationGoToPage(page);
  }

  nextPage() {
    this.gridApi?.paginationGoToNextPage();
  }

  lastPage() {
    this.gridApi?.paginationGoToLastPage();
  }

  get pluralNoun(): string {
    return `${this.noun}${this.total && this.total > 1 ? 's' : ''}`; // Good enough for now as we don't have any irregular plurals
  }
}
