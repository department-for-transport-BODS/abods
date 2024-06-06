import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from '../authentication/auth-guard.service';
import { HelpdeskResolver } from '../shared/resolvers/helpdesk.resolver';
import { VehicleJourneysSearchComponent } from './vehicle-journeys-search/vehicle-journeys-search.component';
import { VehicleJourneysViewComponent } from './vehicle-journeys-view/vehicle-journeys-view.component';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuardService],
    children: [
      { path: '', component: VehicleJourneysSearchComponent },
      { path: ':journeyId', component: VehicleJourneysViewComponent },
    ],
    data: {
      helpdeskFolder: 'vehicleJourneys',
      helpdeskTitle: 'Vehicle journeys',
    },
    resolve: { helpdesk: HelpdeskResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VehicleJourneysRoutingModule {}
