import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { StopAnalysisRoutingModule } from "./stop-analysis-routing.module";
import { ViewStopsComponent } from "./view-stops/view-stops.component";
import { LayoutModule } from "../layout/layout.module";
import { StopControlsComponent } from "./stop-controls/stop-controls.component";
import { OnTimeModule } from "../on-time/on-time.module";
import { NgxMapboxGLModule } from "ngx-mapbox-gl";
import { SharedModule } from "../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";

@NgModule({
  declarations: [ViewStopsComponent, StopControlsComponent],
  imports: [
    CommonModule,
    LayoutModule,
    StopAnalysisRoutingModule,
    OnTimeModule,
    NgxMapboxGLModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
  ],
})
export class StopAnalysisModule {}
