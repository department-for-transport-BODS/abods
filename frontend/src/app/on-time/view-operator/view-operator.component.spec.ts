import { fakeAsync, tick } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  byRole,
  byText,
  createRoutingFactory,
  SpectatorRouting,
  SpyObject,
} from "@ngneat/spectator";
import { AgGridModule } from "ag-grid-angular";
import { ApolloTestingModule } from "apollo-angular/testing";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { of } from "rxjs";
import { dateTimeEqualityMatcher } from "src/test-support/equality";
import { OperatorType } from "../../../generated/graphql";
import { LayoutModule } from "../../layout/layout.module";
import { TabsComponent } from "../../shared/components/tabs/tabs.component";
import { OperatorService } from "../../shared/services/operator.service";
import { SharedModule } from "../../shared/shared.module";
import { ChartNoDataWrapperComponent } from "../chart-no-data-wrapper/chart-no-data-wrapper.component";
import { ControlsComponent } from "../controls/controls.component";
import { DayOfWeekChartComponent } from "../day-of-week-chart/day-of-week-chart.component";
import { DelayFrequencyChartComponent } from "../delay-frequency-chart/delay-frequency-chart.component";
import { FilterChipsComponent } from "../filter-chips/filter-chips.component";
import { FiltersComponent } from "../filters/filters.component";
import { OnTimeGridComponent } from "../on-time-grid/on-time-grid.component";
import { OnTimeService, PunctualityOverview } from "../on-time.service";
import { OtpThresholdFormComponent } from "../otp-threshold-form/otp-threshold-form.component";
import { OtpThresholdModalLinkComponent } from "../otp-threshold-modal-link/otp-threshold-modal-link.component";
import { OtpThresholdModalComponent } from "../otp-threshold-modal/otp-threshold-modal.component";
import { OverviewStatsComponent } from "../overview-stats/overview-stats.component";
import { PerformanceService } from "../performance.service";
import { ServiceGridComponent } from "../service-grid/service-grid.component";
import { StackedHistogramChartComponent } from "../stacked-histogram-chart/stacked-histogram-chart.component";
import { TimeOfDayChartComponent } from "../time-of-day-chart/time-of-day-chart.component";
import { TimeSeriesChartComponent } from "../time-series-chart/time-series-chart.component";
import { ViewOperatorComponent } from "./view-operator.component";

fdescribe("ViewOperatorComponent", () => {
  let spectator: SpectatorRouting<ViewOperatorComponent>;
  let component: ViewOperatorComponent;
  let operatorService: SpyObject<OperatorService>;
  let onTimeService: SpyObject<OnTimeService>;
  let performanceService: SpyObject<PerformanceService>;

  const mockOperator: OperatorType = {
    nocCode: "OP01",
    operatorId: "1",
    name: "Operator 1",
    adminAreaIds: [],
  };

  const createComponent = createRoutingFactory({
    component: ViewOperatorComponent,
    declarations: [
      FiltersComponent,
      ChartNoDataWrapperComponent,
      ControlsComponent,
      TabsComponent,
      FilterChipsComponent,
      TimeSeriesChartComponent,
      ServiceGridComponent,
      OverviewStatsComponent,
      DayOfWeekChartComponent,
      DelayFrequencyChartComponent,
      TimeOfDayChartComponent,
      OnTimeGridComponent,
      OtpThresholdModalLinkComponent,
      OtpThresholdModalComponent,
      OtpThresholdFormComponent,
      StackedHistogramChartComponent,
    ],
    imports: [
      LayoutModule,
      SharedModule,
      FormsModule,
      ReactiveFormsModule,
      ApolloTestingModule,
      AgGridModule,
      NgxTippyModule,
    ],
    mocks: [OperatorService, OnTimeService, PerformanceService],
    detectChanges: false,
    stubsEnabled: false,
  });

  beforeEach(() => {
    jasmine.addCustomEqualityTester(dateTimeEqualityMatcher);
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    operatorService = spectator.inject(OperatorService);
    onTimeService = spectator.inject(OnTimeService);
    performanceService = spectator.inject(PerformanceService);

    operatorService.fetchOperators.and.returnValue(of([mockOperator]));
    operatorService.fetchOperator.and.returnValue(of(mockOperator));
    onTimeService.fetchOnTimeStats.and.returnValue(
      of({
        completed: 0,
        scheduled: 100,
        incomplete: "{}",
      } as PunctualityOverview),
    );
    onTimeService.fetchOnTimeDelayFrequencyData.and.returnValue(of([]));
    onTimeService.fetchOnTimePunctualityTimeOfDayData.and.returnValue(of([]));
    onTimeService.fetchOnTimePunctualityDayOfWeekData.and.returnValue(of([]));
    onTimeService.fetchOnTimeTimeSeriesData.and.returnValue(of([]));
    performanceService.fetchOverviewStats.and.returnValue(
      of({
        onTime: {
          completed: 0,
          scheduled: 100,
          incomplete: "{}",
        } as PunctualityOverview,
      }),
    );
    performanceService.fetchHeadwayOverviewStats.and.returnValue(of({}));
    performanceService.fetchOnTimeOverviewStats.and.returnValue(
      of({
        completed: 0,
        scheduled: 100,
        incomplete: "{}",
      } as PunctualityOverview),
    );
    performanceService.fetchServicePerformance.and.returnValue(of([]));
  });

  fdescribe("Operator 1", () => {
    it("should create", async () => {
      spectator.setRouteParam("nocCode", "OP01");

      await expect(component).toBeTruthy();
    });

    it("should show operator selector on service list page", () => {
      spectator.setRouteParam("nocCode", "OP01");
      spectator.detectChanges();

      expect(spectator.query(byRole("combobox"))).toBeVisible();
      expect(spectator.query(byText("Operator 1 (OP01)"))).toBeVisible();
    });

    it("should not show operator not found message if operator exists", () => {
      spectator.setRouteParam("nocCode", "OP01");

      expect(spectator.query(byText(/Not found/))).not.toBeVisible();
    });

    it("should display no timetabled error message", () => {
      performanceService.fetchOverviewStats.and.returnValue(
        of({
          onTime: {
            completed: 0,
            scheduled: 0,
            incomplete: "{}",
          } as PunctualityOverview,
        }),
      );

      const nocCode = "OP01";

      spectator.setRouteParam("nocCode", nocCode);

      spectator.detectChanges();

      expect(
        spectator.query(
          byText(
            /We have not found any timetable data for the time period and filters selected\./,
          ),
        ),
      ).toBeVisible();
    });

    it("should display no data error message", () => {
      onTimeService.fetchOnTimeStats.and.returnValue(
        of({
          completed: 0,
          scheduled: 100,
          incomplete: "{}",
        } as PunctualityOverview),
      );

      const nocCode = "OP01";

      spectator.setRouteParam("nocCode", nocCode);

      spectator.detectChanges();

      expect(
        spectator.query(
          byText(
            /We have not received any vehicle location data for the time period and filters selected\./,
          ),
        ),
      ).toBeVisible();
    });
  });

  fdescribe("tabs", () => {
    beforeEach(() => {
      spectator.setRouteParam("nocCode", "OP01");
      spectator.detectChanges();
    });

    it("should default to Timeline tab if no tab queryParam passed", async () => {
      await expect(spectator.query(".on-time__otp-chart")).toBeTruthy();
      await expect(spectator.query(".on-time__dow-chart")).toBeFalsy();
    });

    it("should show tab that passed by queryParam", fakeAsync(async () => {
      spectator.setRouteQueryParam("tab", "day-of-week");
      tick(1);
      spectator.detectChanges();

      await expect(spectator.query(".on-time__dow-chart")).toBeTruthy();
      await expect(spectator.query(".on-time__otp-chart")).toBeFalsy();
    }));
  });
});
