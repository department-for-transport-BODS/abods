import { Component, EventEmitter, Output } from '@angular/core';
import { ConfigService } from '../../../config/config.service';

enum MapboxStyleOption {
  Default = 'default',
  satellite = 'satellite',
}

@Component({
  selector: 'app-map-view-toggle',
  templateUrl: './map-view-toggle.component.html',
  styleUrls: ['./map-view-toggle.component.scss'],
})
export class MapViewToggleComponent {
  @Output() mapboxStyle = new EventEmitter<string>();

  mapboxStyleOption: MapboxStyleOption = MapboxStyleOption.Default;

  constructor(private config: ConfigService) {}

  private styles = {
    [MapboxStyleOption.Default]: this.config.mapboxStyle,
    [MapboxStyleOption.satellite]: this.config.mapboxSatelliteStyle,
  };

  onStyleChange() {
    this.mapboxStyle.emit(this.styles[this.mapboxStyleOption]);
  }
}
