import { FormsModule } from "@angular/forms";
import { createComponentFactory, Spectator } from "@ngneat/spectator";
import { AgGridModule } from "ag-grid-angular";
import { DateTime } from "luxon";
import { of, throwError } from "rxjs";
import { LayoutModule } from "src/app/layout/layout.module";
import { SharedModule } from "src/app/shared/shared.module";
import { OnTimeService, StopPerformance } from "../on-time.service";

import { CommonModule, PercentPipe } from "@angular/common";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { discardPeriodicTasks, fakeAsync, tick } from "@angular/core/testing";
import { RouterModule } from "@angular/router";
import { SvgIconRegistryService } from "angular-svg-icon";
import { ApolloTestingModule } from "apollo-angular/testing";
import { Direction } from "../../../generated/graphql";
import { OnTimeModule } from "../on-time.module";
import { StopsGridComponentDisplayComponent } from "./stops-grid-display.component";
import { StopsGridComponent } from "./stops-grid.component";
import { TimingRendererComponent } from "./timing-renderer/timing-renderer.component";

describe("StopsGridComponent", () => {
  let spectator: Spectator<StopsGridComponent>;
  let service: OnTimeService;

  const createComponent = createComponentFactory({
    component: StopsGridComponent,
    declarations: [TimingRendererComponent, StopsGridComponentDisplayComponent],
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

  const stops: StopPerformance[] = [
    {
      lineId: "LI00001",
      stopId: "ST000000000001",
      stopInfo: {
        sourceId: "",
        stopName: "Something road",
        stopId: "ST000000000001",
        stopLocation: { latitude: 56.7686, longitude: 0.4567 },
        stopLocality: {
          localityId: "L1",
          localityAreaId: "LA1",
          localityName: "Somewhere",
          localityAreaName: "Some Town",
        },
      },
      scheduledDepartures: 31,
      actualDepartures: 30,
      completedRatio: 30 / 31,
      onTime: 28,
      early: 2,
      late: 0,
      total: 30,
      onTimeRatio: 28 / 30,
      earlyRatio: 2 / 30,
      lateRatio: 0,
      averageDelay: 12,
      timingPoint: false,
      direction: Direction.Inbound,
      averageScheduled: 60,
      averageActual: 60,
      onTimeInSeconds: 60,
      lateInSeconds: 60,
      earlyInSeconds: 60,
    },
    {
      lineId: "LI00001",
      stopId: "ST000000000002",
      stopInfo: {
        sourceId: "",
        stopName: "Thingy street",
        stopId: "ST000000000002",
        stopLocation: { latitude: 56.7686, longitude: 0.4567 },
        stopLocality: {
          localityId: "L1",
          localityAreaId: "LA1",
          localityName: "Somewhere",
          localityAreaName: "Some Town",
        },
      },
      scheduledDepartures: 29,
      actualDepartures: 27,
      completedRatio: 27 / 29,
      onTime: 26,
      early: 3,
      late: 1,
      total: 30,
      onTimeRatio: 26 / 29,
      earlyRatio: 3 / 29,
      lateRatio: 1 / 29,
      averageDelay: 44,
      timingPoint: true,
      direction: Direction.Inbound,
      averageScheduled: 60,
      averageActual: 60,
      onTimeInSeconds: 60,
      lateInSeconds: 60,
      earlyInSeconds: 60,
    },
  ];

  beforeEach(() => {
    spectator = createComponent();
    service = spectator.inject(OnTimeService);
  });

  it("should call service without admin area ids", () => {
    spectator.component.params = {
      fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
      toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
      filters: { nocCodes: ["NOC1"], adminAreaIds: ["AA050"] },
    };

    const spy = spyOn(service, "fetchStopPerformanceList").and.returnValue(
      of(stops),
    );
    spectator.detectChanges();

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
        toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
        filters: { nocCodes: ["NOC1"] },
      }),
    );
  });

  it("should fetch and set stop performance data", fakeAsync(async () => {
    const spy = spyOn(service, "fetchStopPerformanceList").and.returnValue(
      of(stops),
    );

    spectator.component.params = {
      fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
      toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
      filters: { nocCodes: ["NOC1"] },
    };

    spectator.detectChanges();
    tick(1000);

    expect(spy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
        toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
        filters: { nocCodes: ["NOC1"] },
      }),
    );
    await expect(spectator.component.data).toEqual(stops);
    await expect(spectator.component.loading).toBe(false);
    await expect(spectator.component.errored).toBe(false);

    discardPeriodicTasks();
  }));

  it("should aggregate data by stop when Direction.All is selected", fakeAsync(async () => {
    const stopsWithDuplicateStopIds: StopPerformance[] = [
      {
        ...stops[0],
        direction: Direction.Inbound,
        onTime: 20,
        early: 5,
        late: 5,
        total: 30,
      },
      {
        ...stops[0],
        direction: Direction.Outbound,
        onTime: 10,
        early: 3,
        late: 2,
        total: 15,
      },
    ];

    spyOn(service, "fetchStopPerformanceList").and.returnValue(
      of(stopsWithDuplicateStopIds),
    );

    spectator.component.preSelectedDirections = [Direction.All];
    spectator.component.params = {
      fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
      toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
      filters: { nocCodes: ["NOC1"] },
    };

    spectator.detectChanges();
    tick(100);

    // Should aggregate the two stops with the same stopId into one
    await expect(spectator.component.data?.length).toBe(1);
    await expect(spectator.component.data?.[0].stopId).toBe("ST000000000001");
    // onTime should be summed
    await expect(spectator.component.data?.[0].onTime).toBe(30);
    await expect(spectator.component.data?.[0].early).toBe(8);
    await expect(spectator.component.data?.[0].late).toBe(7);

    discardPeriodicTasks();
  }));

  it("should set loading state correctly during data fetch", fakeAsync(async () => {
    spyOn(service, "fetchStopPerformanceList").and.returnValue(of(stops));

    await expect(spectator.component.loading).toBe(true);

    spectator.component.params = {
      fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
      toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
      filters: { nocCodes: ["NOC1"] },
    };

    spectator.detectChanges();
    tick(100);

    await expect(spectator.component.loading).toBe(false);

    discardPeriodicTasks();
  }));

  it("should set errored state when service fails", fakeAsync(async () => {
    spyOn(service, "fetchStopPerformanceList").and.returnValue(
      throwError(() => new Error("Service error")),
    );

    spectator.component.params = {
      fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
      toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
      filters: { nocCodes: ["NOC1"] },
    };

    spectator.detectChanges();
    tick(100);

    await expect(spectator.component.errored).toBe(true);
    await expect(spectator.component.data).toEqual([]);

    discardPeriodicTasks();
  }));

  it("should calculate CSV filename correctly", fakeAsync(async () => {
    spyOn(service, "fetchStopPerformanceList").and.returnValue(of(stops));

    spectator.component.params = {
      fromTimestamp: DateTime.fromISO("2021-02-01T00:00:00Z").toISO(),
      toTimestamp: DateTime.fromISO("2021-03-01T00:00:00Z").toISO(),
      filters: { lineIds: ["LINE123"], nocCodes: ["NOC1"] },
    };

    spectator.detectChanges();
    tick(100);

    await expect(spectator.component.csvFilename).toBe(
      "Stop_Performance_LINE123_21-02-01_-_21-02-28",
    );

    discardPeriodicTasks();
  }));

  it("should emit directionsChanged when direction changes", () => {
    const spy = spyOn(spectator.component.directionsChanged, "emit");

    spectator.component.onDirectionChange([Direction.Inbound]);

    expect(spy).toHaveBeenCalledWith([Direction.Inbound]);
  });
});
