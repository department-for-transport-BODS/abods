import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { DateTime } from 'luxon';
import { of, ReplaySubject, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { IconCellRendererComponent } from 'src/app/shared/components/ag-grid/icon-cell/icon-cell-renderer.component';
import { RouterLinkCellRendererComponent } from 'src/app/shared/components/ag-grid/router-link-cell/router-link-cell.component';
import { ColumnDescription } from '../on-time-grid/on-time-grid.component';
import { OnTimeService, PerformanceParams, ServicePerformance } from '../on-time.service';
import { IconHeaderComponent } from '../../shared/components/ag-grid/icon-header/icon-header.component';
import { PerformanceService } from '../performance.service';
import { EmptyCellComponent } from '../../shared/components/ag-grid/empty-cell/empty-cell.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-service-grid',
  template: `<app-on-time-grid
    noun="service"
    [columnDescriptions]="columnDescriptions"
    [errored]="errored"
    [loading]="loading"
    [data]="data"
    [totalData]="totalData"
    [csvFilename]="csvFilename"
  ></app-on-time-grid>`,
})
export class ServiceGridComponent implements OnInit, OnDestroy {
  columnDescriptions: ColumnDescription[] = [
    {
      title: 'Frequent service',
      columnType: 'Normal',
      isDefaultShown: true,
      isHideable: true,
      field: 'frequent',
      colId: 'freq',
      headerComponent: IconHeaderComponent,
      headerComponentParams: { src: '/assets/icons/frequent.svg', tooltip: 'Service has periods of frequent running.' },
      headerName: 'Frequent service',
      cellRenderer: IconCellRendererComponent,
      cellRendererParams: { src: '/assets/icons/frequent.svg', label: 'Frequent service' },
      cellRendererSelector: (params) => {
        if (params.node.rowPinned) {
          return {
            component: EmptyCellComponent,
          };
        }
      },
      minWidth: 60,
      width: 60,
      maxWidth: 60,
      cellClass: 'govuk-!-padding-left-3',
      headerClass: 'govuk-!-padding-left-3 govuk-!-padding-right-0',
      sortable: true,
      unSortIcon: true,
    },
    {
      title: 'Service',
      columnType: 'Permanent',
      isDefaultShown: true,
      isHideable: false,
      autoHeight: true,
      colId: 'service',
      valueGetter: ({ data }) => `${data.lineInfo?.serviceNumber}: ${data.lineInfo?.serviceName}`,
      headerName: 'Service',
      cellRenderer: RouterLinkCellRendererComponent,
      cellRendererParams: {
        routerLinkGetter: (params: ICellRendererParams) => [params.data.lineId],
        queryParamsHandling: 'preserve',
      },
      cellRendererSelector: (params) => {
        if (params.node.rowPinned) {
          return {
            component: EmptyCellComponent,
          };
        }
      },
      suppressNavigable: false,
      minWidth: 250,
      flex: 1,
      getQuickFilterText: ({ value }) => value,
    },
    {
      title: 'Scheduled departures',
      columnType: 'Normal',
      isDefaultShown: true,
      isHideable: true,
      colId: 'scheduledDepartures',
      field: 'scheduledDepartures',
      headerName: 'Scheduled departures',
      sortable: true,
      unSortIcon: true,
      maxWidth: 160,
      type: 'numericColumn',
    },
    {
      title: 'Recorded departures',
      columnType: 'WithPct',
      isDefaultShown: true,
      isHideable: true,
      colId: 'completed',
      field: 'actualDepartures',
      pctValueGetter: ({ data }) => data.actualDepartures / data.scheduledDepartures || 0,
      headerName: 'Recorded departures',
      sortable: true,
      unSortIcon: true,
      maxWidth: 130,
      type: 'numericColumn',
    },
    {
      title: 'Average delay',
      columnType: 'AvDelay',
      isDefaultShown: true,
      isHideable: true,
      colId: 'averageDelay',
      field: 'averageDelay',
      headerName: 'Av. delay',
      sortable: true,
      unSortIcon: true,
      maxWidth: 130,
      type: 'numericColumn',
    },
    {
      title: 'On time',
      columnType: 'WithPct',
      isDefaultShown: true,
      isHideable: true,
      colId: 'onTime',
      field: 'onTime',
      pctField: 'onTimeRatio',
      headerName: 'On time',
      sortable: true,
      unSortIcon: true,
      maxWidth: 130,
      type: 'numericColumn',
    },
    {
      title: 'Late',
      columnType: 'WithPct',
      isDefaultShown: true,
      isHideable: true,
      colId: 'late',
      field: 'late',
      pctField: 'lateRatio',
      headerName: 'Late',
      sortable: true,
      unSortIcon: true,
      maxWidth: 130,
      type: 'numericColumn',
    },
    {
      title: 'Early',
      columnType: 'WithPct',
      isDefaultShown: true,
      isHideable: true,
      colId: 'early',
      field: 'early',
      pctField: 'earlyRatio',
      headerName: 'Early',
      sortable: true,
      unSortIcon: true,
      maxWidth: 130,
      type: 'numericColumn',
      // adding ag-header-cell-last removes ag-right-aligned-header so add it manually also
      headerClass: 'ag-header-cell-last ag-right-aligned-header',
      cellClass: 'ag-cell-last ag-right-aligned-cell', // adding ag-cell-last removes ag-right-aligned-cell so add it manually also
    },
  ];

  errored = false;
  loading = true;
  csvFilename = 'Service_Performance';

  data: ServicePerformance[] = [];
  totalData: ServicePerformance[] = [];

  @Input()
  set params(params: PerformanceParams | null) {
    if (params) {
      this.params$.next(params);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>(1);

  constructor(
    private performanceService: PerformanceService,
    private onTimeService: OnTimeService,
    private route: ActivatedRoute
  ) {}

  destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.params$
      .pipe(
        tap((ps) => {
          this.errored = false;
          this.loading = true;
          this.csvFilename = this.calcCsvFilename(ps);
        }),
        switchMap((params: PerformanceParams) =>
          this.performanceService.fetchServicePerformance(params).pipe(
            catchError(() => {
              this.errored = true;
              return of(null); // Swallow the error, allowing the outer pipeline to continue
            })
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.data = (data ?? []).sort((a, b) =>
          a.lineInfo.serviceNumber.localeCompare(b.lineInfo.serviceNumber, undefined, { numeric: true })
        );
        this.totalData = this.onTimeService.calculateTotals(this.data);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calcCsvFilename({ fromTimestamp, toTimestamp }: PerformanceParams) {
    const inclusiveTo = DateTime.fromISO(toTimestamp).minus({ minute: 1 });
    const noc = this.route.snapshot.paramMap.get('nocCode');
    return `Service_Performance_${noc}_${DateTime.fromISO(fromTimestamp).toFormat('yy-MM-dd')}_-_${inclusiveTo.toFormat(
      'yy-MM-dd'
    )}`;
  }
}
