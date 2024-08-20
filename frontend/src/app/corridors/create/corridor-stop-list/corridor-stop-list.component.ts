import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Feature, FeatureCollection, Point } from 'geojson';
import { Stop } from '../../corridors.service';

@Component({
  selector: 'app-corridor-stop-list',
  templateUrl: './corridor-stop-list.component.html',
  styleUrls: ['./corridor-stop-list.component.scss'],
})
export class CorridorStopListComponent {
  @Input() corridorStops?: FeatureCollection<Point, Stop>;
  @Input() loading = false;
  @Input() isEdit = false;
  @Output() mouseOver = new EventEmitter<Feature<Point, Stop>>();
  @Output() mouseLeave = new EventEmitter<Feature<Point, Stop>>();
  @Output() removeLastStop = new EventEmitter<Feature<Point, Stop>>();
}
