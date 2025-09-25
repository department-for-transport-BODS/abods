import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ViewDistancesComponent } from "./view-distances.component";
import { DateRangeService } from "../../shared/services/date-range.service";
import { DistancesService } from "../distances.service";
import { OperatorLinesGQL } from "../../../generated/graphql";
import { AgGridFormatterService } from "../../shared/components/ag-grid/ag-grid-formatter.service";
import { of } from "rxjs";
import { DateTime } from "luxon";
import { Preset } from "../../shared/components/date-range/date-range.types";
import { SharedModule } from "../../shared/shared.module";
import { GdsModule } from "../../shared/gds/gds.module";
import { LayoutModule } from "../../layout/layout.module";

describe("ViewDistancesComponent", () => {
  let component: ViewDistancesComponent;
  let fixture: ComponentFixture<ViewDistancesComponent>;
  let dateRangeServiceSpy: jasmine.SpyObj<DateRangeService>;
  let distancesServiceSpy: jasmine.SpyObj<DistancesService>;
  let operatorLinesQuerySpy: jasmine.SpyObj<OperatorLinesGQL>;
  let formatterSpy: jasmine.SpyObj<AgGridFormatterService>;

  beforeEach(async () => {
    dateRangeServiceSpy = jasmine.createSpyObj("DateRangeService", [
      "calculatePresetPeriod",
    ]);
    distancesServiceSpy = jasmine.createSpyObj("DistancesService", [
      "fetchAdminOrgList",
      "fetchDistancesDropdows",
      "fetchDistances",
    ]);
    operatorLinesQuerySpy = jasmine.createSpyObj("OperatorLinesGQL", ["fetch"]);
    formatterSpy = jasmine.createSpyObj("AgGridFormatterService", [
      "percentValueFormatter",
    ]);

    dateRangeServiceSpy.calculatePresetPeriod.and.returnValue({
      from: DateTime.local().minus({ days: 7 }),
      to: DateTime.local(),
      trendFrom: DateTime.local().minus({ days: 14 }),
      trendTo: DateTime.local().minus({ days: 7 }),
      preset: Preset.Last7,
    });

    await TestBed.configureTestingModule({
      declarations: [ViewDistancesComponent],
      imports: [SharedModule, GdsModule, LayoutModule],
      providers: [
        { provide: DateRangeService, useValue: dateRangeServiceSpy },
        { provide: DistancesService, useValue: distancesServiceSpy },
        { provide: OperatorLinesGQL, useValue: operatorLinesQuerySpy },
        { provide: AgGridFormatterService, useValue: formatterSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewDistancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize date range from DateRangeService", () => {
    expect(component.from).toBeDefined();
    expect(component.to).toBeDefined();
  });

  it("should fetch admin org list and dropdowns on init", () => {
    const adminOrgList = [{ adminAreaId: 1, orgId: 1, operatorId: "op1" }];
    const dropdownValues = { operators: [] };
    distancesServiceSpy.fetchAdminOrgList.and.returnValue(of(adminOrgList));
    distancesServiceSpy.fetchDistancesDropdows.and.returnValue(
      of(dropdownValues),
    );

    component.ngOnInit();

    expect(distancesServiceSpy.fetchAdminOrgList).toHaveBeenCalled();
    expect(distancesServiceSpy.fetchDistancesDropdows).toHaveBeenCalled();
    expect(component.backupAdminOrgMap).toEqual(adminOrgList);
    expect(component.allOperatorData).toEqual([]);
  });

  it("should update filters and dropdowns when onAdminAreaChanged is called", () => {
    spyOn(component, "updateFilters");
    component.onAdminAreaChanged(["1", "2"]);
    expect(component.adminAreaIds).toEqual(["1", "2"]);
    expect(component.updateFilters).toHaveBeenCalledWith(0); // DropDowns.adminArea === 0
  });

  it("should update filters and dropdowns when onOrgChange is called", () => {
    spyOn(component, "updateFilters");
    component.onOrgChange(5);
    expect(component.selectedOrgId).toBe(5);
    expect(component.updateFilters).toHaveBeenCalledWith(1); // DropDowns.org === 1
  });

  it("should update filters and dropdowns when onOperatorsChanged is called", () => {
    spyOn(component, "updateFilters");
    component.onOperatorsChanged(["op1", "op2"]);
    expect(component.operatorIds).toEqual(["op1", "op2"]);
    expect(component.serviceIds).toEqual([]);
    expect(component.licenses).toEqual([]);
    expect(component.updateFilters).toHaveBeenCalledWith(2); // DropDowns.operator === 2
  });

  it("should update filters and dropdowns when onServicesChanged is called", () => {
    spyOn(component, "updateFilters");
    component.onServicesChanged(["svc1"]);
    expect(component.serviceIds).toEqual(["svc1"]);
    expect(component.updateFilters).toHaveBeenCalledWith(4); // DropDowns.service === 4
  });

  it("should update filters and dropdowns when onLicensesChanged is called", () => {
    spyOn(component, "updateFilters");
    component.onLicensesChanged(["lic1"]);
    expect(component.licenses).toEqual(["lic1"]);
    expect(component.serviceIds).toEqual([]);
    expect(component.serviceOptions).toEqual([]);
    expect(component.updateFilters).toHaveBeenCalledWith(3); // DropDowns.license === 3
  });

  it("should update overlay message and show overlay if no rows after filterChanged", () => {
    const api = {
      paginationGetRowCount: () => 0,
      getDisplayedRowCount: () => 0,
      showNoRowsOverlay: jasmine.createSpy("showNoRowsOverlay"),
      hideOverlay: jasmine.createSpy("hideOverlay"),
    };
    component.paginate = false;
    component.filterChanged({ api } as any);
    expect(component.overlayParams.message).toContain(
      "No operators matched the search query",
    );
    expect(api.showNoRowsOverlay).toHaveBeenCalled();
  });

  it("should hide overlay if rows exist after filterChanged", () => {
    const api = {
      paginationGetRowCount: () => 1,
      getDisplayedRowCount: () => 1,
      showNoRowsOverlay: jasmine.createSpy("showNoRowsOverlay"),
      hideOverlay: jasmine.createSpy("hideOverlay"),
    };
    component.paginate = false;
    component.filterChanged({ api } as any);
    expect(api.hideOverlay).toHaveBeenCalled();
    expect(component.overlayParams.message).toBe("No operator data found");
  });
});
