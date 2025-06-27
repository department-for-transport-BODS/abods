import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DistancesRoutingModule } from "./distances-routing.module";
import { ViewDistancesComponent } from "./view-distances/view-distances.component";
import { LayoutModule } from "../layout/layout.module";
import { SharedModule } from "../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NgSelectModule } from "@ng-select/ng-select";
import { AgGridModule } from "ag-grid-angular";

@NgModule({
  declarations: [ViewDistancesComponent],
  imports: [
    CommonModule,
    LayoutModule,
    DistancesRoutingModule,
    SharedModule,
    FormsModule,
    RouterModule,
    NgSelectModule,
    ReactiveFormsModule,
    AgGridModule,
  ],
})
export class DistancesModule {}
