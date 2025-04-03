import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuardService } from "../authentication/auth-guard.service";
import { ViewMonitorsComponent } from "./view-monitors/view-monitors.component";

const routes: Routes = [
  {
    path: "",
    canActivateChild: [AuthGuardService],
    children: [{ path: "", component: ViewMonitorsComponent }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DataMonitoringRoutingModule {}
