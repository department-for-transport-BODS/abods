import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/auth-guard.service';
import { SingleOperatorGuardService } from './single-operator-guard.service';
import { AllOperatorsComponent } from './all-operators/all-operators.component';
import { ViewOperatorComponent } from './view-operator/view-operator.component';
import { ViewServiceComponent } from './view-service/view-service.component';
import { OperatorGuard } from './operator.guard';
import { OperatorNotFoundComponent } from './operator-not-found/operator-not-found.component';
import { HelpdeskResolver } from '../shared/resolvers/helpdesk.resolver';

const routes: Routes = [
  {
    path: 'operator-not-found',
    component: OperatorNotFoundComponent,
    data: {
      helpdeskFolder: 'otp',
      helpdeskTitle: 'On-time performance',
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
  {
    path: '',
    canActivateChild: [AuthGuardService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: AllOperatorsComponent,
        canActivate: [SingleOperatorGuardService],
      },
      {
        path: ':nocCode',
        component: ViewOperatorComponent,
        canActivate: [OperatorGuard],
      },
      {
        path: ':nocCode/:lineId',
        component: ViewServiceComponent,
        canActivate: [OperatorGuard],
      },
    ],
    data: {
      helpdeskFolder: 'otp',
      helpdeskTitle: 'On-time performance',
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OnTimeRoutingModule {}
