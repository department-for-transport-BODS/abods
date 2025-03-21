import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuardService } from "../authentication/auth-guard.service";
import { StopAnalysisComponent } from "./stop-analysis.component";
import { HelpdeskResolver } from "../shared/resolvers/helpdesk.resolver";

const routes: Routes = [
  {
    path: "",
    canActivateChild: [AuthGuardService],
    children: [{ path: "", component: StopAnalysisComponent }],
    data: {
      helpdeskFolder: "stopAnalysis",
      helpdeskTitle: "Stop analysis",
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StopAnalysisRoutingModule {}
