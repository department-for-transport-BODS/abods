import { NO_ERRORS_SCHEMA } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  byRole,
  byText,
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime } from "luxon";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { of } from "rxjs";
import { dateTimeEqualityMatcher } from "src/test-support/equality";
import { LayoutModule } from "../../layout/layout.module";
import { OperatorService } from "../../shared/services/operator.service";
import { SharedModule } from "../../shared/shared.module";
import { ChartNoDataWrapperComponent } from "../chart-no-data-wrapper/chart-no-data-wrapper.component";
import { ControlsComponent } from "../controls/controls.component";
import { DayOfWeekChartComponent } from "../day-of-week-chart/day-of-week-chart.component";
import { ExcessWaitTimeChartComponent } from "../excess-wait-time-chart/excess-wait-time-chart.component";
import { FilterChipsComponent } from "../filter-chips/filter-chips.component";
import { FiltersComponent } from "../filters/filters.component";
import { HeadwayService } from "../headway.service";
import { OnTimeService, PunctualityOverview } from "../on-time.service";
import { OtpThresholdFormComponent } from "../otp-threshold-form/otp-threshold-form.component";
import { OtpThresholdModalLinkComponent } from "../otp-threshold-modal-link/otp-threshold-modal-link.component";
import { OtpThresholdModalComponent } from "../otp-threshold-modal/otp-threshold-modal.component";
import { OverviewStatsComponent } from "../overview-stats/overview-stats.component";
import { PerformanceService } from "../performance.service";
import { ServiceGridComponent } from "../service-grid/service-grid.component";
import { ServiceMapComponent } from "../service-map/service-map.component";
import { StopsGridComponent } from "../stops-grid/stops-grid.component";
import { TimeSeriesChartComponent } from "../time-series-chart/time-series-chart.component";
import { ViewServiceComponent } from "./view-service.component";

describe("ViewServiceComponent", () => {
  let spectator: SpectatorRouting<ViewServiceComponent>;
  let component: ViewServiceComponent;
  let onTimeService: OnTimeService;

  const createComponent = createRoutingFactory({
    component: ViewServiceComponent,
    declarations: [
      FiltersComponent,
      ChartNoDataWrapperComponent,
      ControlsComponent,
      TimeSeriesChartComponent,
      ServiceMapComponent,
      FilterChipsComponent,
      StopsGridComponent,
      OverviewStatsComponent,
      OtpThresholdModalComponent,
      ServiceGridComponent,
      TimeSeriesChartComponent,
      DayOfWeekChartComponent,
      OtpThresholdModalComponent,
      OtpThresholdModalLinkComponent,
      ExcessWaitTimeChartComponent,
      OtpThresholdFormComponent,
    ],
    imports: [
      LayoutModule,
      SharedModule,
      FormsModule,
      ReactiveFormsModule,
      ApolloTestingModule,
      NgxTippyModule,
    ],
    providers: [
      mockProvider(OperatorService, {
        fetchOperators: () =>
          of([
            {
              nocCode: "ABCD",
              operatorId: "OP01",
              name: "Operator 1",
              adminAreaIds: [],
            },
          ]),
        fetchOperator: () =>
          of({
            nocCode: "ABCD",
            operatorId: "OP01",
            name: "Operator 1",
            adminAreaIds: [],
          }),
      }),
      mockProvider(OnTimeService, {
        fetchOnTimeStats: () => of({ completed: 0, scheduled: 0 }),
        fetchServiceInfo: () => of(null),
      }),
      mockProvider(HeadwayService, {
        fetchFrequentServiceInfo: () => of({ numHours: 0, totalHours: 0 }),
      }),
      mockProvider(PerformanceService, {
        fetchOverviewStats: () =>
          of({ onTime: { completed: 0, scheduled: 0 }, headway: undefined }),
        fetchHeadwayOverviewStats: () => of(undefined),
        fetchOnTimeOverviewStats: () => of({ completed: 0, scheduled: 0 }),
      }),
    ],
    schemas: [NO_ERRORS_SCHEMA],
    detectChanges: false,
    stubsEnabled: false,
  });

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeEqualityMatcher);
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
    component = spectator.component;
    onTimeService = spectator.inject(OnTimeService);
    spectator.inject(HeadwayService);
    spectator.inject(PerformanceService);
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });

  it("should not show operator selector on operator list page", () => {
    expect(spectator.query(byRole("combobox"))).not.toBeVisible();
  });

  it("should display no timetabled error message", () => {
    spyOn(onTimeService, "fetchOnTimeStats").and.returnValue(
      of({
        completed: 0,
        scheduled: 0,
      } as PunctualityOverview),
    );

    const nocCode = "ABCD";

    spectator.setRouteParam("nocCode", nocCode);
    component.params$.next({
      filters: {
        operatorIds: ["OP01"],
      },
      fromTimestamp: DateTime.fromISO("2021-01-01T00:00:00").toISO(),
      toTimestamp: DateTime.fromISO("2021-02-01T00:00:00").toISO(),
    });
    component.tabs?.openTab("distribution");

    spectator.detectChanges();

    expect(
      spectator.query(
        byText(
          /We have not found any timetable data for the time period and filters selected\./,
        ),
      ),
    ).toBeVisible();
  });
});
