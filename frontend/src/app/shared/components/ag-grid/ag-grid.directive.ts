import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { AgGridEvent, ColumnApi, GridApi } from 'ag-grid-community';
import { AgGridFormatterService } from './ag-grid-formatter.service';

@Directive({
  selector: 'ag-grid-angular[appAgGrid]',
})
export class AgGridDirective {
  gridApi?: GridApi;
  columnApi?: ColumnApi;

  @HostListener('gridReady', ['$event']) gridReady(event: AgGridEvent<any>) {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    this.agGridReady.emit();
  }

  @Output() agGridReady = new EventEmitter();

  constructor(private formatter: AgGridFormatterService) {}

  export(filename: string) {
    this.gridApi?.exportDataAsCsv({
      fileName: filename,
      allColumns: true,
      skipPinnedTop: true,
      processCellCallback: (cell) => {
        const columnId = cell.column.getColId();
        if (columnId.endsWith('Pct')) {
          return this.formatter.percentValueFormatter(cell);
        } else if (columnId === 'averageDelay') {
          return this.formatter.averageDelayValueExportFormatter(cell);
        }
        return cell.value;
      },
      processHeaderCallback: (cell) => {
        const columnId = cell.column.getColId();
        if (columnId === 'averageDelay') {
          return 'Av. delay (seconds)';
        }
        return cell.column.getDefinition().headerName ?? '';
      },
    });
  }
}
