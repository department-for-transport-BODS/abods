import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GridOptions, AgGridEvent, GridApi, ICellRendererParams, ColDef } from 'ag-grid-community';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { BasicOperatorFragment, Maybe, VehicleStatFragment } from 'src/generated/graphql';
import { FeedMonitoringService } from './feed-monitoring.service';
import { ActiveCellComponent } from './grid/active-cell.component';
import { SparklineCellTemplateComponent } from './grid/sparkline-cell-template.component';
import { SparklineCellComponent } from './grid/sparkline-cell.component';
import { DateTime } from 'luxon';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterLinkCellRendererComponent } from '../shared/components/ag-grid/router-link-cell/router-link-cell.component';
import { SelectableTextCellRendererComponent } from '../shared/components/ag-grid/selectable-text-cell/selectable-text-cell.component';

@Component({
  selector: 'app-feed-monitoring',
  templateUrl: './feed-monitoring.component.html',
  styleUrls: ['./feed-monitoring.component.scss'],
})
export class FeedMonitoringComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(private router: Router, private route: ActivatedRoute, private fmService: FeedMonitoringService) {}

  @ViewChild(SparklineCellTemplateComponent) sparklineTemplate?: SparklineCellTemplateComponent;

  activeFilterSubject = new Subject<string>();

  loaded = false;

  public getDefaultGridOptions = (): GridOptions => {
    return {
      headerHeight: 45,
      rowHeight: 57,
      rowSelection: 'single',
      suppressCellSelection: false,
      suppressDragLeaveHidesColumns: true,
    };
  };
  public inactiveGridApi?: GridApi;
  public activeGridApi?: GridApi;

  inactiveGridReady = new BehaviorSubject<boolean>(false);
  activeGridReady = new BehaviorSubject<boolean>(false);

  activeColumnIds = ['active', 'nocCode', 'name', 'availability', 'updateFrequency', 'lastOutage', 'sparkline'];
  inactiveColumnIds = ['active', 'nocCode', 'name', 'availability', 'updateFrequency', 'unavailableSince', 'sparkline'];

  public defaultColDef = {
    autoHeight: false,
    resizable: false,
    minWidth: 155,
    wrapText: false,
    suppressNavigable: true,
    suppressMovable: true,
  };

  allColumns = [
    {
      colId: 'active',
      valueGetter: ({
        data: {
          feedMonitoring: { feedStatus },
        },
      }: {
        data: { feedMonitoring: { feedStatus: boolean } };
      }) => feedStatus,
      cellRenderer: ActiveCellComponent,
      pinned: 'left',
      minWidth: 36,
      width: 36,
      suppressNavigable: true,
      suppressSizeToFit: true,
      cellClass: 'ag-cell-active-icon',
      lockPosition: true,
    },
    {
      colId: 'nocCode',
      field: 'nocCode',
      headerName: 'NOC',
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: { noWrap: true, textOverflow: 'visible' },
      pinned: 'left',
      suppressNavigable: false,
      lockPosition: true,
      maxWidth: 90,
    },
    {
      colId: 'name',
      field: 'name',
      headerName: 'Operator',
      cellRenderer: RouterLinkCellRendererComponent,
      cellRendererParams: {
        noWrap: true,
        bold: true,
        routerLinkGetter: (params: ICellRendererParams) => [params.data.nocCode],
      },
      pinned: 'left',
      minWidth: 170,
      maxWidth: 470,
      wrapText: false,
      suppressNavigable: false,
      lockPosition: true,
    },
    {
      colId: 'availability',
      headerName: 'Feed availability',
      valueGetter: ({
        data: {
          feedMonitoring: { availability },
        },
      }: {
        data: { feedMonitoring: { availability: number } };
      }) => availability,
      valueFormatter: ({ value }: { value: number }) => `${(value * 100).toFixed(1)}%`,
      sortable: true,
      unSortIcon: true,
      minWidth: 100,
      maxWidth: 200,
    },
    {
      colId: 'updateFrequency',
      headerName: 'Update frequency',
      valueGetter: ({
        data: {
          feedMonitoring: {
            liveStats: { updateFrequency },
          },
        },
      }: {
        data: { feedMonitoring: { liveStats: { updateFrequency: number } } };
      }) => updateFrequency,
      valueFormatter: ({ value }: { value: number }) => (value ? `${value}s` : '-'),
      sortable: true,
      unSortIcon: true,
      minWidth: 100,
      maxWidth: 200,
    },
    {
      colId: 'lastOutage',
      headerName: 'Last outage',
      valueGetter: ({
        data: {
          feedMonitoring: { lastOutage },
        },
      }: {
        data: { feedMonitoring: { lastOutage: string } };
      }) => (lastOutage ? DateTime.fromISO(lastOutage, { zone: 'utc' }) : null),
      valueFormatter: ({ value }: { value: DateTime }) => value?.toRelative(),
      sortable: true,
      unSortIcon: true,
      minWidth: 155,
      maxWidth: 200,
    },
    {
      colId: 'unavailableSince',
      headerName: 'Unavailable since',
      valueGetter: ({
        data: {
          feedMonitoring: { unavailableSince },
        },
      }: {
        data: { feedMonitoring: { unavailableSince: string } };
      }) => (unavailableSince ? DateTime.fromISO(unavailableSince, { zone: 'utc' }) : null),
      valueFormatter: ({ value }: { value: DateTime }) => value?.toRelative(),
      sortable: true,
      unSortIcon: true,
      minWidth: 155,
      maxWidth: 200,
      cellClass: 'ag-cell-error',
    },
    {
      colId: 'sparkline',
      valueGetter: ({ data: { operatorId } }: { data: { operatorId: string } }) =>
        this.sparklineStats.find((stat) => stat.operatorId === operatorId)?.last24Hours,
      cellRenderer: SparklineCellComponent,
      minWidth: 300,
      maxWidth: 500,
      cellClass: 'ag-cell-last',
    },
  ];

  activeColumns = this.activeColumnIds.map((c) => this.allColumns.find(({ colId }) => c === colId) as ColDef);
  inactiveColumns = this.inactiveColumnIds.map((c) => this.allColumns.find(({ colId }) => c === colId) as ColDef);

  rawActiveOperators: Array<BasicOperatorFragment> = [];
  filteredActiveOperators: Array<BasicOperatorFragment> = [];
  inactiveOperators: Array<BasicOperatorFragment> = [];

  sparklineStats: { operatorId?: string | null; last24Hours: VehicleStatFragment[] }[] = [];

  context: { sparklineTemplate?: SparklineCellTemplateComponent } = {};

  subs: Subscription[] = [];

  ngOnInit(): void {
    this.subs.push(
      this.fmService.fetchFeedMonitoringList().subscribe((operators) => {
        if (!operators) {
          console.error('Error loading operators');
        } else {
          if (operators.length === 1) {
            this.router.navigate([operators[0].nocCode], { relativeTo: this.route, skipLocationChange: true });
          } else if (operators.length > 0) {
            this.rawActiveOperators = operators.filter(({ feedMonitoring: { feedStatus } }) => feedStatus);
            this.filteredActiveOperators = this.rawActiveOperators;
            this.inactiveOperators = operators.filter(({ feedMonitoring: { feedStatus } }) => !feedStatus);
            this.loaded = true;
          }
        }
      }),
      this.activeFilterSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((activeFilter) => {
        if (!activeFilter) {
          this.filteredActiveOperators = this.rawActiveOperators;
        } else {
          const normalise = (s: Maybe<string> | undefined) => (s ? s.replace(/[^\w]+/g, '') : '');
          const reg = new RegExp(normalise(activeFilter), 'i');
          this.filteredActiveOperators = this.rawActiveOperators.filter(
            (operator) => normalise(operator.name).match(reg) || operator.nocCode?.match(reg)
          );
        }
        this.activeGridApi?.paginationGoToFirstPage();
      })
    );
  }

  ngAfterViewInit(): void {
    this.context = { sparklineTemplate: this.sparklineTemplate };
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => sub?.unsubscribe());
  }

  onInactiveGridReady(params: AgGridEvent<any>) {
    this.inactiveGridApi = params.api;
    this.inactiveGridApi.sizeColumnsToFit();
    this.inactiveGridApi.resetRowHeights();
    this.inactiveGridReady.next(true);
  }

  onActiveGridReady(params: AgGridEvent<any>) {
    this.activeGridApi = params.api;
    this.activeGridApi.sizeColumnsToFit();
    this.activeGridApi.resetRowHeights();
    this.activeGridReady.next(true);
  }

  activeFilterChanged(event: Event) {
    this.activeFilterSubject.next((event.target as HTMLInputElement).value);
  }

  postSortRows() {
    this.activeGridApi?.paginationGoToFirstPage();
  }

  paginationChanged({ api }: AgGridEvent<any>) {
    const rows = api
      .getRenderedNodes()
      .filter(
        ({ data: { operatorId } }) =>
          !this.sparklineStats.some(({ operatorId: existingOperatorId }) => existingOperatorId === operatorId)
      );

    if (rows.length > 0) {
      this.subs.push(
        this.fmService.fetchOperatorSparklines(rows.map(({ data: { operatorId } }) => operatorId)).subscribe((data) => {
          if (data) {
            this.sparklineStats.push(...data);
            api.refreshCells({ rowNodes: rows });
          }
        })
      );
    }
  }
}
