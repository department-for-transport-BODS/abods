import { NO_ERRORS_SCHEMA } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import {
  CellClickedEvent,
  FilterChangedEvent,
  GridApi,
  RowNode,
} from "ag-grid-community";
import { MockProvider } from "ng-mocks";
import { NgxSmartModalModule, NgxSmartModalService } from "ngx-smart-modal";
import { AgGridDomService } from "src/app/shared/components/ag-grid/ag-grid-dom.service";
import { AgGridFormatterService } from "src/app/shared/components/ag-grid/ag-grid-formatter.service";
import { Direction } from "../../../generated/graphql";
import { AuthenticatedUserService } from "../../authentication/authenticated-user.service";
import { ConfigService } from "../../config/config.service";
import { AgGridDirective } from "../../shared/components/ag-grid/ag-grid.directive";
import {
  AbstractPerformance,
  BasePerformance,
  Mode,
  OnTimeGridComponent,
} from "./on-time-grid.component";

fdescribe("OnTimeGridComponent", () => {
  let spectator: Spectator<OnTimeGridComponent<AbstractPerformance>>;
  let component: OnTimeGridComponent<AbstractPerformance>;
  let ngxSmartModalService: SpyObject<NgxSmartModalService>;

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

  const createComponent = createComponentFactory({
    component: OnTimeGridComponent,
    imports: [NgxSmartModalModule.forRoot()],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      FormBuilder,
      {
        provide: AgGridFormatterService,
        useValue: {
          toCamelcase: ({ value }: { value: string }) => value,
          averageDelayValueFormatter: ({ value }: { value: number }) => value,
          percentValueFormatter: ({ value }: { value: number }) => value + "%",
        },
      },
      {
        provide: AgGridDomService,
        useValue: {
          headerHeight: () => 42,
        },
      },
      MockProvider(AuthenticatedUserService),
      MockProvider(ConfigService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({ detectChanges: false });
    component = spectator.component;
    ngxSmartModalService = spectator.inject(NgxSmartModalService);
    spyOn(ngxSmartModalService, "open");
    spyOn(ngxSmartModalService, "close");
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should set and get noun and update overlay message", async () => {
    component.noun = "stop";
    await expect(component.noun).toBe("stop");
    await expect(component.initialNoRowsMessage).toContain(
      "No stop data found",
    );
  });

  it("should set and get preSelectedDirections and update grid", async () => {
    spyOn(component, "updateGrid");
    component.preSelectedDirections = [Direction.Inbound];
    await expect(component.directions).toEqual([Direction.Inbound]);
    expect(component.updateGrid).toHaveBeenCalledWith();
  });

  it("should set and get data and update grid", async () => {
    spyOn(component, "updateGrid");
    const testData = [
      {
        early: 1,
        late: 2,
        onTime: 3,
        total: 6,
        onTimeRatio: 0.5,
        earlyRatio: 0.17,
        lateRatio: 0.33,
        completedRatio: 1,
      } as AbstractPerformance,
    ];
    component.data = testData;
    await expect(component.data).toBe(testData);
    expect(component.updateGrid).toHaveBeenCalledWith();
  });

  it("should reset summaryHeaderData if data is empty", async () => {
    component.data = [];
    await expect(component.summaryHeaderData).toBeUndefined();
  });

  it("should emit gridReady on onTimeGridReady", () => {
    spyOn(component.gridReady, "emit");
    component.onTimeGridReady();
    expect(component.gridReady.emit).toHaveBeenCalledWith();
  });

  it("should emit cellClicked on grid cell click", () => {
    spyOn(component.cellClicked, "emit");
    const testData = {
      total: 10,
      onTimeRatio: 0.5,
      earlyRatio: 0.2,
      lateRatio: 0.3,
      completedRatio: 0.9,
    } as AbstractPerformance;
    const params = { column: { getColId: () => "col1" }, data: testData };
    component.gridOptions.onCellClicked!(params as unknown as CellClickedEvent);
    expect(component.cellClicked.emit).toHaveBeenCalledWith({
      column: "col1",
      data: testData,
    });
  });

  it("should emit directionsChanged and update grid on onDirectionsChanged", async () => {
    spyOn(component, "updateGrid");
    spyOn(component.directionsChanged, "emit");
    component.onDirectionsChanged([Direction.Inbound, Direction.Outbound]);
    await expect(component.directions).toEqual([
      Direction.Inbound,
      Direction.Outbound,
    ]);
    expect(component.updateGrid).toHaveBeenCalledWith();
    expect(component.directionsChanged.emit).toHaveBeenCalledWith([
      Direction.Inbound,
      Direction.Outbound,
    ]);
  });

  it("should set directions to [Direction.All] if directions is empty on onDirectionsChanged", async () => {
    spyOn(component.directionsChanged, "emit");
    component.onDirectionsChanged([]);
    await expect(component.directions).toEqual([Direction.All]);
    expect(component.directionsChanged.emit).toHaveBeenCalledWith([
      Direction.All,
    ]);
  });

  it("should call columnsChanged when mode is set", () => {
    spyOn(component, "columnsChanged");
    component.mode = Mode.count;
    expect(component.columnsChanged).toHaveBeenCalledWith();
  });

  it("should open and close display options modal", () => {
    component.openDisplayOptions();
    expect(ngxSmartModalService.open).toHaveBeenCalledWith(
      "displayOptionsModal",
    );
    component.closeDisplayOptions();
    expect(ngxSmartModalService.close).toHaveBeenCalledWith(
      "displayOptionsModal",
    );
  });

  it("should select all columns", () => {
    component.displayOptionsForm.addControl(
      "col1",
      new FormBuilder().control(false),
    );
    component.selectAllColumns();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(component.displayOptionsForm.value.col1).toBeTrue();
  });

  it("should set selectedColumns and call columnsChanged", async () => {
    spyOn(component, "columnsChanged");
    component.selectedColumns = ["col1", "col2"];
    await expect(component.selectedColumns).toEqual(["col1", "col2"]);
    expect(component.columnsChanged).toHaveBeenCalledWith();
  });

  it("should return correct row count with and without pagination", async () => {
    const api = {
      paginationGetRowCount: () => 5,
      getDisplayedRowCount: () => 3,
    } as GridApi;
    component.paginate = true;
    await expect(component.getRowCount(api)).toBe(5);
    component.paginate = false;
    await expect(component.getRowCount(api)).toBe(3);
  });

  it("should show overlay if no rows after filterChanged", async () => {
    const api = {
      paginationGetRowCount: () => 0,
      getDisplayedRowCount: () => 0,
      showNoRowsOverlay: jasmine.createSpy(),
      hideOverlay: jasmine.createSpy(),
    };
    component.noun = "stop";
    component.filterChanged({ api } as unknown as FilterChangedEvent);
    expect(api.showNoRowsOverlay).toHaveBeenCalledWith();
    await expect(component.overlayParams.message).toContain(
      "No stops matched the search query",
    );
  });

  it("should hide overlay if rows exist after filterChanged", async () => {
    const api = {
      paginationGetRowCount: () => 2,
      getDisplayedRowCount: () => 2,
      showNoRowsOverlay: jasmine.createSpy(),
      hideOverlay: jasmine.createSpy(),
    };
    component.noun = "stop";
    component.filterChanged({ api } as unknown as FilterChangedEvent);
    expect(api.hideOverlay).toHaveBeenCalledWith();
    await expect(component.overlayParams.message).toContain(
      "No stop data found",
    );
  });

  it("should return true for isGridTypeStop if averageScheduled and averageActual exist", () => {
    expect(component.isGridTypeStop(data)).toBeTrue();
  });

  it("should return false for isGridTypeStop if averageScheduled or averageActual missing", () => {
    const {
      averageScheduled: _averageScheduled,
      ...dataWithoutAverageScheduled
    } = data;

    const { averageActual: _averageActual, ...dataWithoutAverageActual } = data;

    expect(component.isGridTypeStop(dataWithoutAverageScheduled)).toBeFalse();
    expect(component.isGridTypeStop(dataWithoutAverageActual)).toBeFalse();
  });

  it("should call headerHeightSetter and set header height", () => {
    component.onTimeGrid = {
      gridApi: {
        setHeaderHeight: jasmine.createSpy("setHeaderHeight"),
      },
    } as unknown as AgGridDirective;
    component.headerHeightSetter();
    expect(component.onTimeGrid.gridApi!.setHeaderHeight).toHaveBeenCalledWith(
      62,
    );
  });

  it("should filter directions correctly in isExternalFilterPresent and doesExternalFilterPass", () => {
    component.directions = [Direction.Inbound];
    component.data = [
      {
        direction: Direction.Inbound,
        total: 10,
        onTimeRatio: 0.5,
        earlyRatio: 0.2,
        lateRatio: 0.3,
        completedRatio: 0.9,
      } as AbstractPerformance,
      {
        direction: Direction.Outbound,
        total: 10,
        onTimeRatio: 0.5,
        earlyRatio: 0.2,
        lateRatio: 0.3,
        completedRatio: 0.9,
      } as AbstractPerformance,
    ];
    expect(component.isExternalFilterPresent()).toBeTrue();
    expect(
      component.doesExternalFilterPass({
        data: { direction: Direction.Inbound },
      } as unknown as RowNode<AbstractPerformance>),
    ).toBeTrue();
    expect(
      component.doesExternalFilterPass({
        data: { direction: Direction.Outbound },
      } as unknown as RowNode<AbstractPerformance>),
    ).toBeFalse();
    expect(
      component.doesExternalFilterPass({
        data: {},
      } as unknown as RowNode<AbstractPerformance>),
    ).toBeFalse();
    component.directions = [];
    expect(
      component.doesExternalFilterPass({
        data: {},
      } as unknown as RowNode<AbstractPerformance>),
    ).toBeTrue();
  });

  it("should returnSummaryTotal with correct calculations", async () => {
    const value: BasePerformance[] = [
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
        onTimeRatio: 1,
        completedRatio: 1,
        earlyRatio: 1,
        lateRatio: 1,
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
        onTimeRatio: 1,
        completedRatio: 1,
        earlyRatio: 1,
        lateRatio: 1,
      },
    ];
    const summary = component.returnSummaryTotal(value);
    await expect(summary.length).toBe(1);
    await expect(summary[0].early).toBe(3);
    await expect(summary[0].late).toBe(5);
    await expect(summary[0].onTime).toBe(7);
    await expect(summary[0].scheduledDepartures).toBe(11);
    await expect(summary[0].actualDepartures).toBe(9);
    await expect(summary[0].averageDelay).toBeGreaterThan(0);
  });

  it("should sumByOrNull return null for empty or all nulls", async () => {
    await expect(component.sumByOrNull([], () => null)).toBeNull();
    await expect(component.sumByOrNull([{ a: null }], (x) => x.a)).toBeNull();
  });

  it("should sumByOrNull return sum for valid values", async () => {
    await expect(component.sumByOrNull([{ a: 1 }, { a: 2 }], (x) => x.a)).toBe(
      3,
    );
  });
});
