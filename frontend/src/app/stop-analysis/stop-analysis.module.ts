import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { StopAnalysisRoutingModule } from "./stop-analysis-routing.module";
import { ViewStopsComponent } from "./view-stops/view-stops.component";
import { LayoutModule } from "../layout/layout.module";
import { OnTimeModule } from "../on-time/on-time.module";
import { NgxMapboxGLModule } from "ngx-mapbox-gl";
import { SharedModule } from "../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { DateRangePickerComponent } from "../shared/components/date-range/date-range-picker.component";

@NgModule({
  declarations: [ViewStopsComponent, DateRangePickerComponent],
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
