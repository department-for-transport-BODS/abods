import { NO_ERRORS_SCHEMA } from "@angular/core";
import { discardPeriodicTasks, fakeAsync, tick } from "@angular/core/testing";
import { RouterModule } from "@angular/router";
import {
  Spectator,
  SpyObject,
  byLabel,
  byText,
  createComponentFactory,
  mockProvider,
} from "@ngneat/spectator";
import { AgGridModule } from "ag-grid-angular";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime, Settings } from "luxon";
import { of, throwError } from "rxjs";
import { OperatorType } from "../../../generated/graphql";
import { LayoutModule } from "../../layout/layout.module";
import { ChartService } from "../../shared/components/amcharts/chart.service";
import { OperatorService } from "../../shared/services/operator.service";
import { SharedModule } from "../../shared/shared.module";
import { OnTimeModule } from "../on-time.module";
import {
  OnTimeService,
  OperatorPerformance,
  PerformanceParams,
} from "../on-time.service";
import { OperatorGridComponent } from "./operator-grid.component";

describe("OperatorGridComponent", () => {
  let spectator: Spectator<OperatorGridComponent>;
  let component: OperatorGridComponent;
  let onTimeService: SpyObject<OnTimeService>;
  let operatorService: SpyObject<OperatorService>;

  const mockOperators: OperatorType[] = [
    {
      name: "A A Williams",
      nocCode: "OP1",
      adminAreaIds: ["AA1", "AA2"],
      operatorId: "OP1-ID",
    },
    {
      name: "First Leeds",
      nocCode: "OP2",
      adminAreaIds: ["AA3"],
      operatorId: "OP2-ID",
    },
    {
      name: "D & G Buses",
      nocCode: "OP3",
      adminAreaIds: [],
      operatorId: "OP3-ID",
    },
  ];
  const mockOperatorOTP: OperatorPerformance[] = [
    {
      nocCode: "OP1",
      name: "A A Williams",
      early: 10,
      onTime: 70,
      late: 20,
      total: 100,
      onTimeRatio: 0.7,
      earlyRatio: 0.1,
      lateRatio: 0.2,
      completedRatio: 1,
    },
    {
      nocCode: "OP2",
      name: "First Leeds",
      early: 0,
      onTime: 100,
      late: 0,
      total: 100,
      onTimeRatio: 1,
      earlyRatio: 0,
      lateRatio: 0,
      completedRatio: 1,
    },
    {
      nocCode: "OP3",
      name: "D & G Buses",
      early: 0,
      onTime: 90,
      late: 10,
      total: 100,
      onTimeRatio: null,
      earlyRatio: null,
      lateRatio: null,
      completedRatio: null,
    },
  ];
  let mockParams: PerformanceParams;

  const createComponent = createComponentFactory({
    component: OperatorGridComponent,
    imports: [
      OnTimeModule,
      SharedModule,
      LayoutModule,
      RouterModule.forRoot([]),
      ApolloTestingModule,
      AgGridModule,
    ],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      mockProvider(OnTimeService),
      mockProvider(OperatorService),
      {
        provide: ChartService,
        useValue: {
          browserOnly: (_fn: () => void) => {
            // Don't execute the function to prevent chart disposal errors
          },
        },
      },
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    Settings.defaultZone = "Europe/London";
    Settings.now = () => 1664578800; // 2022-10-01 GMT+01:00, i.e. during BST
    mockParams = {
      fromTimestamp: DateTime.now().toISO(),
      toTimestamp: DateTime.now().plus({ days: 7 }).toISO(),
      filters: { adminAreaIds: [] },
    };

    spectator = createComponent();
    component = spectator.component;

    onTimeService = spectator.inject(OnTimeService);
    operatorService = spectator.inject(OperatorService);

    operatorService.fetchOperators.and.returnValue(of(mockOperators));
    onTimeService.fetchOnTimeTimeSeriesData.and.returnValue(of([]));
    onTimeService.fetchOperatorPerformanceList.and.returnValue(of([]));
    component.params = mockParams;

    // Complete the subjects that trigger sparkline rendering to prevent errors
    component.loaded$.complete();
    component.gridReady$.complete();
    component.paginationChanged$.complete();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should fetch corridors", () => {
    const spy = onTimeService.fetchOperatorPerformanceList.and.returnValue(
      of(mockOperatorOTP),
    );
    onTimeService.fetchOnTimeTimeSeriesData.and.returnValue(of([]));
    component.ngOnInit();
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(mockParams);
  });

  it("should show error message", () => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(
      throwError(() => "error"),
    );
    component.ngOnInit();
    spectator.detectChanges();

    expect(
      spectator.query(
        byText("There was an error loading operator data, please try again."),
      ),
    ).toBeVisible();
  });

  it("should search for operators and ignore white space if single character including & symbol", fakeAsync(() => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(
      of(mockOperatorOTP),
    );

    component.ngOnInit();
    tick();
    spectator.detectChanges();
    tick(1000);

    spectator.typeInElement("AA Williams", byLabel("Search for an operator"));
    spectator.detectChanges();
    tick(1000);

    expect(spectator.query(byText("A A Williams"))).toBeVisible();
    expect(spectator.query(byText("First Leeds"))).not.toBeVisible();
    expect(spectator.query(byText("D & G Buses"))).not.toBeVisible();

    spectator.typeInElement("D&G", byLabel("Search for an operator"));
    spectator.detectChanges();
    tick(1000);

    expect(spectator.query(byText("A A Williams"))).not.toBeVisible();
    expect(spectator.query(byText("First Leeds"))).not.toBeVisible();
    expect(spectator.query(byText("D & G Buses"))).toBeVisible();

    discardPeriodicTasks();
  }));

  it("should search for operators and ignore order of words", fakeAsync(() => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(
      of(mockOperatorOTP),
    );

    component.ngOnInit();
    tick();
    spectator.detectChanges();
    tick(1000);

    spectator.typeInElement("Leeds First", byLabel("Search for an operator"));
    spectator.detectChanges();
    tick(1000);

    expect(spectator.query(byText("A A Williams"))).not.toBeVisible();
    expect(spectator.query(byText("First Leeds"))).toBeVisible();
    expect(spectator.query(byText("D & G Buses"))).not.toBeVisible();

    discardPeriodicTasks();
  }));

  it("should show no operators found message", fakeAsync(() => {
    onTimeService.fetchOperatorPerformanceList.and.returnValue(
      of(mockOperatorOTP),
    );

    component.ngOnInit();
    tick();
    spectator.detectChanges();
    tick(1000);

    spectator.typeInElement("zzz", byLabel("Search for an operator"));
    spectator.detectChanges();
    tick(1000);

    expect(
      spectator.query(byText("No operators matched the search query")),
    ).toBeVisible();

    discardPeriodicTasks();
  }));
});
