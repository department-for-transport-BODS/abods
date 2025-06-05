import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import {
  ColDef,
  FilterChangedEvent,
  GridOptions,
  RowNode,
  ValueGetterParams,
} from "ag-grid-community";
import {
  NoRowsOverlayComponent,
  NoRowsOverlayParams,
} from "../../shared/components/ag-grid/no-rows-overlay/no-rows-overlay.component";
import { AgGridDomService } from "src/app/shared/components/ag-grid/ag-grid-dom.service";
import { AgGridFormatterService } from "src/app/shared/components/ag-grid/ag-grid-formatter.service";
import { AgGridDirective } from "src/app/shared/components/ag-grid/ag-grid.directive";
import {
  flatMap as _flatMap,
  map as _map,
  forEach as _forEach,
  sumBy,
  sum,
} from "lodash-es";
import { NgxSmartModalService } from "ngx-smart-modal";
import { FormBuilder, FormGroup } from "@angular/forms";
import {
  Direction,
  FeatureFlag,
  Maybe,
  Scalars,
  ServicePerformanceType,
  StopPerformanceType,
} from "../../../generated/graphql";
import { OnTimeRatios } from "../on-time.service";
import { MultiselectCheckboxOption } from "../../shared/gds/multiselect-checkbox/multiselect-checkbox.component";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { ConfigService } from "../../config/config.service";
import { map } from "rxjs/operators";

type ColumnBase = {
  title: string;
  isDefaultShown: boolean;
  isHideable: boolean;
  colId: string;
} & Omit<ColDef, "valueFormatter" | "hide">;

type WithPctColumn = {
  columnType: "WithPct";
  isHideable: boolean;
  pctField?: string;
  pctValueGetter?: ((params: ValueGetterParams) => any) | string;
} & ColumnBase;

type WithPctTimeColumn = {
  columnType: "WithPctTime";
  isHideable: true;
  pctField?: string;
  pctValueGetter?: ((params: ValueGetterParams) => any) | string;
  timeField?: string;
  timeValueGetter?: ((params: ValueGetterParams) => any) | string;
} & ColumnBase;

type PermanentColumn = {
  columnType: "Permanent";
  isHideable: false;
} & ColumnBase;

type NormalColumn = {
  columnType: "Normal";
  isHideable: true;
} & ColumnBase;

type CamelcaseColumn = {
  columnType: "Camelcase";
  isHideable: boolean;
} & ColumnBase;

type AvDelayColumn = {
  columnType: "AvDelay";
  isHideable: true;
  positiveOnly?: true;
} & ColumnBase;

export type ColumnDescription =
  | NormalColumn
  | PermanentColumn
  | WithPctColumn
  | AvDelayColumn
  | WithPctTimeColumn
  | CamelcaseColumn;

export interface IPunctualityType {
  early?: Maybe<Scalars["Int"]["output"]>;
  late?: Maybe<Scalars["Int"]["output"]>;
  onTime?: Maybe<Scalars["Int"]["output"]>;
}

export type BasePerformance = IPunctualityType &
  OnTimeRatios &
  Pick<
    ServicePerformanceType & StopPerformanceType,
    | "scheduledDepartures"
    | "actualDepartures"
    | "averageDelay"
    | "onTimeInSeconds"
    | "lateInSeconds"
    | "earlyInSeconds"
    | "countDelayed"
  > &
  // direction is partial as its not displayed in the total data or the table header
  Partial<Pick<ServicePerformanceType & StopPerformanceType, "direction">>;

export type StopPerformanceGridType = BasePerformance &
  Pick<StopPerformanceType, "averageScheduled" | "averageActual">;

export type AbstractPerformance = BasePerformance | StopPerformanceGridType;

enum Mode {
  percent = "percent",
  count = "count",
  time = "time",
}

const column: (
  formatter: AgGridFormatterService,
) => (col: ColumnDescription) => ColDef[] = (formatter) => (column) => {
  switch (column.columnType) {
    case "Normal":
    case "Permanent":
      if (column.type === "numericColumn") {
        return [
          {
            ...column,
            valueFormatter: ({ value }: { value: number }) =>
              value.toLocaleString(),
            hide: !column.isDefaultShown,
          },
        ];
      }
      return [column];
    case "Camelcase":
      return [
        {
          ...column,
          valueFormatter: formatter.toCamelcase,
        },
      ];
    case "AvDelay":
      return [
        {
          ...column,
          valueFormatter: ({ value }: { value: number | undefined }) =>
            formatter.averageDelayValueFormatter(
              { value },
              column.positiveOnly,
            ),
          hide: !column.isDefaultShown,
        },
      ];
    case "WithPct":
      return [
        {
          ...column,
          valueFormatter: ({ value }: { value: number }) =>
            value.toLocaleString(),
          hide: true,
        },
        {
          ...column,
          colId: `${column.colId}Pct`,
          field: column.pctField,
          valueGetter: column.pctValueGetter,
          valueFormatter: formatter.percentValueFormatter,
          hide: !column.isDefaultShown,
        },
      ];
    case "WithPctTime":
      return [
        {
          ...column,
          valueFormatter: ({ value }: { value: number }) =>
            value.toLocaleString(),
          hide: true,
        },
        {
          ...column,
          colId: `${column.colId}Pct`,
          field: column.pctField,
          valueGetter: column.pctValueGetter,
          valueFormatter: formatter.percentValueFormatter,
          hide: !column.isDefaultShown,
        },
        {
          ...column,
          colId: `${column.colId}Time`,
          field: column.timeField,
          valueGetter: column.timeValueGetter,
          valueFormatter: formatter.averageDelayValueFormatter,
          hide: true,
        },
      ];
  }
};

@Component({
  selector: "app-on-time-grid",
  templateUrl: "./on-time-grid.component.html",
  styleUrls: ["./on-time-grid.component.scss"],
  standalone: false,
})
export class OnTimeGridComponent<TData extends AbstractPerformance> {
  Mode = Mode; // added to expose enum in html

  directionOptions: MultiselectCheckboxOption[] = Object.entries(Direction).map(
    ([key, value]) => ({
      value: value,
      label: key,
    }),
  );

  directions: Direction[] = [];
  private _columnDescriptions: ColumnDescription[] = [];
  @Input()
  get columnDescriptions() {
    return this._columnDescriptions;
  }
  set columnDescriptions(columnDescriptions: ColumnDescription[]) {
    this._columnDescriptions = columnDescriptions;
    this.columnDefs = _flatMap<ColumnDescription, ColDef>(
      columnDescriptions,
      column(this.formatter),
    );
    if (!this.selectedColumnsSet) {
      this._selectedColumns = this.loadColumns();
      this.selectedColumnsSet = true;
    }
    this.resetDisplayOptions();
  }

  resetDisplayOptions() {
    _map(this.columnDescriptions, ({ colId, isHideable }) => {
      let control = this.displayOptionsForm.get(colId);
      const value = this.selectedColumns.includes(colId);
      if (control) {
        control.setValue(value);
        if (isHideable) {
          control.enable();
        } else {
          control.disable();
        }
      } else {
        control = this.formBuilder.control({ value, disabled: !isHideable });
        this.displayOptionsForm.addControl(colId, control);
      }
    });
  }

  private _preSelectedDirections: Direction[] = [];
  @Input() get preSelectedDirections(): Direction[] {
    return this._preSelectedDirections;
  }
  set preSelectedDirections(preSelectedDirections: Direction[]) {
    this._preSelectedDirections = preSelectedDirections;
    if (!this.isDirectionsDisabled()) {
      this.directions = preSelectedDirections;
      this.updateGrid();
    }
  }

  private _noun?: string;
  @Input() get noun(): string {
    return this._noun ?? "";
  }
  set noun(value: string) {
    this._noun = value;
    this.overlayParams.message = this.initialNoRowsMessage;
  }

  get initialNoRowsMessage() {
    return `No ${this.noun + " "}data found`;
  }

  @Input() loading = true;
  @Input() errored = false;

  @Input() csvFilename?: string | null;

  private _data: TData[] | undefined;
  summaryHeaderData: (BasePerformance | StopPerformanceGridType)[] | undefined;
  @Input() set data(value: TData[] | undefined) {
    this._data = value;

    if (!value || value.length === 0) {
      this.summaryHeaderData = undefined;
      return;
    }

    this.updateGrid();
  }

  get data() {
    return this._data;
  }

  @Input() paginate = false;

  @Input() showFilter = false;

  @Output() gridReady = new EventEmitter();
  @Output() cellClicked = new EventEmitter<{ column: string; data: TData }>();
  @Output() directionsChanged = new EventEmitter<Direction[]>();

  get mode() {
    return this._mode;
  }
  set mode(val: Mode) {
    this._mode = val;
    this.columnsChanged();
  }
  selectedColumnsSet = false;
  get selectedColumns() {
    return this._selectedColumns;
  }
  set selectedColumns(val: string[]) {
    this._selectedColumns = val;
    this.saveColumns(val);
    this.columnsChanged();
  }

  private _mode: Mode;
  private _selectedColumns: string[] = [];

  displayOptionsForm: FormGroup = this.formBuilder.group({});

  constructor(
    private agGridDomService: AgGridDomService,
    private formatter: AgGridFormatterService,
    private ngxSmartModalService: NgxSmartModalService,
    private formBuilder: FormBuilder,
    private authUserService: AuthenticatedUserService,
    private config: ConfigService,
  ) {
    this._mode = Mode.percent;
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
  sumByOrNull<T>(
    array: T[],
    iteratee: (item: T) => number | null | undefined,
  ): number | null {
    let sum = 0;
    let hasValue = false;

    for (const item of array) {
      const value = iteratee(item);
      if (value != null) {
        sum += value;
        hasValue = true;
      }
    }

    return hasValue ? sum : null;
  }

  returnSummaryTotal(
    value: (StopPerformanceGridType | BasePerformance)[],
  ): (BasePerformance | StopPerformanceGridType)[] {
    const summaryArray: (StopPerformanceGridType | BasePerformance)[] = [];

    if (value.length === 0) {
      return summaryArray;
    }
    const early = sumBy(value, "early");
    const late = sumBy(value, "late");
    const onTime = sumBy(value, "onTime");
    const total = sumBy(value, "total");
    const scheduled = sumBy(value, "scheduledDepartures");
    const actual = sumBy(value, "actualDepartures");
    const totalDelay = sum(
      value.map((stop) => stop.actualDepartures * (stop.averageDelay ?? 0)),
    );

    const valueWithDelay = value.filter(
      (data) => data.averageDelay != undefined,
    );
    const averageDelay = valueWithDelay.some(
      (val) => val.averageDelay != undefined && val.countDelayed != undefined,
    )
      ? sumBy(
          value,
          (item) => (item.averageDelay ?? 0) * (item.countDelayed ?? 0),
        ) / sumBy(value, "countDelayed")
      : undefined;
    const onTimeInSeconds = value.some(
      (val) => val.onTimeInSeconds != undefined,
    )
      ? sumBy(value, "onTimeInSeconds") / value.length
      : undefined;
    const earlyInSeconds = value.some((val) => val.earlyInSeconds != undefined)
      ? sumBy(value, "earlyInSeconds") / value.length
      : undefined;
    const lateInSeconds = value.some((val) => val.earlyInSeconds != undefined)
      ? sumBy(value, "lateInSeconds") / value.length
      : undefined;

    const isStopGrid = value?.some((row) => this.isGridTypeStop(row));

    let summary: StopPerformanceGridType | BasePerformance = {
      early: early,
      late: late,
      onTime: onTime,
      earlyRatio: early / total || 0,
      lateRatio: late / total || 0,
      onTimeRatio: onTime / total || 0,
      scheduledDepartures: scheduled,
      actualDepartures: actual,
      averageDelay: this.isDirectionsDisabled()
        ? totalDelay / actual || 0
        : averageDelay,
      noData: actual - scheduled,
      completedRatio: actual / total || 0,
      total: total,
      onTimeInSeconds: onTimeInSeconds,
      earlyInSeconds: earlyInSeconds,
      lateInSeconds: lateInSeconds,
    };

    if (isStopGrid) {
      const stopGrid = value.filter((val) => this.isGridTypeStop(val));
      const averageScheduled = stopGrid.some(
        (val) => val.averageScheduled != undefined,
      )
        ? sumBy(value, "averageScheduled") / value.length
        : undefined;
      const averageActual = stopGrid.some(
        (val) => val.averageActual != undefined,
      )
        ? sumBy(value, "averageActual") / value.length
        : undefined;

      summary = {
        ...summary,
        averageScheduled,
        averageActual,
      } satisfies StopPerformanceGridType;
    }
    summaryArray.push(summary);
    return summaryArray;
  }

  overlayParams: NoRowsOverlayParams = {
    message: `No data found`,
  } as NoRowsOverlayParams;

  gridOptions: GridOptions = {
    rowSelection: "single",
    suppressDragLeaveHidesColumns: true,
    suppressCellFocus: false,
    onFirstDataRendered: this.headerHeightSetter.bind(this),
    noRowsOverlayComponent: NoRowsOverlayComponent,
    noRowsOverlayComponentParams: () => this.overlayParams,
    suppressPropertyNamesCheck: true,
    isExternalFilterPresent: () => this.isExternalFilterPresent(),
    doesExternalFilterPass: (node: RowNode<TData>) =>
      this.doesExternalFilterPass(node),
    onCellClicked: (params: any) => {
      this.cellClicked.emit({
        column: params.column.getColId() as string,
        data: params.data as TData,
      });
    },
  };

  defaultColDef: ColDef = {
    resizable: false,
    minWidth: 100,
    suppressNavigable: true,
    suppressMovable: true,
    getQuickFilterText: () => "",
  };

  @ViewChild(AgGridDirective) onTimeGrid?: AgGridDirective;

  columnDefs: ColDef[] = [];

  gridFilter?: string;

  onTimeGridReady(): void {
    this.columnsChanged();
    this.gridReady.emit();
  }

  isExternalFilterPresent() {
    return (this.data ?? []).length > 0;
  }

  doesExternalFilterPass(node: RowNode<TData>) {
    if (this.directions.length === 0 && !node.data?.direction) {
      return true;
    }
    if (!node.data?.direction) {
      return false;
    }
    return this.directions.includes(node.data?.direction);
  }

  updateGrid() {
    this.onTimeGrid?.gridApi?.onFilterChanged();
    let filteredData = structuredClone(this.data) ?? [];
    filteredData =
      filteredData.filter(
        (row) => row.direction && this.directions.includes(row.direction),
      ) ?? [];
    this.summaryHeaderData = this.returnSummaryTotal(filteredData);
  }
  onDirectionsChanged($event: string[]) {
    this.directions = $event as Direction[];
    this.updateGrid();
    this.directionsChanged.emit(this.directions);
  }

  columnsChanged(): void {
    _map(this.columnDescriptions, ({ colId, columnType }) => {
      const isSelected = this.selectedColumns.includes(colId);
      switch (columnType) {
        case "WithPct":
          this.onTimeGrid?.columnApi?.setColumnVisible(
            `${colId}Pct`,
            this.mode === Mode.percent && isSelected,
          );
          this.onTimeGrid?.columnApi?.setColumnVisible(
            colId,
            this.mode !== Mode.percent && isSelected,
          );
          return;
        case "WithPctTime":
          this.onTimeGrid?.columnApi?.setColumnVisible(
            `${colId}Time`,
            this.mode === Mode.time && isSelected,
          );
          this.onTimeGrid?.columnApi?.setColumnVisible(
            `${colId}Pct`,
            this.mode === Mode.percent && isSelected,
          );
          this.onTimeGrid?.columnApi?.setColumnVisible(
            colId,
            this.mode === Mode.count && isSelected,
          );
          return;
        default:
          this.onTimeGrid?.columnApi?.setColumnVisible(colId, isSelected);
      }
    });
  }

  headerHeightSetter() {
    const padding = 20;
    this.onTimeGrid?.gridApi?.setHeaderHeight(
      this.agGridDomService.headerHeight() + padding,
    );
  }

  filterChanged({ api }: FilterChangedEvent) {
    const rowCount = api.paginationGetRowCount() ?? 0;
    if (this.data && this.data.length > 0 && this.paginate && rowCount === 0) {
      this.overlayParams.message = `No ${this.noun}s matched the search query`;
      api.showNoRowsOverlay();
    } else if (rowCount > 0) {
      api.hideOverlay();
      this.overlayParams.message = this.initialNoRowsMessage;
    }
  }

  isGridTypeStop(data: AbstractPerformance): data is StopPerformanceGridType {
    return "averageScheduled" in data && "averageActual" in data;
  }

  export() {
    const serviceGridAverageValueColumns: (keyof Pick<
      AbstractPerformance,
      "averageDelay"
    >)[] = ["averageDelay"];
    const stopGridAverageValueColumns: (keyof Pick<
      StopPerformanceGridType,
      "averageDelay" | "averageActual" | "averageScheduled"
    >)[] = ["averageDelay", "averageActual", "averageScheduled"];
    const isStopGrid = this.data?.some((row) => this.isGridTypeStop(row));

    if (isStopGrid) {
      this.onTimeGrid?.export<StopPerformanceGridType>(
        this.csvFilename ?? "export",
        stopGridAverageValueColumns,
      );
    } else {
      this.onTimeGrid?.export<BasePerformance>(
        this.csvFilename ?? "export",
        serviceGridAverageValueColumns,
      );
    }
  }

  columnName(colId: string) {
    return `OTP_${this.noun}_column_${colId}`;
  }

  saveColumns(val: string[]) {
    _map(this.columnDescriptions, ({ colId }) => {
      localStorage.setItem(
        this.columnName(colId),
        val.includes(colId) ? "show" : "hide",
      );
    });
  }

  loadColumns(): string[] {
    const selectedColumns: string[] = [];
    _forEach(
      this.columnDescriptions,
      ({ colId, isHideable, isDefaultShown }) => {
        const stored = localStorage.getItem(this.columnName(colId));
        if (!isHideable || (stored ? stored === "show" : isDefaultShown)) {
          selectedColumns.push(colId);
        }
      },
    );
    return selectedColumns;
  }

  openDisplayOptions() {
    this.resetDisplayOptions();

    this.ngxSmartModalService.open("displayOptionsModal");
  }

  closeDisplayOptions() {
    this.ngxSmartModalService.close("displayOptionsModal");
  }

  saveDisplayOptions() {
    const selectedColumns = _flatMap(
      this.columnDescriptions,
      ({ colId, isHideable }) => {
        if (this.displayOptionsForm.value[colId] || !isHideable) return [colId];
        return [] as string[];
      },
    );
    this.selectedColumns = selectedColumns;
    this.closeDisplayOptions();
  }

  selectAllColumns() {
    _forEach(this.displayOptionsForm.controls, (control) =>
      control.setValue(true),
    );
  }
}
