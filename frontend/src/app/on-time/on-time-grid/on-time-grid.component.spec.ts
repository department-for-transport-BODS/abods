import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  OnTimeGridComponent,
  Mode,
  AbstractPerformance,
} from "./on-time-grid.component";
import { AgGridFormatterService } from "src/app/shared/components/ag-grid/ag-grid-formatter.service";
import { AgGridDomService } from "src/app/shared/components/ag-grid/ag-grid-dom.service";
import { NgxSmartModalService } from "ngx-smart-modal";
import { FormBuilder } from "@angular/forms";
import { Direction } from "../../../generated/graphql";

describe("OnTimeGridComponent", () => {
  let component: OnTimeGridComponent<any>;
  let fixture: ComponentFixture<OnTimeGridComponent<any>>;
  let _formatter: AgGridFormatterService;

  const mockFormatter = {
    toCamelcase: jasmine
      .createSpy("toCamelcase")
      .and.callFake(({ value }) => value),
    averageDelayValueFormatter: jasmine
      .createSpy("averageDelayValueFormatter")
      .and.callFake(({ value }) => value),
    percentValueFormatter: jasmine
      .createSpy("percentValueFormatter")
      .and.callFake(({ value }) => value + "%"),
  };

  const mockAgGridDomService = {
    headerHeight: () => 42,
  };

  const data: AbstractPerformance = {
    averageScheduled: 1,
    averageActual: 2,
    total: 10,
    onTimeRatio: 0.5,
    earlyRatio: 0.2,
    lateRatio: 0.3,
    completedRatio: 0.9,
    averageDelay: 5,
    countDelayed: 3,
    scheduledDepartures: 10,
    actualDepartures: 9,
  };

  const mockNgxSmartModalService = {
    open: jasmine.createSpy("open"),
    close: jasmine.createSpy("close"),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OnTimeGridComponent],
      providers: [
        { provide: AgGridFormatterService, useValue: mockFormatter },
        { provide: AgGridDomService, useValue: mockAgGridDomService },
        { provide: NgxSmartModalService, useValue: mockNgxSmartModalService },
        FormBuilder,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OnTimeGridComponent);
    component = fixture.componentInstance;
    _formatter = TestBed.inject(AgGridFormatterService);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set and get noun and update overlay message", () => {
    component.noun = "stop";
    expect(component.noun).toBe("stop");
    expect(component.initialNoRowsMessage).toContain("No stop data found");
  });

  it("should set and get preSelectedDirections and update grid", () => {
    spyOn(component, "updateGrid");
    component.preSelectedDirections = [Direction.Inbound];
    expect(component.directions).toEqual([Direction.Inbound]);
    expect(component.updateGrid).toHaveBeenCalled();
  });

  it("should set and get data and update grid", () => {
    spyOn(component, "updateGrid");
    const data = [{ early: 1, late: 2, onTime: 3 }];
    component.data = data;
    expect(component.data).toBe(data);
    expect(component.updateGrid).toHaveBeenCalled();
  });

  it("should reset summaryHeaderData if data is empty", () => {
    component.data = [];
    expect(component.summaryHeaderData).toBeUndefined();
  });

  it("should emit gridReady on onTimeGridReady", () => {
    spyOn(component.gridReady, "emit");
    component.onTimeGridReady();
    expect(component.gridReady.emit).toHaveBeenCalled();
  });

  it("should emit cellClicked on grid cell click", () => {
    spyOn(component.cellClicked, "emit");
    const params = { column: { getColId: () => "col1" }, data: { foo: "bar" } };
    component.gridOptions.onCellClicked!(params as any);
    expect(component.cellClicked.emit).toHaveBeenCalledWith({
      column: "col1",
      data: { foo: "bar" },
    });
  });

  it("should emit directionsChanged and update grid on onDirectionsChanged", () => {
    spyOn(component, "updateGrid");
    spyOn(component.directionsChanged, "emit");
    component.onDirectionsChanged([Direction.Inbound, Direction.Outbound]);
    expect(component.directions).toEqual([
      Direction.Inbound,
      Direction.Outbound,
    ]);
    expect(component.updateGrid).toHaveBeenCalled();
    expect(component.directionsChanged.emit).toHaveBeenCalledWith([
      Direction.Inbound,
      Direction.Outbound,
    ]);
  });

  it("should set directions to [Direction.All] if directions is empty on onDirectionsChanged", () => {
    spyOn(component.directionsChanged, "emit");
    component.onDirectionsChanged([]);
    expect(component.directions).toEqual([Direction.All]);
    expect(component.directionsChanged.emit).toHaveBeenCalledWith([
      Direction.All,
    ]);
  });

  it("should call columnsChanged when mode is set", () => {
    spyOn(component, "columnsChanged");
    component.mode = Mode.count;
    expect(component.columnsChanged).toHaveBeenCalled();
  });

  it("should open and close display options modal", () => {
    component.openDisplayOptions();
    expect(mockNgxSmartModalService.open).toHaveBeenCalledWith(
      "displayOptionsModal",
    );
    component.closeDisplayOptions();
    expect(mockNgxSmartModalService.close).toHaveBeenCalledWith(
      "displayOptionsModal",
    );
  });

  it("should select all columns", () => {
    component.displayOptionsForm.addControl(
      "col1",
      new FormBuilder().control(false),
    );
    component.selectAllColumns();
    expect(component.displayOptionsForm.value.col1).toBeTrue();
  });

  it("should set selectedColumns and call columnsChanged", () => {
    spyOn(component, "columnsChanged");
    component.selectedColumns = ["col1", "col2"];
    expect(component.selectedColumns).toEqual(["col1", "col2"]);
    expect(component.columnsChanged).toHaveBeenCalled();
  });

  it("should return correct row count with and without pagination", () => {
    const api = {
      paginationGetRowCount: () => 5,
      getDisplayedRowCount: () => 3,
    } as any;
    component.paginate = true;
    expect(component.getRowCount(api)).toBe(5);
    component.paginate = false;
    expect(component.getRowCount(api)).toBe(3);
  });

  it("should show overlay if no rows after filterChanged", () => {
    const api = {
      paginationGetRowCount: () => 0,
      getDisplayedRowCount: () => 0,
      showNoRowsOverlay: jasmine.createSpy(),
      hideOverlay: jasmine.createSpy(),
    } as any;
    component.noun = "stop";
    component.filterChanged({ api } as any);
    expect(api.showNoRowsOverlay).toHaveBeenCalled();
    expect(component.overlayParams.message).toContain(
      "No stops matched the search query",
    );
  });

  it("should hide overlay if rows exist after filterChanged", () => {
    const api = {
      paginationGetRowCount: () => 2,
      getDisplayedRowCount: () => 2,
      showNoRowsOverlay: jasmine.createSpy(),
      hideOverlay: jasmine.createSpy(),
    } as any;
    component.noun = "stop";
    component.filterChanged({ api } as any);
    expect(api.hideOverlay).toHaveBeenCalled();
    expect(component.overlayParams.message).toContain("No stop data found");
  });

  it("should return true for isGridTypeStop if averageScheduled and averageActual exist", () => {
    expect(component.isGridTypeStop(data)).toBeTrue();
  });

  it("should return false for isGridTypeStop if averageScheduled or averageActual missing", () => {
    expect(
      component.isGridTypeStop({ ...data, averageScheduled: 1 }),
    ).toBeFalse();
  });

  it("should call export with correct columns for stop grid", () => {
    component.data = [
      { averageScheduled: 1, averageActual: 2, averageDelay: 3 },
    ];
    component.onTimeGrid = {
      export: jasmine.createSpy("export"),
    } as any;
    component.csvFilename = "test";
    component.export();
    expect(component?.onTimeGrid?.export).toHaveBeenCalledWith("test", [
      "averageDelay",
      "averageActual",
      "averageScheduled",
    ]);
  });

  it("should call export with correct columns for service grid", () => {
    component.data = [{ averageDelay: 3 }];
    component.onTimeGrid = {
      export: jasmine.createSpy("export"),
    } as any;
    component.csvFilename = "test";
    component.export();
    expect(component?.onTimeGrid?.export).toHaveBeenCalledWith("test", [
      "averageDelay",
    ]);
  });

  it("should call headerHeightSetter and set header height", () => {
    component.onTimeGrid = {
      gridApi: {
        setHeaderHeight: jasmine.createSpy("setHeaderHeight"),
      },
    } as any;
    component.headerHeightSetter();
    expect(component?.onTimeGrid?.gridApi?.setHeaderHeight).toHaveBeenCalled();
  });

  it("should filter directions correctly in isExternalFilterPresent and doesExternalFilterPass", () => {
    component.directions = [Direction.Inbound];
    component.data = [
      { direction: Direction.Inbound },
      { direction: Direction.Outbound },
    ];
    expect(component.isExternalFilterPresent()).toBeTrue();
    expect(
      component.doesExternalFilterPass({
        data: { direction: Direction.Inbound },
      } as any),
    ).toBeTrue();
    expect(
      component.doesExternalFilterPass({
        data: { direction: Direction.Outbound },
      } as any),
    ).toBeFalse();
    expect(component.doesExternalFilterPass({ data: {} } as any)).toBeFalse();
    component.directions = [];
    expect(component.doesExternalFilterPass({ data: {} } as any)).toBeTrue();
  });

  it("should returnSummaryTotal with correct calculations", () => {
    const value = [
      {
        early: 1,
        late: 2,
        onTime: 3,
        total: 6,
        scheduledDepartures: 5,
        actualDepartures: 4,
        averageDelay: 2,
        countDelayed: 2,
        onTimeInSeconds: 60,
        earlyInSeconds: 30,
        lateInSeconds: 40,
      },
      {
        early: 2,
        late: 3,
        onTime: 4,
        total: 9,
        scheduledDepartures: 6,
        actualDepartures: 5,
        averageDelay: 3,
        countDelayed: 1,
        onTimeInSeconds: 120,
        earlyInSeconds: 60,
        lateInSeconds: 80,
      },
    ];
    const summary = component.returnSummaryTotal(value as any);
    expect(summary.length).toBe(1);
    expect(summary[0].early).toBe(3);
    expect(summary[0].late).toBe(5);
    expect(summary[0].onTime).toBe(7);
    expect(summary[0].scheduledDepartures).toBe(11);
    expect(summary[0].actualDepartures).toBe(9);
    expect(summary[0].averageDelay).toBeGreaterThan(0);
  });

  it("should sumByOrNull return null for empty or all nulls", () => {
    expect(component.sumByOrNull([], () => null)).toBeNull();
    expect(component.sumByOrNull([{ a: null }], (x) => x.a)).toBeNull();
  });

  it("should sumByOrNull return sum for valid values", () => {
    expect(component.sumByOrNull([{ a: 1 }, { a: 2 }], (x) => x.a)).toBe(3);
  });
});
