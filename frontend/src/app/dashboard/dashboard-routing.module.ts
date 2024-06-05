import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from '../authentication/auth-guard.service';
import { HelpdeskResolver } from '../shared/resolvers/helpdesk.resolver';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuardService],
    children: [{ path: '', component: DashboardComponent }],
    data: {
      helpdeskFolder: 'dashboard',
      helpdeskTitle: 'Dashboard',
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
