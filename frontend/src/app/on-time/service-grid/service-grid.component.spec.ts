import { fakeAsync, flush, tick } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { byLabel, createComponentFactory, Spectator } from "@ngneat/spectator";
import { AgGridModule } from "ag-grid-angular";
import { BehaviorSubject } from "rxjs";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";

import { CommonModule, PercentPipe } from "@angular/common";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { RouterModule } from "@angular/router";
import { SvgIconRegistryService } from "angular-svg-icon";
import { ApolloTestingModule } from "apollo-angular/testing";
import { OnTimeModule } from "../on-time.module";
import { OnTimeService } from "../on-time.service";
import { onTimeInputParams } from "../on-time.test-constants";
import {
  FrequentServicePerformance,
  PerformanceService,
} from "../performance.service";
import { ServiceGridComponent } from "./service-grid.component";

fdescribe("ServiceGridComponent", () => {
  let spectator: Spectator<ServiceGridComponent>;
  let _onTimeService: OnTimeService;
  let performanceService: PerformanceService;
  const listSubj = new BehaviorSubject<FrequentServicePerformance[]>([]);

  const createComponent = createComponentFactory({
    component: ServiceGridComponent,
    providers: [PercentPipe, provideHttpClient(), provideHttpClientTesting()],
    imports: [
      SharedModule,
      LayoutModule,
      OnTimeModule,
      RouterModule.forRoot([]),
      CommonModule,
      FormsModule,
      AgGridModule,
      ApolloTestingModule,
    ],
    mocks: [SvgIconRegistryService],
    detectChanges: false,
  });

  const services: FrequentServicePerformance[] = [
    {
      lineId: "M5P",
      lineInfo: {
        serviceId: "6",
        serviceName: "Dispear to Wear",
        serviceNumber: "1A",
      },
      scheduledDepartures: 123,
      actualDepartures: 115,
      onTime: 80,
      early: 15,
      late: 20,
      averageDelay: 12,
      total: 115,
      onTimeRatio: 80 / 115,
      lateRatio: 20 / 115,
      earlyRatio: 15 / 115,
      completedRatio: 0,
      frequent: false,
    },
    {
      lineId: "TH",
      lineInfo: {
        serviceId: "7",
        serviceName: "Roade to Nowerre",
        serviceNumber: "2A",
      },
      scheduledDepartures: 321,
      actualDepartures: 311,
      onTime: 300,
      early: 5,
      late: 6,
      averageDelay: 35,
      total: 311,
      onTimeRatio: 300 / 311,
      lateRatio: 6 / 311,
      earlyRatio: 5 / 311,
      completedRatio: 0,
      frequent: true,
    },
  ];

  beforeEach(() => {
    spectator = createComponent();

    _onTimeService = spectator.inject(OnTimeService);
    performanceService = spectator.inject(PerformanceService);
    spyOn(performanceService, "fetchServicePerformance").and.returnValue(
      listSubj.asObservable(),
    );
  });

  it("should create", async () => {
    spectator.component.params = onTimeInputParams;

    spectator.detectChanges();

    listSubj.next(services);
    spectator.detectChanges();

    await expect(spectator.component).toBeTruthy();
  });

  it("should call service", () => {
    spectator.component.params = onTimeInputParams;

    spectator.detectChanges();

    listSubj.next(services);
    spectator.detectChanges();

    expect(performanceService.fetchServicePerformance).toHaveBeenCalledWith(
      jasmine.objectContaining(onTimeInputParams),
    );
  });

  it("should display some data", fakeAsync(() => {
    spectator.component.params = onTimeInputParams;

    listSubj.next(
      services.map((service) => OnTimeService.calculateOnTimePcts(service)),
    );
    spectator.detectChanges();
    tick(100);

    const expectedSummary = ["", "", "-", "444", "95.9%", "-", "166%"];

    const expectedValues = [
      ["", "1A: Dispear to Wear", "-", "123", "93.5%", "+00:12", "69.6%"],
      [
        "Frequent service",
        "2A: Roade to Nowerre",
        "-",
        "321",
        "96.9%",
        "+00:35",
        "96.5%",
      ],
    ];

    const summary = spectator
      .queryAll('[role="row"][row-index="t-0"] [role="gridcell"]')
      .map((e) => e.textContent);

    void expect(summary).toEqual(jasmine.arrayContaining(expectedSummary));

    const row1 = spectator
      .queryAll('[role="row"][row-index="0"] [role="gridcell"]')
      .map((e) => e.textContent);

    void expect(row1).toEqual(jasmine.arrayContaining(expectedValues[0]));

    const row2 = spectator
      .queryAll('[role="row"][row-index="1"] [role="gridcell"]')
      .map((e) => e.textContent);

    void expect(row2).toEqual(jasmine.arrayContaining(expectedValues[1]));
    flush(100);
  }));

  it("should display raw data if required", fakeAsync(() => {
    spectator.component.params = onTimeInputParams;

    spectator.detectChanges();
    flush(100);

    listSubj.next(services);
    spectator.detectChanges();

    const expectedSummary = ["", "", "-", "444", "-", "426", "380"];

    const expectedValues = [
      ["", "1A: Dispear to Wear", "-", "123", "+00:12", "115", "80"],
      [
        "Frequent service",
        "2A: Roade to Nowerre",
        "-",
        "321",
        "+00:35",
        "311",
        "300",
      ],
    ];

    spectator.click(byLabel("Count"));

    spectator.detectChanges();
    flush(100);

    // expect(component.mode).toEqual('count');
    const summary = spectator
      .queryAll('[role="row"][row-index="t-0"] [role="gridcell"]')
      .map((e) => e.textContent);

    void expect(summary).toEqual(jasmine.arrayContaining(expectedSummary));

    const row1 = spectator
      .queryAll('[role="row"][row-index="0"] [role="gridcell"]')
      .map((e) => e.textContent);

    void expect(row1).toEqual(jasmine.arrayContaining(expectedValues[0]));

    const row2 = spectator
      .queryAll('[role="row"][row-index="1"] [role="gridcell"]')
      .map((e) => e.textContent);

    void expect(row2).toEqual(jasmine.arrayContaining(expectedValues[1]));
  }));
});
