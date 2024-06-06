import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorridorsRoutingModule } from './corridors-routing.module';
import { CorridorsComponent } from './corridors.component';
import { SharedModule } from '../shared/shared.module';
import { LayoutModule } from '../layout/layout.module';
import { CreateCorridorComponent } from './create/create-corridor.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { AgGridModule } from 'ag-grid-angular';
import { CorridorsGridComponent } from './grid/corridors-grid.component';
import { ViewCorridorComponent } from './view/view-corridor.component';
import { LuxonModule } from 'luxon-angular';
import { SegmentSelectorComponent } from './segment-selector/segment-selector.component';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { BoxPlotChartComponent } from './view/box-plot-chart/box-plot-chart.component';
import { HistogramChartComponent } from './view/histogram-chart/histogram-chart.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { StopSearchListComponent } from './create/stop-search-list/stop-search-list.component';
import { CorridorStopListComponent } from './create/corridor-stop-list/corridor-stop-list.component';
import { CorridorMapComponent } from './create/corridor-map/corridor-map.component';
import { DeleteCorridorModalComponent } from './delete-corridor-modal/delete-corridor-modal.component';

@NgModule({
  declarations: [
    CorridorsComponent,
    CreateCorridorComponent,
    CorridorsGridComponent,
    ViewCorridorComponent,
    SegmentSelectorComponent,
    BoxPlotChartComponent,
    HistogramChartComponent,
    StopSearchListComponent,
    CorridorStopListComponent,
    CorridorMapComponent,
    DeleteCorridorModalComponent,
  ],
  imports: [
    CommonModule,
    CorridorsRoutingModule,
    LayoutModule,
    SharedModule,
    ReactiveFormsModule,
    NgxMapboxGLModule,
    AgGridModule,
    FormsModule,
    LuxonModule,
    NgxTippyModule,
    NgSelectModule,
  ],
  exports: [CorridorsComponent],
})
export class CorridorsModule {}
