import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuardService } from "../authentication/auth-guard.service";
import { StopAnalysisComponent } from "./stop-analysis.component";

const routes: Routes = [
  {
    path: "",
    canActivateChild: [AuthGuardService],
    children: [{ path: "", component: StopAnalysisComponent }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StopAnalysisRoutingModule {}
