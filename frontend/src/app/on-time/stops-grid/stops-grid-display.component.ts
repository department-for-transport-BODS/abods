import { Component, EventEmitter, Input, Output } from "@angular/core";
import { StopPerformance } from "../on-time.service";
import { TimingRendererComponent } from "./timing-renderer/timing-renderer.component";
import { SelectableTextCellRendererComponent } from "src/app/shared/components/ag-grid/selectable-text-cell/selectable-text-cell.component";
import { ColumnDescription } from "../on-time-grid/on-time-grid.component";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { ConfigService } from "../../config/config.service";
import { Direction } from "../../../generated/graphql";

@Component({
  selector: "app-stops-grid-display",
  template: `<app-on-time-grid
    noun="stop"
    [columnDescriptions]="columnDescriptions"
    [errored]="errored"
    [loading]="loading"
    [data]="data"
    [csvFilename]="csvFilename"
    [paginate]="paginate"
    [preSelectedDirections]="preSelectedDirections"
    (cellClicked)="handleCellClicked($event)"
    (directionsChanged)="onDirectionChange($event)"
  />`,
  standalone: false,
})
export class StopsGridComponentDisplayComponent {
  @Input() data?: StopPerformance[];
  @Input() loading = true;
  @Input() errored = false;
  @Input() paginate = false;
  @Input() csvFilename: string | undefined;
  @Input() preSelectedDirections: Direction[] = [];

  columnDescriptions: ColumnDescription[] = [
    {
      title: "NAPTAN",
      columnType: "Permanent",
      isHideable: false,
      isDefaultShown: true,
      colId: "naptan",
      headerName: "NAPTAN",
      valueGetter: ({ data }: { data: StopPerformance }) => data.stopId,
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: { noWrap: true, textOverflow: "visible" },
      minWidth: 150,
      flex: 2,
      getQuickFilterText: ({ value }) => value,
    },
    {
      title: "Timing Point",
      columnType: "Normal",
      isHideable: true,
      isDefaultShown: true,
      colId: "timingPoint",
      field: "timingPoint",
      headerComponent: TimingRendererComponent,
      headerComponentParams: { value: true },
      cellRenderer: TimingRendererComponent,
      maxWidth: 50,
      minWidth: 50,
      width: 50,
      headerName: "Timing point",
    },
    {
      title: "Name",
      columnType: "Normal",
      isHideable: true,
      isDefaultShown: true,
      colId: "stopName",
      field: "stopName",
      headerName: "Name",
      valueGetter: ({ data }: { data: StopPerformance }) =>
        data.stopInfo?.stopName,
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: {
        noWrap: true,
        textOverflow: "visible",
        tooltipValueGetter: ({ data }: { data: StopPerformance }) => {
          if (data.stopInfo?.stopLocality) {
            const { localityName, localityAreaName } =
              data.stopInfo.stopLocality;
            return `${localityName}, ${localityAreaName}`;
          }
        },
      },
      flex: 6, // Should mean name takes the available width over NAPTAN (unless it's hidden)
      minWidth: 200,
      wrapText: true,
      getQuickFilterText: ({ value }) => value,
    },
    {
      title: "Direction",
      columnType: "Camelcase",
      colId: "direction",
      field: "direction",
      valueGetter: ({ data }: { data: StopPerformance }) =>
        data.direction ?? "-",
      isHideable: true,
      isDefaultShown: true,
      headerName: "Direction",
      sortable: true,
      unSortIcon: true,
      flex: 2,
      maxWidth: 130,
      cellClass: "govuk-!-padding-left-3",
    },
    {
      title: "Scheduled departures",
      columnType: "Normal",
      isHideable: true,
      isDefaultShown: true,
      colId: "scheduledDepartures",
      field: "scheduledDepartures",
      headerName: "Scheduled departures",
      sortable: true,
      unSortIcon: true,
      maxWidth: 160,
      flex: 2,
      type: "numericColumn",
    },
    {
      title: "Recorded departures",
      columnType: "WithPct",
      colId: "completed",
      field: "actualDepartures",
      isHideable: true,
      isDefaultShown: true,
      headerName: "Recorded departures",
      pctValueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures / data.scheduledDepartures || 0,
      sortable: true,
      unSortIcon: true,
      maxWidth: 130,
      flex: 2,
      type: "numericColumn",
    },
    {
      title: "Average scheduled",
      columnType: "AvDelay",
      colId: "averageScheduled",
      field: "averageScheduled",
      isHideable: true,
      isDefaultShown: true,
      headerName: "Av. Scheduled Travel Time",
      sortable: true,
      unSortIcon: true,
      flex: 2,
      maxWidth: 130,
      type: "numericColumn",
    },
    {
      title: "Average actual",
      columnType: "AvDelay",
      colId: "averageActual",
      field: "averageActual",
      isHideable: true,
      isDefaultShown: true,
      headerName: "Av. Actual Travel Time",
      sortable: true,
      unSortIcon: true,
      flex: 2,
      maxWidth: 130,
      type: "numericColumn",
    },
    {
      title: "Average delay",
      columnType: "AvDelay",
      colId: "averageDelay",
      field: "averageDelay",
      positiveOnly: true,
      isHideable: true,
      isDefaultShown: true,
      headerName: "Av. delay",
      sortable: true,
      unSortIcon: true,
      flex: 1,
      maxWidth: 130,
      type: "numericColumn",
    },
    {
      title: "On time",
      columnType: "WithPctTime",
      isHideable: true,
      isDefaultShown: true,
      colId: "onTime",
      field: "onTime",
      pctField: "onTimeRatio",
      timeField: "onTimeInMins",
      timeValueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.onTimeInSeconds : undefined,
      valueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.onTime : undefined,
      pctValueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.onTimeRatio : undefined,
      headerName: "On time",
      sortable: true,
      unSortIcon: true,
      flex: 1,
      maxWidth: 130,
      type: "numericColumn",
    },
    {
      title: "Late",
      columnType: "WithPctTime",
      isHideable: true,
      isDefaultShown: true,
      colId: "late",
      field: "late",
      pctField: "lateRatio",
      timeField: "lateInMins",
      timeValueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.lateInSeconds : undefined,
      valueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.late : undefined,
      pctValueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.lateRatio : undefined,
      headerName: "Late",
      sortable: true,
      unSortIcon: true,
      flex: 1,
      maxWidth: 130,
      type: "numericColumn",
    },
    {
      title: "Early",
      columnType: "WithPctTime",
      isHideable: true,
      isDefaultShown: true,
      colId: "early",
      field: "early",
      pctField: "earlyRatio",
      timeField: "earlyInMins",
      timeValueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.earlyInSeconds : undefined,
      valueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.early : undefined,
      pctValueGetter: ({ data }: { data: StopPerformance }) =>
        data.actualDepartures ? data.earlyRatio : undefined,
      headerName: "Early",
      sortable: true,
      unSortIcon: true,
      maxWidth: 110,
      flex: 1,
      type: "numericColumn",
      // adding ag-header-cell-last removes ag-right-aligned-header so add it manually also
      headerClass: "ag-header-cell-last ag-right-aligned-header",
      cellClass: "ag-cell-last ag-right-aligned-cell", // adding ag-cell-last removes ag-right-aligned-cell so add it manually also
    },
  ];
  @Output() stopNameClicked = new EventEmitter<StopPerformance>();
  @Output() directionsChanged = new EventEmitter<Direction[]>();

  handleCellClicked($event: { column: string; data: StopPerformance }) {
    if ($event.column === "stopName") {
      this.stopNameClicked.emit($event.data);
    }
  }

  constructor(
    private authUserService: AuthenticatedUserService,
    private config: ConfigService,
  ) {}

  onDirectionChange($event: Direction[]) {
    this.directionsChanged.emit($event);
  }
}
