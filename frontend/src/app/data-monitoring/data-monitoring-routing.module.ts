import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuardService } from "../authentication/auth-guard.service";
import { ViewMonitorsComponent } from "./view-monitors/view-monitors.component";
import { HelpdeskResolver } from "../shared/resolvers/helpdesk.resolver";

const routes: Routes = [
  {
    path: "",
    canActivateChild: [AuthGuardService],
    children: [{ path: "", component: ViewMonitorsComponent }],
    data: {
      helpdeskFolder: "dataMonitoring",
      helpdeskTitle: "Data monitoring",
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DataMonitoringRoutingModule {}
