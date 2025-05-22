import { Component, EventEmitter, Input, Output } from "@angular/core";
import { StopPerformance } from "../on-time.service";
import { TimingRendererComponent } from "./timing-renderer/timing-renderer.component";
import { SelectableTextCellRendererComponent } from "src/app/shared/components/ag-grid/selectable-text-cell/selectable-text-cell.component";
import { ColumnDescription } from "../on-time-grid/on-time-grid.component";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { ConfigService } from "../../config/config.service";
import { map } from "rxjs/operators";
import { FeatureFlag } from "../../../generated/graphql";

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
    (cellClicked)="handleCellClicked($event)"
  />`,
  standalone: false,
})
export class StopsGridComponentDisplayComponent {
  @Input() data?: StopPerformance[];
  @Input() loading = true;
  @Input() errored = false;
  @Input() paginate = false;
  @Input() csvFilename: string | undefined;

  columnDescriptions: ColumnDescription[] = this.enableDirection()
    ? [
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
            data.onTimeInSeconds,
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
            data.lateInSeconds,
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
            data.earlyInSeconds,
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
      ]
    : [
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
          isHideable: true,
          isDefaultShown: false,
          headerName: "Direction",
          sortable: true,
          unSortIcon: true,
          flex: 2,
          maxWidth: 130,
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
            data.onTimeInSeconds,
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
            data.lateInSeconds,
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
            data.earlyInSeconds,
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

  handleCellClicked($event: { column: string; data: StopPerformance }) {
    if ($event.column === "stopName") {
      this.stopNameClicked.emit($event.data);
    }
  }

  constructor(
    private authUserService: AuthenticatedUserService,
    private config: ConfigService,
  ) {}

  enableDirection() {
    let isDirectionEnabled = true;
    this.authUserService.authenticatedUser$
      .pipe(
        map((info) =>
          this.config.hasFlag(info, FeatureFlag.DirectionsDisabled),
        ),
      )
      .subscribe((value) => {
        isDirectionEnabled = value;
      });

    return isDirectionEnabled;
  }
}
