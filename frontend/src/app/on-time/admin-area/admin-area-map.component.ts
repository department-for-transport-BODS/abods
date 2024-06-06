import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AdminArea, AdminAreaService } from './admin-area.service';
import { asBbox, BRITISH_ISLES_BBOX, combineBounds } from '../../shared/geo';
import { BBox2d } from '@turf/helpers/dist/js/lib/geojson';
import { EventData, MapboxGeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { MapComponent } from 'ngx-mapbox-gl';
import { featureCollection } from '@turf/helpers';
import bboxClip from '@turf/bbox-clip';
import pointOnFeature from '@turf/point-on-feature';
import { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import { isEqual } from 'lodash-es';
import { ConfigService } from '../../config/config.service';

@Component({
  selector: 'app-admin-area-map',
  template: ` <mgl-map
    #map
    [style]="mapboxStyle"
    [fitBounds]="bounds"
    [fitBoundsOptions]="{ padding: 50, duration: 0 }"
    [appAutoResizeMap]="map.mapInstance"
    (mapDragEnd)="recalculateLabelPosition()"
    (zoomEnd)="recalculateLabelPosition()"
  >
    <mgl-geojson-source id="boundaries" promoteId="id" [data]="adminAreas"></mgl-geojson-source>
    <mgl-layer
      id="admin-area-boundaries"
      type="fill"
      [paint]="{
        'fill-color': '#28A197',
        'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.8, 0.3]
      }"
      [filter]="adminAreaIds.length ? ['in', ['get', 'id'], ['literal', adminAreaIds]] : ['has', 'id']"
      source="boundaries"
      (layerMouseMove)="boundaryHover($event)"
      (layerMouseLeave)="clearBoundaryHover()"
      (layerClick)="select($event)"
    ></mgl-layer>
    <mgl-popup
      *ngIf="hoveredAdminArea && labelPosition"
      [feature]="labelPosition"
      [closeButton]="false"
      [closeOnClick]="false"
      maxWidth="200"
      className="gds-popup"
    >
      <div class="govuk-body-small govuk-!-font-weight-bold govuk-!-margin-bottom-1">
        {{ hoveredAdminArea.properties.name }}
      </div>
      <div class="govuk-body-small">{{ hoveredAdminArea.id }}</div>
    </mgl-popup>
  </mgl-map>`,
  styles: [
    `
      mgl-map {
        height: 380px;
      }
    `,
  ],
})
export class AdminAreaMapComponent implements OnInit {
  get adminAreaIds(): string[] {
    return this._adminAreaIds ?? [];
  }

  @Input()
  set adminAreaIds(value: string[]) {
    if (!isEqual(value, this._adminAreaIds)) {
      this._adminAreaIds = value;
      this.recalculateBounds();
    }
  }
  private _adminAreaIds?: string[];
  @Output() boundaryClick = new EventEmitter<AdminArea>();

  adminAreas: FeatureCollection<Polygon, AdminArea> = featureCollection([]);
  bounds: BBox2d = BRITISH_ISLES_BBOX;
  hoveredAdminArea?: Feature<Polygon, AdminArea>;
  labelPosition?: Feature<Point>;

  @ViewChild(MapComponent) map?: MapComponent;

  constructor(private adminAreaService: AdminAreaService, private config: ConfigService) {}

  get mapboxStyle(): string {
    return this.config.mapboxStyle;
  }

  ngOnInit() {
    this.adminAreaService.fetchAdminAreaBoundaries().subscribe((adminAreas) => {
      this.adminAreas = adminAreas;
      this.recalculateBounds();
    });
  }

  recalculateLabelPosition() {
    if (this.hoveredAdminArea && this.map) {
      const viewBounds = this.map?.mapInstance.getBounds();
      this.labelPosition = pointOnFeature(bboxClip(this.hoveredAdminArea, asBbox(viewBounds)));
    }
  }

  recalculateBounds() {
    if (!this._adminAreaIds?.length || !this.adminAreas.features.length) {
      this.bounds = (this.adminAreas.bbox as BBox2d) ?? BRITISH_ISLES_BBOX;
      return;
    }
    const selected = this.adminAreas.features.filter((feature) => this._adminAreaIds?.includes(feature.properties.id));
    if (!selected.length) {
      return;
    }
    this.bounds = combineBounds(selected?.map((feature) => feature.bbox as BBox2d));
  }

  boundaryHover(event: MapMouseEvent & { features?: MapboxGeoJSONFeature[] } & EventData) {
    const adminArea = event.features?.[0] as Feature;
    if (this.hoveredAdminArea && this.hoveredAdminArea?.id !== adminArea?.id) {
      this.clearBoundaryHover();
    }
    this.hoveredAdminArea = adminArea as Feature<Polygon, AdminArea>;
    this.map?.mapInstance?.setFeatureState({ source: 'boundaries', id: this.hoveredAdminArea?.id }, { hover: true });
    this.recalculateLabelPosition();
  }

  clearBoundaryHover() {
    this.map?.mapInstance?.removeFeatureState({ source: 'boundaries', id: this.hoveredAdminArea?.id }, 'hover');
    this.hoveredAdminArea = undefined;
    this.labelPosition = undefined;
  }

  select(event: MapMouseEvent & { features?: MapboxGeoJSONFeature[] } & EventData) {
    const adminArea = event.features?.[0] as Feature;
    this.boundaryClick.emit(adminArea.properties as AdminArea);
  }
}
