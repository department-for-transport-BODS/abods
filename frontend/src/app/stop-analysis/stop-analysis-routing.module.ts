import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuardService } from "../authentication/auth-guard.service";
import { ViewStopsComponent } from "./view-stops/view-stops.component";

const routes: Routes = [
  {
    path: "",
    canActivateChild: [AuthGuardService],
    children: [{ path: "", component: ViewStopsComponent }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StopAnalysisRoutingModule {}
