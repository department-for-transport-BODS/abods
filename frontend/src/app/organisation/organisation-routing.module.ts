import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from '../authentication/auth-guard.service';
import { UsersComponent } from './users/users.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { AlertsComponent } from './alerts/alerts.component';
import { UserNotFoundComponent } from './user-not-found/user-not-found.component';
import { OrganisationUserGuard } from './organisation-user.guard';
import { HelpdeskResolver } from '../shared/resolvers/helpdesk.resolver';

export const OrganisationRoutes: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuardService],
    children: [
      {
        path: 'user-not-found',
        component: UserNotFoundComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'users/edit/:email',
        component: EditUserComponent,
        canActivate: [AuthGuardService, OrganisationUserGuard],
        data: { roles: ['Administrator'] },
      },
      {
        path: 'alerts',
        component: AlertsComponent,
      },
    ],
    data: {
      helpdeskFolder: 'organisation',
      helpdeskTitle: 'My organisation',
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(OrganisationRoutes)],
  exports: [RouterModule],
})
export class OrganisationRoutingModule {}
