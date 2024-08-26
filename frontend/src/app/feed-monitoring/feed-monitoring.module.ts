import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutModule } from '../layout/layout.module';
import { FeedMonitoringComponent } from './feed-monitoring.component';
import { LiveStatusComponent } from './live-status/live-status.component';
import { LiveVehicleStatsComponent } from './live-status/live-vehicle-stats/live-vehicle-stats.component';
import { FeedMonitoringRoutingModule } from './feed-monitoring-routing.module';
import { ActiveCellComponent } from './grid/active-cell.component';
import { SparklineCellComponent } from './grid/sparkline-cell.component';
import { SparklineCellTemplateComponent } from './grid/sparkline-cell-template.component';
import { SharedModule } from '../shared/shared.module';
import { AgGridModule } from 'ag-grid-angular';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { FormsModule } from '@angular/forms';
import { FeedHistoryComponent } from './feed-history/feed-history.component';
import { AlertListComponent } from './alert-list/alert-list.component';
import { AlertComponent } from './alert-list/alert/alert.component';
import { HistoricVehicleStatsComponent } from './feed-history/historic-vehicle-stats/historic-vehicle-stats.component';
import { DatenavComponent } from './feed-history/datenav/datenav.component';
import { DatenavItemComponent } from './feed-history/datenav/datenav-item/datenav-item.component';
import { LuxonModule } from 'luxon-angular';

@NgModule({
  declarations: [
    FeedMonitoringComponent,
    LiveStatusComponent,
    LiveVehicleStatsComponent,
    ActiveCellComponent,
    SparklineCellComponent,
    SparklineCellTemplateComponent,
    FeedHistoryComponent,
    AlertListComponent,
    AlertComponent,
    DatenavComponent,
    DatenavItemComponent,
    HistoricVehicleStatsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    LayoutModule,
    NgxTippyModule,
    FeedMonitoringRoutingModule,
    AgGridModule,
    FormsModule,
    LuxonModule,
  ],
  exports: [FeedMonitoringComponent, LiveStatusComponent, LiveVehicleStatsComponent],
})
export class FeedMonitoringModule {}
