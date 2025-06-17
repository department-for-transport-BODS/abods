import { Component, Input, OnInit } from "@angular/core";
import { DateRangeService } from "../../shared/services/date-range.service";
import { DateTime } from "luxon";
import { Preset } from "../../shared/components/date-range/date-range.types";
import {
  debounceTime,
  filter,
  finalize,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import {
  Distance,
  OperatorLinesGQL,
  Organisation,
} from "../../../generated/graphql";
import { DistancesService } from "../distances.service";
import { MultiselectCheckboxOption } from "../../shared/gds/multiselect-checkbox/multiselect-checkbox.component";
import {
  ColDef,
  FilterChangedEvent,
  GridApi,
  GridOptions,
  PaginationChangedEvent,
} from "ag-grid-community";
import {
  NoRowsOverlayComponent,
  NoRowsOverlayParams,
} from "../../shared/components/ag-grid/no-rows-overlay/no-rows-overlay.component";
import { AgGridFormatterService } from "../../shared/components/ag-grid/ag-grid-formatter.service";

const WHITESPACE_BETWEEN_SINGLE_CHARACTER = /(?<= \w|&|^\w|^) (?=\w |&|\w$|$)/g;
const INITIAL_NO_ROWS_MESSAGE = "No operator data found";

@Component({
  selector: "app-view-distances",
  templateUrl: "./view-distances.component.html",
  styleUrl: "./view-distances.component.scss",
  standalone: false,
})
export class ViewDistancesComponent implements OnInit {
  to: DateTime;
  from: DateTime;

  constructor(
    dateRangeService: DateRangeService,
    private distanceService: DistancesService,
    private operatorLinesQuery: OperatorLinesGQL,
    private formatter: AgGridFormatterService,
  ) {
    const { from, to } = dateRangeService.calculatePresetPeriod(
      Preset.Last7,
      DateTime.local(),
    );
    this.from = from;
    this.to = to;
  }

  private noc$ = new Subject<void>();
  private services$ = new Subject<void>();
  private distances$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  gridReady$ = new Subject<void>();
  paginationChanged$ = new Subject<PaginationChangedEvent>();

  orgsLoading = true;
  selectedOrgId?: number;
  orgs$?: Observable<Organisation[]> = this.distanceService
    .fetchUserOrgs()
    .pipe(finalize(() => (this.orgsLoading = false)));

  nocMultiSelect: MultiselectCheckboxOption[] = [];
  nocIds: string[] = [];
  serviceIds: string[] = [];

  data: Distance[] = [];
  @Input() paginate = false;
  columnDefs: ColDef[] = [
    {
      colId: "operatorName",
      field: "operatorName",
      headerName: "Operator",
      valueGetter: ({ data }: { data: Distance }) =>
        `${data.operatorName} (${data.operatorId})`,
      flex: 2,
      maxWidth: 300,
      sortable: true,
      unSortIcon: true,
      getQuickFilterText: (params) =>
        (params.value as string).replace(
          WHITESPACE_BETWEEN_SINGLE_CHARACTER,
          "",
        ),
    },
    {
      colId: "nocLineAndServiceCode",
      field: "nocLineAndServiceCode",
      valueFormatter: ({ value }) => (value ? value.split("-").pop() : value),
      headerName: "Service Code",
      sortable: true,
      unSortIcon: true,
      flex: 1,
    },
    {
      colId: "lineName",
      field: "lineName",
      headerName: "Service",
      sortable: true,
      flex: 1,
      unSortIcon: true,
    },
    {
      colId: "distance",
      field: "distance",
      headerName: "Distance excluding dead runs (km)",
      sortable: true,
      unSortIcon: true,
      flex: 1,
      valueGetter: ({ data }: { data: Distance }) =>
        data.distance ? data.distance / 1000 : "-",
      type: "numericColumn",
    },
    {
      colId: "avlDistance",
      field: "avlDistance",
      headerName: "Distance excluding journeys with no AVL (km)",
      sortable: true,
      unSortIcon: true,
      flex: 1,
      valueGetter: ({ data }: { data: Distance }) =>
        data.avlDistance ? data.avlDistance / 1000 : "-",
      type: "numericColumn",
    },
    {
      colId: "avlDistancePercent",
      field: "avlDistancePercent",
      headerName: "Distance excluding journeys with no AVL (%)",
      valueGetter: ({ data }: { data: Distance }) =>
        data.distance ? (data.avlDistance ?? 0) / data.distance : "-",
      valueFormatter: this.formatter.percentValueFormatter,
      flex: 1,
      sortable: true,
      unSortIcon: true,
      type: "numericColumn",
      cellStyle: { display: "flex", justifyContent: "flex-end" },
    },
  ];

  defaultColDef = {
    resizable: false,
    minWidth: 100,
    suppressNavigable: true,
    suppressMovable: true,
    getQuickFilterText: () => "",
  };

  _gridFilter = "";
  normalGridFilter = "";
  get gridFilter(): string {
    return this._gridFilter;
  }
  set gridFilter(value: string) {
    this._gridFilter = value;
    this.normalGridFilter = value.replace(
      WHITESPACE_BETWEEN_SINGLE_CHARACTER,
      "",
    );
  }

  overlayComponent = NoRowsOverlayComponent;
  overlayParams: NoRowsOverlayParams = {
    message: INITIAL_NO_ROWS_MESSAGE,
  } as NoRowsOverlayParams;

  gridOptions: GridOptions = {
    headerHeight: 60,
    overlayLoadingTemplate:
      '<div *ngIf="loading"><app-spinner [vCentre]="true" message="Loading..." size="default"></app-spinner></div>',
  };

  allServices$ = this.services$.pipe(
    mergeMap(() => {
      if (this.nocIds.length === 0) return of({ data: { lines: [] } });
      return this.operatorLinesQuery.fetch({
        operatorIds: this.nocIds,
        inputDate: this.from.toISO(),
        endDate: this.to.toISO(),
      });
    }),
  );

  serviceOptions$ = this.allServices$.pipe(
    map((result) =>
      result.data.lines.map((o) => ({
        label: `${o.number}: ${o.name}`,
        value: o.id,
      })),
    ),
    tap((options) => {
      const available = options.map((o) => o.value);
      const newIds = this.serviceIds.filter((s) => available.includes(s));
      this.isServicesLoading = false;
      if (this.serviceIds.length !== newIds.length) {
        this.onServicesChanged(newIds);
      }
    }),
  );

  isNocLoading = false;
  isServicesLoading = false;
  loading = false;

  ngOnInit(): void {
    this.noc$
      .pipe(
        filter(() => !!this.selectedOrgId),
        switchMap(() => {
          return this.distanceService.fetchOperatorsUsingOrg(
            this.selectedOrgId!,
          );
        }),
      )
      .subscribe((nocs) => {
        this.isNocLoading = false;
        this.nocMultiSelect = nocs.map((noc) => ({
          label: `${noc.name} (${noc.nocCode})`,
          value: noc.nocCode,
        }));
      });

    this.distances$
      .pipe(
        debounceTime(700),
        switchMap(() => {
          return this.distanceService.fetchDistances({
            orgId: this.selectedOrgId?.toString() ?? "",
            operatorIds: this.nocIds,
            fromTimestamp: this.from.toISO(),
            toTimestamp: this.to.toISO(),
            nocLineAndServiceCodes: this.serviceIds,
          });
        }),
      )
      .subscribe((data) => {
        this.data = data;
        this.loading = false;
      });
  }

  onDatePickerChanged($event: { from: DateTime; to: DateTime }) {
    this.from = $event.from;
    this.to = $event.to;
  }

  onOrgChange(orgId: number) {
    this.selectedOrgId = orgId;
    this.nocIds = [];
    this.serviceIds = [];
    this.isNocLoading = true;
    this.noc$.next();
  }

  onNocsChanged($event: string[]) {
    this.nocIds = $event;
    this.isServicesLoading = true;
    this.serviceIds = [];
    this.services$.next();
  }

  onServicesChanged($event: string[]) {
    this.serviceIds = $event;
  }

  getRowCount(api: GridApi) {
    if (this.paginate) {
      return api.paginationGetRowCount();
    }

    return api.getDisplayedRowCount();
  }

  filterChanged({ api }: FilterChangedEvent) {
    const rowCount = this.getRowCount(api);

    if (rowCount === 0) {
      this.overlayParams.message = `No operators matched the search query`;
      api.showNoRowsOverlay();
      return;
    }
    api.hideOverlay();
    this.overlayParams.message = INITIAL_NO_ROWS_MESSAGE;
  }

  getDistances() {
    this.loading = true;
    this.distances$.next();
  }
}
