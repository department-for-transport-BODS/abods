import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { LayoutModule } from '../layout/layout.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { VehiclesStatusComponent } from './vehicles-status/vehicles-status.component';
import { PerformanceComponent } from './performance/performance.component';
import { PerformanceChartComponent } from './performance/chart/chart.component';
import { FeedStatusSingleComponent } from './feed-status-single/feed-status-single.component';
import { FeedStatusSummaryComponent } from './feed-status-summary/feed-status-summary.component';
import { PerformanceRankingComponent } from './performance/ranking-table/ranking-table.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DashboardComponent,
    VehiclesStatusComponent,
    FeedStatusSingleComponent,
    FeedStatusSummaryComponent,
    PerformanceComponent,
    PerformanceChartComponent,
    PerformanceRankingComponent,
  ],
  imports: [CommonModule, RouterModule, LayoutModule, SharedModule, DashboardRoutingModule, FormsModule],
  exports: [DashboardComponent, VehiclesStatusComponent],
})
export class DashboardModule {}
