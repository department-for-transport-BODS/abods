import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VehicleJourneysRoutingModule } from './vehicle-journeys-routing.module';
import { VehicleJourneysSearchComponent } from './vehicle-journeys-search/vehicle-journeys-search.component';
import { VehicleJourneysViewComponent } from './vehicle-journeys-view/vehicle-journeys-view.component';
import { LayoutModule } from '../layout/layout.module';
import { StopListComponent } from './vehicle-journeys-view/stop-list/stop-list.component';
import { StopItemComponent } from './vehicle-journeys-view/stop-list/stop-item/stop-item.component';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { SharedModule } from '../shared/shared.module';
import { JourneyInfoComponent } from './vehicle-journeys-view/journey-info/journey-info.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LuxonModule } from 'luxon-angular';
import { OtpStatsComponent } from './vehicle-journeys-view/otp-stats/otp-stats.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { JourneyMapComponent } from './vehicle-journeys-view/journey-map/journey-map.component';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { JourneyNavComponent } from './vehicle-journeys-view/journey-nav/journey-nav.component';
import { VehicleJourneysGridComponent } from './vehicle-journeys-search/vehicle-journeys-grid/vehicle-journeys-grid.component';

@NgModule({
  declarations: [
    VehicleJourneysSearchComponent,
    VehicleJourneysViewComponent,
    StopListComponent,
    StopItemComponent,
    JourneyInfoComponent,
    OtpStatsComponent,
    JourneyMapComponent,
    JourneyNavComponent,
    VehicleJourneysGridComponent,
  ],
  imports: [
    CommonModule,
    VehicleJourneysRoutingModule,
    LayoutModule,
    NgxTippyModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    LuxonModule,
    NgSelectModule,
    NgxMapboxGLModule,
  ],
})
export class VehicleJourneysModule {}
