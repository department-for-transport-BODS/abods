import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Encapsulates AG-Grids necessary evil DOM manipulation, to keep it as isolated as possible.
 * TODO maybe moved to shared if this get re-used somewhere
 */
@Injectable({ providedIn: 'root' })
export class AgGridDomService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  viewportHeight(): number | undefined {
    return this.document.querySelector('.ag-body-viewport')?.clientHeight;
  }

  headerHeight(): number {
    // Not the solution I would have chosen, but this method is from ag-grid's official blog
    const headers = Array.from(this.document.querySelectorAll('.ag-header-cell-text'));
    return Math.max(...headers.map((elem) => elem.clientHeight));
  }
}
