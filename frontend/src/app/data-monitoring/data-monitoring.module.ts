import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DataMonitoringRoutingModule } from "./data-monitoring-routing.module";
import { ViewMonitorsComponent } from "./view-monitors/view-monitors.component";

@NgModule({
  declarations: [ViewMonitorsComponent],
  imports: [CommonModule, DataMonitoringRoutingModule],
})
export class DataMonitoringModule {}
