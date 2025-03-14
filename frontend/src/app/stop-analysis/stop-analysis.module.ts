import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { StopAnalysisRoutingModule } from "./stop-analysis-routing.module";
import { ViewStopsComponent } from "./view-stops/view-stops.component";
import { LayoutModule } from "../layout/layout.module";
import { StopControlsComponent } from "./stop-controls/stop-controls.component";
import { OnTimeModule } from "../on-time/on-time.module";

@NgModule({
  declarations: [ViewStopsComponent, StopControlsComponent],
  imports: [
    CommonModule,
    LayoutModule,
    StopAnalysisRoutingModule,
    OnTimeModule,
  ],
})
export class StopAnalysisModule {}
