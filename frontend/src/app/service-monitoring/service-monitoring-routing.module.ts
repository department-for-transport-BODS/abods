import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuardService } from "../authentication/auth-guard.service";
import { ViewServiceMonitoringDashboardComponent } from "./view-service-monitoring-dashboard/view-service-monitoring-dashboard.component";
import { HelpdeskResolver } from "../shared/resolvers/helpdesk.resolver";

const routes: Routes = [
  {
    path: "",
    canActivateChild: [AuthGuardService],
    children: [
      { path: "", component: ViewServiceMonitoringDashboardComponent },
    ],
    data: {
      helpdeskFolder: "serviceMonitoring",
      helpdeskTitle: "Service monitoring",
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServiceMonitoringRoutingModule {}
