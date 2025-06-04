import { Directive, EventEmitter, HostListener, Output } from "@angular/core";
import { AgGridEvent, ColumnApi, GridApi } from "ag-grid-community";
import { AgGridFormatterService } from "./ag-grid-formatter.service";

@Directive({
  selector: "ag-grid-angular[appAgGrid]",
  standalone: false,
})
export class AgGridDirective {
  gridApi?: GridApi;
  columnApi?: ColumnApi;

  @HostListener("gridReady", ["$event"]) gridReady(event: AgGridEvent<any>) {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    this.agGridReady.emit();
  }

  @Output() agGridReady = new EventEmitter();

  constructor(private formatter: AgGridFormatterService) {}

  export<T>(filename: string, averageValueColumns?: (keyof T)[]) {
    const topRow = this.gridApi?.getPinnedTopRow(0)?.data;

    this.gridApi?.setPinnedTopRowData([
      {
        ...topRow,
        lineInfo: {
          serviceNumber: "Total",
          serviceName: "",
          ...topRow.lineInfo,
        },
        stopInfo: {
          ...topRow.stopInfo,
          stopName: "Total:",
        },
      },
    ]);

    this.gridApi?.exportDataAsCsv({
      fileName: filename,
      allColumns: true,
      skipPinnedTop: false,
      processCellCallback: (cell) => {
        const columnId = cell.column.getColId();
        if (columnId.endsWith("Pct")) {
          return this.formatter.percentValueFormatter(cell);
        } else if (
          averageValueColumns?.includes(columnId as keyof T) ||
          columnId.endsWith("PctTime")
        ) {
          return this.formatter.averageColumnValueExportFormatter(cell);
        }
        return cell.value;
      },
      processHeaderCallback: (cell) => {
        const columnId = cell.column.getColId();
        const headerName = cell.column.getDefinition().headerName;
        if (
          averageValueColumns?.includes(columnId as keyof T) ||
          columnId.endsWith("PctTime")
        ) {
          return `${headerName} (seconds)`;
        }

        if (columnId.endsWith("Pct")) {
          return `${headerName} (percentage)`;
        }
        return headerName ?? "";
      },
    });

    this.gridApi?.setPinnedTopRowData(topRow);
  }
}
