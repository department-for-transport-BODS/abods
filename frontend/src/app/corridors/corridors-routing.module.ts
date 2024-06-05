import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/auth-guard.service';
import { CorridorsComponent } from './corridors.component';
import { CreateCorridorComponent } from './create/create-corridor.component';
import { CorridorResolver } from './corridor.resolver';
import { ViewCorridorComponent } from './view/view-corridor.component';
import { HelpdeskResolver } from '../shared/resolvers/helpdesk.resolver';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuardService],
    children: [
      { path: '', component: CorridorsComponent },
      { path: 'create', component: CreateCorridorComponent },
      { path: ':corridorId', component: ViewCorridorComponent, resolve: { corridor: CorridorResolver } },
      { path: 'edit/:corridorId', component: CreateCorridorComponent, resolve: { corridor: CorridorResolver } },
    ],
    data: {
      helpdeskFolder: 'corridors',
      helpdeskTitle: 'Corridors',
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CorridorsRoutingModule {}
