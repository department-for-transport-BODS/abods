import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ColDef, FilterChangedEvent, GridOptions, ValueGetterParams } from 'ag-grid-community';
import {
  NoRowsOverlayComponent,
  NoRowsOverlayParams,
} from '../../shared/components/ag-grid/no-rows-overlay/no-rows-overlay.component';
import { AgGridDomService } from 'src/app/shared/components/ag-grid/ag-grid-dom.service';
import { AgGridFormatterService } from 'src/app/shared/components/ag-grid/ag-grid-formatter.service';
import { AgGridDirective } from 'src/app/shared/components/ag-grid/ag-grid.directive';
import { flatMap as _flatMap, map as _map, forEach as _forEach, find as _find } from 'lodash-es';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { FormBuilder, FormGroup } from '@angular/forms';

type ColumnBase = {
  title: string;
  isDefaultShown: boolean;
  isHideable: boolean;
  colId: string;
} & Omit<ColDef, 'valueFormatter' | 'hide'>;

type WithPctColumn = {
  columnType: 'WithPct';
  isHideable: true;
  pctField?: string;
  pctValueGetter?: ((params: ValueGetterParams) => any) | string;
} & ColumnBase;

type PermanentColumn = {
  columnType: 'Permanent';
  isHideable: false;
} & ColumnBase;

type NormalColumn = {
  columnType: 'Normal';
  isHideable: true;
} & ColumnBase;

type AvDelayColumn = {
  columnType: 'AvDelay';
  isHideable: true;
} & ColumnBase;

export type ColumnDescription = NormalColumn | PermanentColumn | WithPctColumn | AvDelayColumn;

const column: (formatter: AgGridFormatterService) => (col: ColumnDescription) => ColDef[] = (formatter) => (column) => {
  switch (column.columnType) {
    case 'Normal':
    case 'Permanent':
      if (column.type === 'numericColumn') {
        return [
          {
            ...column,
            valueFormatter: ({ value }: { value: number }) => value.toLocaleString(),
            hide: !column.isDefaultShown,
          },
        ];
      }
      return [column];
    case 'AvDelay':
      return [{ ...column, valueFormatter: formatter.averageDelayValueFormatter, hide: !column.isDefaultShown }];
    case 'WithPct':
      return [
        { ...column, valueFormatter: ({ value }: { value: number }) => value.toLocaleString(), hide: true },
        {
          ...column,
          colId: `${column.colId}Pct`,
          field: column.pctField,
          valueGetter: column.pctValueGetter,
          valueFormatter: formatter.percentValueFormatter,
          hide: !column.isDefaultShown,
        },
      ];
  }
};

@Component({
  selector: 'app-on-time-grid',
  templateUrl: './on-time-grid.component.html',
  styleUrls: ['./on-time-grid.component.scss'],
})
export class OnTimeGridComponent {
  private _columnDescriptions: ColumnDescription[] = [];
  @Input()
  get columnDescriptions() {
    return this._columnDescriptions;
  }
  set columnDescriptions(columnDescriptions: ColumnDescription[]) {
    this._columnDescriptions = columnDescriptions;
    this.columnDefs = _flatMap<ColumnDescription, ColDef>(columnDescriptions, column(this.formatter));
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

  private _noun?: string;
  @Input() get noun(): string {
    return this._noun ?? '';
  }
  set noun(value: string) {
    this._noun = value;
    this.overlayParams.message = this.initialNoRowsMessage;
  }

  get initialNoRowsMessage() {
    return `No ${this.noun + ' '}data found`;
  }

  @Input() loading = true;
  @Input() errored = false;

  @Input() csvFilename?: string | null;

  @Input() data: any;
  @Input() totalData: any;

  @Input() paginate = true;

  @Input() showFilter = true;

  @Output() gridReady = new EventEmitter();

  get mode() {
    return this._mode;
  }
  set mode(val: 'percent' | 'count') {
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

  private _mode: 'percent' | 'count';
  private _selectedColumns: string[] = [];

  displayOptionsForm: FormGroup = this.formBuilder.group({});

  constructor(
    private agGridDomService: AgGridDomService,
    private formatter: AgGridFormatterService,
    private ngxSmartModalService: NgxSmartModalService,
    private formBuilder: FormBuilder
  ) {
    this._mode = 'percent';
  }

  overlayParams: NoRowsOverlayParams = <NoRowsOverlayParams>{
    message: `No data found`,
  };

  gridOptions: GridOptions = {
    rowSelection: 'single',
    suppressDragLeaveHidesColumns: true,
    suppressCellSelection: false,
    onFirstDataRendered: this.headerHeightSetter.bind(this),
    noRowsOverlayComponent: NoRowsOverlayComponent,
    noRowsOverlayComponentParams: () => this.overlayParams,
    suppressPropertyNamesCheck: true,
  };
  // autoHeight: true,

  defaultColDef: ColDef = {
    resizable: false,
    minWidth: 100,
    suppressNavigable: true,
    suppressMovable: true,
    getQuickFilterText: () => '',
  };

  @ViewChild(AgGridDirective) onTimeGrid?: AgGridDirective;

  columnDefs: ColDef[] = [];

  gridFilter?: string;

  onTimeGridReady(): void {
    this.columnsChanged();
    this.gridReady.emit();
  }

  columnsChanged(): void {
    _map(this.columnDescriptions, ({ colId, columnType }) => {
      const isSelected = this.selectedColumns.includes(colId);
      switch (columnType) {
        case 'WithPct':
          this.onTimeGrid?.columnApi?.setColumnVisible(`${colId}Pct`, this.mode === 'percent' && isSelected);
          this.onTimeGrid?.columnApi?.setColumnVisible(colId, this.mode !== 'percent' && isSelected);
          return;
        default:
          this.onTimeGrid?.columnApi?.setColumnVisible(colId, isSelected);
      }
    });
  }

  headerHeightSetter() {
    const padding = 20;
    this.onTimeGrid?.gridApi?.setHeaderHeight(this.agGridDomService.headerHeight() + padding);
  }

  filterChanged({ api }: FilterChangedEvent) {
    const rowCount = api.paginationGetRowCount() ?? 0;
    if (this.data.length > 0 && this.paginate && rowCount === 0) {
      this.overlayParams.message = `No ${this.noun}s matched the search query`;
      api.showNoRowsOverlay();
    } else if (rowCount > 0) {
      api.hideOverlay();
      this.overlayParams.message = this.initialNoRowsMessage;
    }
  }

  export() {
    this.onTimeGrid?.export(this.csvFilename ?? 'export');
  }

  columnName(colId: string) {
    return `OTP_${this.noun}_column_${colId}`;
  }

  saveColumns(val: string[]) {
    _map(this.columnDescriptions, ({ colId }) => {
      localStorage.setItem(this.columnName(colId), val.includes(colId) ? 'show' : 'hide');
    });
  }

  loadColumns(): string[] {
    const selectedColumns: string[] = [];
    _forEach(this.columnDescriptions, ({ colId, isHideable, isDefaultShown }) => {
      const stored = localStorage.getItem(this.columnName(colId));
      if (!isHideable || (stored ? stored === 'show' : isDefaultShown)) {
        selectedColumns.push(colId);
      }
    });
    return selectedColumns;
  }

  openDisplayOptions() {
    this.resetDisplayOptions();

    this.ngxSmartModalService.open('displayOptionsModal');
  }

  closeDisplayOptions() {
    this.ngxSmartModalService.close('displayOptionsModal');
  }

  saveDisplayOptions() {
    const selectedColumns = _flatMap(this.columnDescriptions, ({ colId, isHideable }) => {
      if (this.displayOptionsForm.value[colId] || !isHideable) return [colId];
      return [] as string[];
    });
    this.selectedColumns = selectedColumns;
    this.closeDisplayOptions();
  }

  selectAllColumns() {
    _forEach(this.displayOptionsForm.controls, (control) => control.setValue(true));
  }

  labelForColId(colId: string) {
    return _find(this._columnDescriptions, { colId })?.title;
  }
}
