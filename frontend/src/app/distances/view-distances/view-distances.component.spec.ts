import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { FilterChangedEvent } from "ag-grid-community";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime } from "luxon";
import { of } from "rxjs";
import { OperatorLinesGQL } from "../../../generated/graphql";
import { LayoutModule } from "../../layout/layout.module";
import { Preset } from "../../shared/components/date-range/date-range.types";
import { GdsModule } from "../../shared/gds/gds.module";
import { DateRangeService } from "../../shared/services/date-range.service";
import { SharedModule } from "../../shared/shared.module";
import { DistancesService } from "../distances.service";
import { ViewDistancesComponent } from "./view-distances.component";

describe("ViewDistancesComponent", () => {
  let spectator: Spectator<ViewDistancesComponent>;
  let component: ViewDistancesComponent;
  let distancesServiceSpy: SpyObject<DistancesService>;

  const createComponent = createComponentFactory({
    component: ViewDistancesComponent,
    imports: [SharedModule, GdsModule, LayoutModule, ApolloTestingModule],
    detectChanges: false,
    mocks: [OperatorLinesGQL, DistancesService],
  });

  beforeEach(() => {
    spectator = createComponent({
      providers: [
        {
          provide: DateRangeService,
          useValue: {
            calculatePresetPeriod: jasmine
              .createSpy("calculatePresetPeriod")
              .and.returnValue({
                from: DateTime.local().minus({ days: 7 }),
                to: DateTime.local(),
                trendFrom: DateTime.local().minus({ days: 14 }),
                trendTo: DateTime.local().minus({ days: 7 }),
                preset: Preset.Last7,
              }),
            inverseLookup: jasmine
              .createSpy("inverseLookup")
              .and.returnValue(Preset.Last7),
          },
        },
      ],
    });
    component = spectator.component;
    distancesServiceSpy = spectator.inject(DistancesService);

    distancesServiceSpy.fetchAdminOrgList.and.returnValue(of([]));
    distancesServiceSpy.fetchDistancesDropdows.and.returnValue(
      of({ operators: [] }),
    );

    spectator.fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should initialize date range from DateRangeService", async () => {
    await expect(component.from).toBeDefined();
    await expect(component.to).toBeDefined();
  });

  it("should fetch admin org list and dropdowns on init", async () => {
    const adminOrgList = [{ adminAreaId: 1, orgId: 1, operatorId: "op1" }];
    const dropdownValues = { operators: [] };
    distancesServiceSpy.fetchAdminOrgList.and.returnValue(of(adminOrgList));
    distancesServiceSpy.fetchDistancesDropdows.and.returnValue(
      of(dropdownValues),
    );

    component.ngOnInit();

    expect(distancesServiceSpy.fetchAdminOrgList).toHaveBeenCalledWith();
    expect(distancesServiceSpy.fetchDistancesDropdows).toHaveBeenCalledWith();
    await expect(component.backupAdminOrgMap).toEqual(adminOrgList);
    await expect(component.allOperatorData).toEqual([]);
  });

  it("should update filters and dropdowns when onAdminAreaChanged is called", async () => {
    spyOn(component, "updateFilters");
    component.onAdminAreaChanged(["1", "2"]);
    await expect(component.adminAreaIds).toEqual(["1", "2"]);
    expect(component.updateFilters).toHaveBeenCalledWith(0); // DropDowns.adminArea === 0
  });

  it("should update filters and dropdowns when onOrgChange is called", async () => {
    spyOn(component, "updateFilters");
    component.onOrgChange(5);
    await expect(component.selectedOrgId).toBe(5);
    expect(component.updateFilters).toHaveBeenCalledWith(1); // DropDowns.org === 1
  });

  it("should update filters and dropdowns when onOperatorsChanged is called", async () => {
    spyOn(component, "updateFilters");
    component.onOperatorsChanged(["op1", "op2"]);
    await expect(component.operatorIds).toEqual(["op1", "op2"]);
    await expect(component.serviceIds).toEqual([]);
    await expect(component.licenses).toEqual([]);
    expect(component.updateFilters).toHaveBeenCalledWith(2); // DropDowns.operator === 2
  });

  it("should update filters and dropdowns when onServicesChanged is called", async () => {
    spyOn(component, "updateFilters");
    component.onServicesChanged(["svc1"]);
    await expect(component.serviceIds).toEqual(["svc1"]);
    expect(component.updateFilters).toHaveBeenCalledWith(4); // DropDowns.service === 4
  });

  it("should update filters and dropdowns when onLicensesChanged is called", async () => {
    spyOn(component, "updateFilters");
    component.onLicensesChanged(["lic1"]);
    await expect(component.licenses).toEqual(["lic1"]);
    await expect(component.serviceIds).toEqual([]);
    await expect(component.serviceOptions).toEqual([]);
    expect(component.updateFilters).toHaveBeenCalledWith(3); // DropDowns.license === 3
  });

  it("should update overlay message and show overlay if no rows after filterChanged", async () => {
    const api = {
      paginationGetRowCount: () => 0,
      getDisplayedRowCount: () => 0,
      showNoRowsOverlay: jasmine.createSpy("showNoRowsOverlay"),
      hideOverlay: jasmine.createSpy("hideOverlay"),
    };
    component.paginate = false;
    component.filterChanged({ api } as unknown as FilterChangedEvent);
    await expect(component.overlayParams.message).toContain(
      "No operators matched the search query",
    );
    expect(api.showNoRowsOverlay).toHaveBeenCalledWith();
  });

  it("should hide overlay if rows exist after filterChanged", async () => {
    const api = {
      paginationGetRowCount: () => 1,
      getDisplayedRowCount: () => 1,
      showNoRowsOverlay: jasmine.createSpy("showNoRowsOverlay"),
      hideOverlay: jasmine.createSpy("hideOverlay"),
    };
    component.paginate = false;
    component.filterChanged({ api } as unknown as FilterChangedEvent);
    expect(api.hideOverlay).toHaveBeenCalledWith();
    await expect(component.overlayParams.message).toBe(
      "No operator data found",
    );
  });
});
