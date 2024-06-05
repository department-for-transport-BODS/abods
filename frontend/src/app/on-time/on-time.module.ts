import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { OnTimeRoutingModule } from './on-time-routing.module';
import { SharedModule } from '../shared/shared.module';
import { LayoutModule } from '../layout/layout.module';
import { DelayFrequencyChartComponent } from './delay-frequency-chart/delay-frequency-chart.component';
import { TimeSeriesChartComponent } from './time-series-chart/time-series-chart.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FiltersComponent } from './filters/filters.component';
import { OverviewStatsComponent } from './overview-stats/overview-stats.component';
import { StackedHistogramChartComponent } from './stacked-histogram-chart/stacked-histogram-chart.component';
import { OnTimeGridComponent } from './on-time-grid/on-time-grid.component';
import { AgGridModule } from 'ag-grid-angular';
import { TimeOfDayChartComponent } from './time-of-day-chart/time-of-day-chart.component';
import { DayOfWeekChartComponent } from './day-of-week-chart/day-of-week-chart.component';
import { StopsGridComponent } from './stops-grid/stops-grid.component';
import { TimingRendererComponent } from './stops-grid/timing-renderer/timing-renderer.component';
import { OperatorGridComponent } from './operator-grid/operator-grid.component';
import { SparklineFactoryComponent } from './operator-grid/sparkline-factory/sparkline-factory.component';
import { SparklineCellRendererComponent } from './operator-grid/sparkline-cell/sparkline-cell-renderer.component';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { ServiceMapComponent } from './service-map/service-map.component';
import { ChartNoDataWrapperComponent } from './chart-no-data-wrapper/chart-no-data-wrapper.component';
import { ExcessWaitTimeChartComponent } from './excess-wait-time-chart/excess-wait-time-chart.component';
import { ServiceGridComponent } from './service-grid/service-grid.component';
import { LuxonModule } from 'luxon-angular';
import { FilterChipsComponent } from './filter-chips/filter-chips.component';
import { ControlsComponent } from './controls/controls.component';
import { AllOperatorsComponent } from './all-operators/all-operators.component';
import { ViewOperatorComponent } from './view-operator/view-operator.component';
import { ViewServiceComponent } from './view-service/view-service.component';
import { AdminAreaMapComponent } from './admin-area/admin-area-map.component';
import { OperatorNotFoundComponent } from './operator-not-found/operator-not-found.component';
import { OtpThresholdFormComponent } from './otp-threshold-form/otp-threshold-form.component';
import { OtpThresholdModalComponent } from './otp-threshold-modal/otp-threshold-modal.component';
import { OtpThresholdModalLinkComponent } from './otp-threshold-modal-link/otp-threshold-modal-link.component';
import { NgxTippyModule } from 'ngx-tippy-wrapper';

@NgModule({
  declarations: [
    DelayFrequencyChartComponent,
    TimeSeriesChartComponent,
    OverviewStatsComponent,
    FiltersComponent,
    DayOfWeekChartComponent,
    TimeOfDayChartComponent,
    StackedHistogramChartComponent,
    TimeSeriesChartComponent,
    OverviewStatsComponent,
    OnTimeGridComponent,
    StopsGridComponent,
    TimingRendererComponent,
    OperatorGridComponent,
    SparklineFactoryComponent,
    SparklineCellRendererComponent,
    ServiceMapComponent,
    ChartNoDataWrapperComponent,
    ExcessWaitTimeChartComponent,
    ServiceGridComponent,
    FilterChipsComponent,
    ControlsComponent,
    AllOperatorsComponent,
    ViewOperatorComponent,
    ViewServiceComponent,
    AdminAreaMapComponent,
    OperatorNotFoundComponent,
    OtpThresholdFormComponent,
    OtpThresholdModalComponent,
    OtpThresholdModalLinkComponent,
  ],
  providers: [PercentPipe, DecimalPipe],
  imports: [
    CommonModule,
    OnTimeRoutingModule,
    LayoutModule,
    SharedModule,
    FormsModule,
    AgGridModule,
    NgxMapboxGLModule,
    ReactiveFormsModule,
    LuxonModule,
    NgxTippyModule,
  ],
  exports: [
    AllOperatorsComponent,
    ViewOperatorComponent,
    ViewServiceComponent,
    ServiceGridComponent,
    StopsGridComponent,
    OperatorGridComponent,
  ],
})
export class OnTimeModule {}
