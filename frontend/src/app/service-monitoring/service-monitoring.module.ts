import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ServiceMonitoringRoutingModule } from "./service-monitoring-routing.module";
import { ViewServiceMonitoringDashboardComponent } from "./view-service-monitoring-dashboard/view-service-monitoring-dashboard.component";
import { SharedModule } from "../shared/shared.module";
import { LayoutModule } from "../layout/layout.module";

@NgModule({
  declarations: [ViewServiceMonitoringDashboardComponent],
  imports: [
    CommonModule,
    ServiceMonitoringRoutingModule,
    SharedModule,
    LayoutModule,
  ],
})
export class ServiceMonitoringModule {}
