import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ICellRendererParams } from "ag-grid-community";
import { DateTime } from "luxon";
import { of, ReplaySubject, Subject } from "rxjs";
import { catchError, map, switchMap, takeUntil, tap } from "rxjs/operators";
import { IconCellRendererComponent } from "src/app/shared/components/ag-grid/icon-cell/icon-cell-renderer.component";
import { RouterLinkCellRendererComponent } from "src/app/shared/components/ag-grid/router-link-cell/router-link-cell.component";
import { ColumnDescription } from "../on-time-grid/on-time-grid.component";
import { PerformanceParams, ServicePerformance } from "../on-time.service";
import { IconHeaderComponent } from "../../shared/components/ag-grid/icon-header/icon-header.component";
import { PerformanceService } from "../performance.service";
import { EmptyCellComponent } from "../../shared/components/ag-grid/empty-cell/empty-cell.component";
import { ActivatedRoute } from "@angular/router";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { ConfigService } from "../../config/config.service";
import { Direction, FeatureFlag } from "../../../generated/graphql";

@Component({
  selector: "app-service-grid",
  template: `<app-on-time-grid
    noun="service"
    [columnDescriptions]="columnDescriptions"
    [errored]="errored"
    [loading]="loading"
    [data]="data"
    [csvFilename]="csvFilename"
    [paginate]="true"
    [showFilter]="true"
    [preSelectedDirections]="preSelectedDirections"
    (directionsChanged)="onDirectionChange($event)"
  ></app-on-time-grid>`,
  standalone: false,
})
export class ServiceGridComponent implements OnInit, OnChanges, OnDestroy {
  columnDescriptions: ColumnDescription[] = this.isDirectionsDisabled()
    ? [
        {
          title: "Frequent service",
          columnType: "Normal",
          isDefaultShown: true,
          isHideable: true,
          field: "frequent",
          colId: "freq",
          headerComponent: IconHeaderComponent,
          headerComponentParams: {
            src: "/assets/icons/frequent.svg",
            tooltip: "Service has periods of frequent running.",
          },
          headerName: "Frequent service",
          cellRenderer: IconCellRendererComponent,
          cellRendererParams: {
            src: "/assets/icons/frequent.svg",
            label: "Frequent service",
          },
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
          cellClass: "govuk-!-padding-left-3",
          headerClass: "govuk-!-padding-left-3 govuk-!-padding-right-0",
          sortable: true,
          unSortIcon: true,
        },
        {
          title: "Service",
          columnType: "Permanent",
          isDefaultShown: true,
          isHideable: false,
          autoHeight: true,
          colId: "service",
          valueGetter: ({ data }) =>
            `${data.lineInfo?.serviceNumber}: ${data.lineInfo?.serviceName}`,
          headerName: "Service",
          cellRenderer: RouterLinkCellRendererComponent,
          cellRendererParams: {
            routerLinkGetter: (params: ICellRendererParams) => [
              params.data.lineId,
            ],
            queryParamsHandling: "preserve",
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
          title: "Scheduled departures",
          columnType: "Normal",
          isDefaultShown: true,
          isHideable: true,
          colId: "scheduledDepartures",
          field: "scheduledDepartures",
          headerName: "Scheduled departures",
          sortable: true,
          unSortIcon: true,
          maxWidth: 160,
          type: "numericColumn",
        },
        {
          title: "Recorded departures",
          columnType: "WithPct",
          isDefaultShown: true,
          isHideable: true,
          colId: "completed",
          field: "actualDepartures",
          pctValueGetter: ({ data }) =>
            data.actualDepartures / data.scheduledDepartures || 0,
          headerName: "Recorded departures",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "Average delay",
          columnType: "AvDelay",
          isDefaultShown: true,
          isHideable: true,
          colId: "averageDelay",
          field: "averageDelay",
          headerName: "Av. delay",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "On time",
          columnType: "WithPctTime",
          isDefaultShown: true,
          isHideable: true,
          colId: "onTime",
          field: "onTime",
          pctField: "onTimeRatio",
          timeField: "onTimeInMins",
          timeValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.onTimeInSeconds,
          headerName: "On time",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "Late",
          columnType: "WithPctTime",
          isDefaultShown: true,
          isHideable: true,
          colId: "late",
          field: "late",
          pctField: "lateRatio",
          timeField: "lateInMins",
          timeValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.lateInSeconds,
          headerName: "Late",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "Early",
          columnType: "WithPctTime",
          isDefaultShown: true,
          isHideable: true,
          colId: "early",
          field: "early",
          pctField: "earlyRatio",
          timeField: "earlyInMins",
          timeValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.earlyInSeconds,
          headerName: "Early",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
          // adding ag-header-cell-last removes ag-right-aligned-header so add it manually also
          headerClass: "ag-header-cell-last ag-right-aligned-header",
          cellClass: "ag-cell-last ag-right-aligned-cell", // adding ag-cell-last removes ag-right-aligned-cell so add it manually also
        },
      ]
    : [
        {
          title: "Frequent service",
          columnType: "Normal",
          isDefaultShown: true,
          isHideable: true,
          field: "frequent",
          colId: "freq",
          headerComponent: IconHeaderComponent,
          headerComponentParams: {
            src: "/assets/icons/frequent.svg",
            tooltip: "Service has periods of frequent running.",
          },
          headerName: "Frequent service",
          cellRenderer: IconCellRendererComponent,
          cellRendererParams: {
            src: "/assets/icons/frequent.svg",
            label: "Frequent service",
          },
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
          cellClass: "govuk-!-padding-left-3",
          headerClass: "govuk-!-padding-left-3 govuk-!-padding-right-0",
          sortable: true,
          unSortIcon: true,
        },
        {
          title: "Service",
          columnType: "Permanent",
          isDefaultShown: true,
          isHideable: false,
          autoHeight: true,
          colId: "service",
          valueGetter: ({ data }) =>
            `${data.lineInfo?.serviceNumber}: ${data.lineInfo?.serviceName}`,
          headerName: "Service",
          cellRenderer: RouterLinkCellRendererComponent,
          cellRendererParams: {
            routerLinkGetter: (params: ICellRendererParams) => [
              params.data.lineId,
            ],
            queryParamsGetter: (params: ICellRendererParams) => {
              return {
                direction: params.data.direction ?? [Direction.All],
              };
            },
            queryParamsHandling: "merge",
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
          title: "Direction",
          columnType: "Camelcase",
          colId: "direction",
          field: "direction",
          isHideable: true,
          isDefaultShown: true,
          headerName: "Direction",
          valueGetter: ({ data }: { data: ServicePerformance }) =>
            data.direction ?? "-",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
        },
        {
          title: "Scheduled departures",
          columnType: "Normal",
          isDefaultShown: true,
          isHideable: true,
          colId: "scheduledDepartures",
          field: "scheduledDepartures",
          headerName: "Scheduled departures",
          sortable: true,
          unSortIcon: true,
          maxWidth: 160,
          type: "numericColumn",
        },
        {
          title: "Recorded departures",
          columnType: "WithPct",
          isDefaultShown: true,
          isHideable: true,
          colId: "completed",
          field: "actualDepartures",
          pctValueGetter: ({ data }) =>
            data.actualDepartures / data.scheduledDepartures || 0,
          headerName: "Recorded departures",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "Average delay",
          columnType: "AvDelay",
          isDefaultShown: true,
          isHideable: true,
          colId: "averageDelay",
          field: "averageDelay",
          headerName: "Av. delay",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "On time",
          columnType: "WithPctTime",
          isDefaultShown: true,
          isHideable: true,
          colId: "onTime",
          field: "onTime",
          pctField: "onTimeRatio",
          timeField: "onTimeInMins",
          timeValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.onTimeInSeconds : undefined,
          valueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.onTime : undefined,
          pctValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.onTimeRatio : undefined,
          headerName: "On time",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "Late",
          columnType: "WithPctTime",
          isDefaultShown: true,
          isHideable: true,
          colId: "late",
          field: "late",
          pctField: "lateRatio",
          timeField: "lateInMins",
          timeValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.lateInSeconds : undefined,
          valueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.late : undefined,
          pctValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.lateRatio : undefined,
          headerName: "Late",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
        },
        {
          title: "Early",
          columnType: "WithPctTime",
          isDefaultShown: true,
          isHideable: true,
          colId: "early",
          field: "early",
          pctField: "earlyRatio",
          timeField: "earlyInMins",
          timeValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.earlyInSeconds : undefined,
          valueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.early : undefined,
          pctValueGetter: ({ data }: { data: ServicePerformance }) =>
            data.actualDepartures ? data.earlyRatio : undefined,
          headerName: "Early",
          sortable: true,
          unSortIcon: true,
          maxWidth: 130,
          type: "numericColumn",
          // adding ag-header-cell-last removes ag-right-aligned-header so add it manually also
          headerClass: "ag-header-cell-last ag-right-aligned-header",
          cellClass: "ag-cell-last ag-right-aligned-cell", // adding ag-cell-last removes ag-right-aligned-cell so add it manually also
        },
      ];

  errored = false;
  loading = true;
  csvFilename = "Service_Performance";

  data: ServicePerformance[] = [];
  backupData: ServicePerformance[] = [];
  aggDataPerService: ServicePerformance[] = [];

  @Output() directionsChanged = new EventEmitter<Direction[]>();
  @Input() preSelectedDirections: Direction[] = [];

  private _params: PerformanceParams | null = null;
  @Input()
  get params() {
    return this._params;
  }
  set params(params: PerformanceParams | null) {
    if (params) {
      this._params = params ?? null;
      this.params$.next(params);
    }
  }
  private params$ = new ReplaySubject<PerformanceParams>(1);

  constructor(
    private performanceService: PerformanceService,
    private route: ActivatedRoute,
    private authUserService: AuthenticatedUserService,
    private config: ConfigService,
  ) {}

  calculateInputData(): void {
    if (this.aggDataPerService.length === 0) {
      const mapOfServices: Record<string, ServicePerformance[]> = {};
      this.backupData.map((serviceWithDirection) => {
        const service =
          mapOfServices[serviceWithDirection.lineInfo.serviceId] ?? [];
        service.push({ ...serviceWithDirection, direction: undefined });
        mapOfServices[serviceWithDirection.lineInfo.serviceId] = service;
      });

      for (const services of Object.values(mapOfServices)) {
        const aggregate: ServicePerformance = services.reduce((acc, cur) => {
          const actualDepartures =
            (acc.actualDepartures ?? 0) + cur.actualDepartures;
          let averageDelay = undefined;
          let countDelayed = undefined;

          if (acc.countDelayed != undefined || cur.countDelayed != undefined) {
            countDelayed = (acc.countDelayed ?? 0) + (cur.countDelayed ?? 0);
            averageDelay = countDelayed
              ? ((acc.averageDelay ?? 0) * (acc.countDelayed ?? 0) +
                  (cur.averageDelay ?? 0) * (cur.countDelayed ?? 0)) /
                countDelayed
              : undefined;
          }

          const early = (acc.early ?? 0) + cur.early;
          const late = (acc.late ?? 0) + cur.late;
          const onTime = (acc.onTime ?? 0) + cur.onTime;

          const scheduledDepartures =
            (acc.scheduledDepartures ?? 0) + cur.scheduledDepartures;

          let earlyInSeconds = undefined;
          if (acc.earlyInSeconds || cur.earlyInSeconds) {
            earlyInSeconds =
              (acc.earlyInSeconds ?? 0) + (cur.earlyInSeconds ?? 0) / 2;
          }

          let lateInSeconds = undefined;
          if (acc.lateInSeconds || cur.lateInSeconds) {
            lateInSeconds =
              (acc.lateInSeconds ?? 0) + (cur.lateInSeconds ?? 0) / 2;
          }

          let onTimeInSeconds = undefined;
          if (acc.onTimeInSeconds || cur.onTimeInSeconds) {
            onTimeInSeconds =
              (acc.onTimeInSeconds ?? 0) + (cur.onTimeInSeconds ?? 0) / 2;
          }

          const total = (acc.total ?? 0) + cur.total;

          let onTimeRatio = null;
          if (acc.onTimeRatio || cur.onTimeRatio) {
            onTimeRatio = ((acc.onTimeRatio ?? 0) + (cur.onTimeRatio ?? 0)) / 2;
          }

          let earlyRatio = null;
          if (acc.earlyRatio || cur.earlyRatio) {
            earlyRatio = ((acc.earlyRatio ?? 0) + (cur.earlyRatio ?? 0)) / 2;
          }

          let lateRatio = null;
          if (acc.lateRatio || cur.lateRatio) {
            lateRatio = ((acc.lateRatio ?? 0) + (cur.lateRatio ?? 0)) / 2;
          }

          return {
            actualDepartures,
            averageDelay,
            countDelayed,
            early,
            late,
            onTime,
            earlyInSeconds,
            lateInSeconds,
            onTimeInSeconds,
            scheduledDepartures,
            total,
            onTimeRatio,
            earlyRatio,
            lateRatio,
            direction: undefined,
            lineId: cur.lineId,
            lineInfo: cur.lineInfo,
            completedRatio: 0,
          };
        }, {} as ServicePerformance);

        this.aggDataPerService.push(aggregate);
      }
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.preSelectedDirections &&
      !changes.preSelectedDirections.firstChange
    ) {
      const currentDirections = changes.preSelectedDirections
        .currentValue as Direction[];
      const previousDirections = changes.preSelectedDirections
        .previousValue as Direction[];

      if (currentDirections.includes(Direction.All)) {
        this.calculateInputData();
        this.data = this.aggDataPerService;
        return;
      }

      if (previousDirections.includes(Direction.All))
        this.data = this.backupData;
    }
  }

  destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.params$
      .pipe(
        tap((ps) => {
          this.errored = false;
          this.loading = true;
          this.csvFilename = this.calcCsvFilename(ps);
          this.aggDataPerService = [];
        }),
        switchMap((params: PerformanceParams) =>
          this.performanceService.fetchServicePerformance(params).pipe(
            catchError(() => {
              this.errored = true;
              return of(null); // Swallow the error, allowing the outer pipeline to continue
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        this.data = (data ?? []).sort((a, b) =>
          a.lineInfo.serviceNumber.localeCompare(
            b.lineInfo.serviceNumber,
            undefined,
            { numeric: true },
          ),
        );

        this.backupData = this.data;
        if (this.preSelectedDirections.includes(Direction.All)) {
          this.calculateInputData();
          this.data = this.aggDataPerService;
        }
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calcCsvFilename({ fromTimestamp, toTimestamp }: PerformanceParams) {
    const inclusiveTo = DateTime.fromISO(toTimestamp).minus({ minute: 1 });
    const noc = this.route.snapshot.paramMap.get("nocCode");
    return `Service_Performance_${noc}_${DateTime.fromISO(fromTimestamp).toFormat("yy-MM-dd")}_-_${inclusiveTo.toFormat(
      "yy-MM-dd",
    )}`;
  }

  isDirectionsDisabled() {
    let isDirectionsDisabled = false;
    this.authUserService.authenticatedUser$
      .pipe(
        map((info) =>
          this.config.hasFlag(info, FeatureFlag.DirectionsDisabled),
        ),
      )
      .subscribe((value) => {
        isDirectionsDisabled = value;
      });

    return isDirectionsDisabled;
  }

  onDirectionChange($event: Direction[]) {
    this.directionsChanged.emit($event);
  }
}
