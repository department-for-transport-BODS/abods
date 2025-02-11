import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DataMonitoringRoutingModule } from "./data-monitoring-routing.module";
import { ViewMonitorsComponent } from "./view-monitors/view-monitors.component";
import { SharedModule } from "../shared/shared.module";
import { LayoutModule } from "../layout/layout.module";

@NgModule({
  declarations: [ViewMonitorsComponent],
  imports: [
    CommonModule,
    DataMonitoringRoutingModule,
    SharedModule,
    LayoutModule,
  ],
})
export class DataMonitoringModule {}
