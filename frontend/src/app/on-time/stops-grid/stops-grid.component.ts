import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { OnTimeService, PerformanceParams, StopPerformance } from '../on-time.service';
import { of, ReplaySubject, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { PerformanceInputType } from '../../../generated/graphql';
import { DateTime } from 'luxon';
import { TimingRendererComponent } from './timing-renderer/timing-renderer.component';
import { SelectableTextCellRendererComponent } from 'src/app/shared/components/ag-grid/selectable-text-cell/selectable-text-cell.component';
import { ColumnDescription } from '../on-time-grid/on-time-grid.component';
import { removeAdminAreaIds } from '../view-service/view-service.component';

@Component({
  selector: 'app-stops-grid',
  template: `<app-on-time-grid
    noun="stop"
    [columnDescriptions]="columnDescriptions"
    [errored]="errored"
    [loading]="loading"
    [data]="data"
    [totalData]="total"
    [csvFilename]="csvFilename"
    [paginate]="false"
    [showFilter]="false"
  ></app-on-time-grid>`,
})
export class StopsGridComponent implements OnInit, OnDestroy {
  data?: StopPerformance[];
  total?: StopPerformance[];

  columnDescriptions: ColumnDescription[] = [
    {
      title: 'NAPTAN',
      columnType: 'Permanent',
      isHideable: false,
      isDefaultShown: true,
      colId: 'naptan',
      headerName: 'NAPTAN',
      valueGetter: ({ data }) => data.stopId?.substring(2),
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: { noWrap: true, textOverflow: 'visible' },
      minWidth: 150,
      flex: 2,
      getQuickFilterText: ({ value }) => value,
    },
    {
      title: 'Timing Point',
      columnType: 'Normal',
      isHideable: true,
      isDefaultShown: true,
      colId: 'timingPoint',
      field: 'timingPoint',
      headerComponent: TimingRendererComponent,
      headerComponentParams: { value: true },
      cellRenderer: TimingRendererComponent,
      maxWidth: 50,
      minWidth: 50,
      width: 50,
      headerName: 'Timing point',
    },
    {
      title: 'Name',
      columnType: 'Normal',
      isHideable: true,
      isDefaultShown: true,
      colId: 'stopName',
      field: 'stopName',
      headerName: 'Name',
      valueGetter: ({ data }) => data.stopInfo?.stopName,
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: {
        noWrap: true,
        textOverflow: 'visible',
        tooltipValueGetter: ({ data }: any) => {
          if (data.stopInfo?.stopLocality) {
            const { localityName, localityAreaName } = data.stopInfo.stopLocality;
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
      title: 'Scheduled departures',
      columnType: 'Normal',
      isHideable: true,
      isDefaultShown: true,
      colId: 'scheduledDepartures',
      field: 'scheduledDepartures',
      headerName: 'Scheduled departures',
      sortable: true,
      unSortIcon: true,
      maxWidth: 160,
      flex: 2,
      type: 'numericColumn',
    },
    {
      title: 'Recorded departures',
      columnType: 'WithPct',
      colId: 'completed',
      field: 'actualDepartures',
      isHideable: true,
      isDefaultShown: true,
      headerName: 'Recorded departures',
      pctValueGetter: ({ data }) => data.actualDepartures / data.scheduledDepartures || 0,
      sortable: true,
      unSortIcon: true,
      maxWidth: 130,
      flex: 2,
      type: 'numericColumn',
    },
    {
      title: 'Average delay',
      columnType: 'AvDelay',
      colId: 'averageDelay',
      field: 'averageDelay',
      isHideable: true,
      isDefaultShown: true,
      headerName: 'Av. delay',
      sortable: true,
      unSortIcon: true,
      flex: 1,
      maxWidth: 130,
      type: 'numericColumn',
    },

    {
      title: 'On time',
      columnType: 'WithPct',
      isHideable: true,
      isDefaultShown: true,
      colId: 'onTime',
      field: 'onTime',
      pctField: 'onTimeRatio',
      headerName: 'On time',
      sortable: true,
      unSortIcon: true,
      flex: 1,
      maxWidth: 130,
      type: 'numericColumn',
    },
    {
      title: 'Late',
      columnType: 'WithPct',
      isHideable: true,
      isDefaultShown: true,
      colId: 'late',
      field: 'late',
      pctField: 'lateRatio',
      headerName: 'Late',
      sortable: true,
      unSortIcon: true,
      flex: 1,
      maxWidth: 130,
      type: 'numericColumn',
    },
    {
      title: 'Early',
      columnType: 'WithPct',
      isHideable: true,
      isDefaultShown: true,
      colId: 'early',
      field: 'early',
      pctField: 'earlyRatio',
      headerName: 'Early',
      sortable: true,
      unSortIcon: true,
      maxWidth: 110,
      flex: 1,
      type: 'numericColumn',
      // adding ag-header-cell-last removes ag-right-aligned-header so add it manually also
      headerClass: 'ag-header-cell-last ag-right-aligned-header',
      cellClass: 'ag-cell-last ag-right-aligned-cell', // adding ag-cell-last removes ag-right-aligned-cell so add it manually also
    },
  ];

  loading = true;
  errored = false;

  csvFilename = 'Stop_Performance';
  destroy$ = new Subject<void>();

  @Input()
  set params(params: PerformanceParams | null) {
    if (params) {
      this.params$.next(params);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>(1);

  constructor(private onTimeService: OnTimeService) {}

  ngOnInit() {
    this.params$
      .pipe(
        tap((ps) => {
          this.loading = true;
          this.errored = false;
          this.csvFilename = this.calcCsvFilename(ps);
        }),
        map((params) => removeAdminAreaIds(params)),
        switchMap((params) =>
          this.onTimeService.fetchStopPerformanceList(params as PerformanceInputType).pipe(
            catchError(() => {
              this.errored = true;
              return of([]); // Swallow the error, allowing the outer pipeline to continue
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.data = data;
        this.total = this.onTimeService.calculateTotals(data);
        this.loading = false;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calcCsvFilename({ fromTimestamp, toTimestamp, filters: { lineIds } }: PerformanceParams) {
    const inclusiveTo = DateTime.fromISO(toTimestamp).minus({ minute: 1 });
    return `Stop_Performance_${lineIds?.[0]}_${DateTime.fromISO(fromTimestamp).toFormat(
      'yy-MM-dd'
    )}_-_${inclusiveTo.toFormat('yy-MM-dd')}`;
  }
}
