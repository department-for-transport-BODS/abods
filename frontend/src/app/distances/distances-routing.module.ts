import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuardService } from "../authentication/auth-guard.service";
import { ViewDistancesComponent } from "./view-distances/view-distances.component";
import { HelpdeskResolver } from "../shared/resolvers/helpdesk.resolver";

const routes: Routes = [
  {
    path: "",
    canActivateChild: [AuthGuardService],
    children: [{ path: "", component: ViewDistancesComponent }],
    data: {
      helpdeskFolder: "distances",
      helpdeskTitle: "Distances",
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistancesRoutingModule {}
