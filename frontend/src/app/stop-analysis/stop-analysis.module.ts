import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { StopAnalysisRoutingModule } from "./stop-analysis-routing.module";
import { StopAnalysisComponent } from "./stop-analysis.component";
import { LayoutModule } from "../layout/layout.module";
import { OnTimeModule } from "../on-time/on-time.module";
import { NgxMapboxGLModule } from "ngx-mapbox-gl";
import { SharedModule } from "../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgSelectModule } from "@ng-select/ng-select";
import { DateRangePickerComponent } from "../shared/components/date-range/date-range-picker.component";

@NgModule({
  declarations: [StopAnalysisComponent, DateRangePickerComponent],
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
