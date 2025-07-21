import { Component, Input, OnInit } from "@angular/core";
import { DateRangeService } from "../../shared/services/date-range.service";
import { DateTime } from "luxon";
import { Preset } from "../../shared/components/date-range/date-range.types";
import { debounceTime, Subject, switchMap } from "rxjs";
import {
  AdminOrgOperatorMap,
  Distance,
  OperatorForDistances,
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
import { sumBy } from "lodash-es";

const WHITESPACE_BETWEEN_SINGLE_CHARACTER = /(?<= \w|&|^\w|^) (?=\w |&|\w$|$)/g;
const INITIAL_NO_ROWS_MESSAGE = "No operator data found";

enum DropDowns {
  adminArea,
  org,
  operator,
  license,
  service,
}

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

  private dateChanged$ = new Subject<void>();
  private distances$ = new Subject<void>();

  gridReady$ = new Subject<void>();
  paginationChanged$ = new Subject<PaginationChangedEvent>();

  isDropdownLoading = true;

  selectedOrgId?: number;
  orgs?: Organisation[] = [];

  adminAreaOptions: MultiselectCheckboxOption[] = [];
  licenseOptions: MultiselectCheckboxOption[] = [];
  serviceOptions: MultiselectCheckboxOption[] = [];
  operatorMultiSelect: MultiselectCheckboxOption[] = [];

  licenses: string[] = [];
  operatorIds: string[] = [];
  serviceIds: string[] = [];
  adminAreaIds: string[] = [];

  allOperatorData: OperatorForDistances[] = [];
  backupAdminOrgMap: AdminOrgOperatorMap[] = [];

  data: Distance[] = [];
  headerData: Distance[] = [];
  @Input() paginate = false;
  columnDefs: ColDef[] = [
    {
      colId: "operatorName",
      field: "operatorName",
      headerName: "Operator",
      valueGetter: ({ data }: { data: Distance }) =>
        data.operatorId ? `${data.operatorName} (${data.operatorId})` : "",
      flex: 3,
      maxWidth: 350,
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
      flex: 2,
      maxWidth: 230,
      cellClass: "govuk-!-padding-left-3",
      headerClass: "govuk-!-padding-left-3 govuk-!-padding-right-0",
    },
    {
      colId: "lineName",
      field: "lineName",
      headerName: "Service",
      sortable: true,
      flex: 2,
      unSortIcon: true,
      valueGetter: ({ data }: { data: Distance }) =>
        data.lineName ? `${data.lineName}-${data.serviceName}` : "",
    },
    {
      colId: "distance",
      field: "distance",
      headerName: "Distance excluding dead runs (km)",
      sortable: true,
      unSortIcon: true,
      flex: 1,
      valueFormatter: ({ value }) => (isNaN(value) ? value : value.toFixed(2)),
      valueGetter: ({ data }: { data: Distance }) =>
        data.distance ? data.distance / 1000 : "-",
      type: "numericColumn",
    },
    {
      colId: "avlDistance",
      field: "avlDistance",
      headerName: "Distance of journeys with AVL (km)",
      sortable: true,
      unSortIcon: true,
      flex: 1,
      valueFormatter: ({ value }) => (isNaN(value) ? value : value.toFixed(2)),
      valueGetter: ({ data }: { data: Distance }) =>
        data.avlDistance ? data.avlDistance / 1000 : "-",
      type: "numericColumn",
    },
    {
      colId: "avlDistancePercent",
      field: "avlDistancePercent",
      headerName: "Distance of journeys with AVL (%)",
      valueGetter: ({ data }: { data: Distance }) =>
        data.distance ? (data.avlDistance ?? 0) / data.distance : undefined,
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
    getRowHeight: () => 50,
    overlayLoadingTemplate:
      '<div *ngIf="loading"><app-spinner [vCentre]="true" message="Loading..." size="default"></app-spinner></div>',
  };

  loading = false;

  ngOnInit(): void {
    this.distanceService.fetchAdminOrgList().subscribe((adminOrgList) => {
      this.backupAdminOrgMap = [...adminOrgList];

      this.updateAdminRow(new Set());
      this.isDropdownLoading = false;
    });

    this.distanceService
      .fetchDistancesDropdows()
      .subscribe((dropdownValues) => {
        this.operatorMultiSelect = [];
        this.allOperatorData = dropdownValues.operators ?? [];

        this.updateLicenseRow(new Set());
      });

    this.distances$
      .pipe(
        debounceTime(700),
        switchMap(() => {
          return this.distanceService.fetchDistances({
            orgId: this.selectedOrgId?.toString(),
            operatorIds: this.operatorIds,
            fromTimestamp: this.from.toISO(),
            toTimestamp: this.to.toISO(),
            nocLineAndServiceCodes: this.serviceIds,
            licenseIds: this.licenses,
            adminAreaIds: this.adminAreaIds,
          });
        }),
      )
      .subscribe((data) => {
        if (data && data.length > 0) {
          this.headerData = [
            {
              lineName: "",
              nocLineAndServiceCode: "",
              operatorId: "",
              operatorName: "",
              serviceName: "",
              avlDistance: sumBy(data, "avlDistance"),
              distance: sumBy(data, "distance"),
            },
          ];
        }

        this.data = data;
        this.loading = false;
      });

    this.dateChanged$.next();
  }

  getOperatorsToFilter() {
    let orgMap: AdminOrgOperatorMap[] = [];

    if (this.adminAreaIds.length > 0 || this.selectedOrgId) {
      orgMap = this.backupAdminOrgMap.filter(
        (data) =>
          this.adminAreaIds.includes(data.adminAreaId.toString()) ||
          this.selectedOrgId === data.orgId,
      );
    }

    const operatorsInAdminRow = orgMap.map((data) => data.operatorId);

    const operatorsInLicenseRow = this.allOperatorData
      .filter((operator) =>
        operator.licenses?.some(
          (license) =>
            this.licenses.includes(license.id) ||
            license.services?.some((service) =>
              this.serviceIds.includes(service.id),
            ),
        ),
      )
      .map((operator) => operator.id);

    if (operatorsInAdminRow.length > 0) {
      return new Set([
        ...operatorsInAdminRow
          .filter(
            (operator) =>
              operatorsInLicenseRow.length === 0 ||
              operatorsInLicenseRow.includes(operator),
          )
          .filter(
            (operator) =>
              this.operatorIds.length === 0 ||
              this.operatorIds.includes(operator),
          ),
        ...this.operatorIds,
      ]);
    }

    return new Set([...operatorsInLicenseRow, ...this.operatorIds]);
  }

  updateFilters(skipDropdown?: DropDowns) {
    this.isDropdownLoading = true;

    const validOperators = this.getOperatorsToFilter();

    this.updateAdminRow(validOperators, skipDropdown);
    this.updateLicenseRow(validOperators, skipDropdown);
    this.isDropdownLoading = false;
  }

  updateAdminRow(filterOperators: Set<string>, skipDropdown?: DropDowns) {
    const orgs: Organisation[] = [];
    const adminAreaOptions: MultiselectCheckboxOption[] = [];

    const adminAreaId = new Set<number>();
    const orgId = new Set<number>();

    this.backupAdminOrgMap
      .filter(
        (data) =>
          filterOperators.size === 0 ||
          filterOperators.has(data.operatorId) ||
          this.adminAreaIds.includes(data.adminAreaId.toString()) ||
          (this.selectedOrgId && this.selectedOrgId === data.orgId),
      )
      .map((data) => {
        if (
          !adminAreaId.has(data.adminAreaId) &&
          skipDropdown !== DropDowns.adminArea
        ) {
          adminAreaOptions.push({
            label: data.adminName ?? "",
            value: data.adminAreaId.toString(),
          });
          adminAreaId.add(data.adminAreaId);
        }

        if (!orgId.has(data.orgId) && skipDropdown !== DropDowns.org) {
          orgs?.push({
            id: data.orgId,
            name: data.orgName ?? "",
          });
          orgId.add(data.orgId);
        }
      });

    if (skipDropdown !== DropDowns.adminArea) {
      this.adminAreaOptions = [...adminAreaOptions].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    }

    if (skipDropdown !== DropDowns.org) {
      this.orgs = [...orgs].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  updateLicenseRow(filterOperators: Set<string>, skipDropdown?: DropDowns) {
    const operatorMultiSelect: MultiselectCheckboxOption[] = [];
    const licenseOptions: MultiselectCheckboxOption[] = [];
    const serviceOptions: MultiselectCheckboxOption[] = [];

    this.allOperatorData
      .filter(
        (operator) =>
          filterOperators.size === 0 || filterOperators.has(operator.id),
      )
      .forEach((operator) => {
        if (skipDropdown !== DropDowns.operator) {
          operatorMultiSelect.push({
            label: `${operator.name} (${operator.id})`,
            value: operator.id,
          });
        }

        operator.licenses
          ?.filter(
            (license) =>
              this.licenses.length === 0 || this.licenses.includes(license.id),
          )
          .forEach((license) => {
            if (skipDropdown !== DropDowns.license && license.id) {
              licenseOptions.push({
                label: license.id,
                value: license.id,
              });
            }

            if (skipDropdown !== DropDowns.service) {
              license.services?.forEach((service) => {
                serviceOptions.push({
                  label: `${service.line}-${service.name}`,
                  value: service.id,
                });
              });
            }
          });
      });

    if (skipDropdown !== DropDowns.license) {
      this.licenseOptions = [...licenseOptions].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    }

    if (skipDropdown !== DropDowns.service) {
      this.serviceOptions = [...serviceOptions].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    }

    if (skipDropdown !== DropDowns.operator) {
      this.operatorMultiSelect = [...operatorMultiSelect].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    }
  }

  onDatePickerChanged($event: { from: DateTime; to: DateTime }) {
    this.from = $event.from;
    this.to = $event.to;
    this.dateChanged$.next();
    this.isDropdownLoading = true;
    this.updateFilters();
  }

  onAdminAreaChanged($event: string[]) {
    this.adminAreaIds = $event;
    this.updateFilters(DropDowns.adminArea);
  }

  onOrgChange(orgId: number) {
    this.selectedOrgId = orgId;
    this.updateFilters(DropDowns.org);
  }

  onOperatorsChanged($event: string[]) {
    this.operatorIds = $event;
    this.serviceIds = [];
    this.licenses = [];
    this.updateFilters(
      this.operatorIds.length > 0 ? DropDowns.operator : undefined,
    );
  }

  onServicesChanged($event: string[]) {
    this.serviceIds = $event;
    this.updateFilters(DropDowns.service);
  }

  onLicensesChanged($event: string[]) {
    this.licenses = $event;
    this.serviceIds = [];
    this.serviceOptions = [];
    this.updateFilters(DropDowns.license);
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
