import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { EventData, FeatureIdentifier, LngLatBounds, MapboxGeoJSONFeature, MapMouseEvent } from 'mapbox-gl';
import { Map } from 'mapbox-gl';
import { ConfigService } from '../../../config/config.service';
import { BRITISH_ISLES_BBOX } from '../../../shared/geo';
import { Stop } from '../../corridors.service';
import { Subject, takeUntil } from 'rxjs';

type MGLMouseEvent = MapMouseEvent & { features?: MapboxGeoJSONFeature[] } & EventData;

/**
 * @see https://github.com/mapbox/mapbox-gl-js/issues/9461
 */
function removeFeatureStateSafe(map: mapboxgl.Map | undefined, identifier: FeatureIdentifier, key: string) {
  if (!map) {
    return;
  }
  const featureState = map.getFeatureState(identifier);
  if (Object.prototype.hasOwnProperty.call(featureState, key)) {
    map.removeFeatureState(identifier, key);
  }
}

@Component({
  selector: 'app-corridor-map',
  templateUrl: './corridor-map.component.html',
  styleUrls: ['./corridor-map.component.scss'],
})
export class CorridorMapComponent implements OnInit, OnDestroy {
  @Input() stopList: Stop[] = [];
  @Input() matchingStops?: FeatureCollection<Point, Stop>;
  @Input() matchingStopLines?: FeatureCollection<LineString>;
  @Input() corridorStops?: FeatureCollection<Point, Stop>;
  @Input() corridorLine?: Feature<LineString>;
  @Input() otherStops?: FeatureCollection<Point, Stop>;
  @Input() nonOrgStops?: FeatureCollection<Point, Stop>;
  @Input() displayRecentreButton?: boolean;
  @Input() resetMoveCounter?: EventEmitter<void>;

  @Output() selectStop = new EventEmitter<Feature<Point, Stop> | undefined>();
  @Output() boundsChanged = new EventEmitter<LngLatBounds>();
  @Output() recentreMap = new EventEmitter<void>();

  hoveredStop?: Feature<Point, Stop>;
  stopTooltipMessage?: string;
  initialBounds = BRITISH_ISLES_BBOX;
  mapCursor?: 'pointer' | 'default';
  map?: Map;
  moveCounter = 0;
  destroy$ = new Subject<void>();

  get nonOrgStopLayerBeforeId(): string | undefined {
    if (this.otherStops) return 'other-stop-markers';
    if (this.corridorStops) return 'corridor-markers';
    if (this.matchingStops) return 'matching-stop-markers';
    return undefined;
  }

  private _mapboxStyle: string = this.config.mapboxStyle;
  set mapboxStyle(style: string) {
    this._mapboxStyle = style;
  }
  get mapboxStyle(): string {
    return this._mapboxStyle;
  }

  constructor(private config: ConfigService) {}

  ngOnInit(): void {
    this.resetMoveCounter?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.moveCounter = 0;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateBounds() {
    if (this.map) this.boundsChanged.emit(this.map.getBounds());
  }

  stop(event: MGLMouseEvent): Feature<Point, Stop> | undefined {
    return (event.features?.[0] as unknown) as Feature<Point, Stop>;
  }

  setHoverState(stop: Feature) {
    if (this.matchingStops) {
      this.map?.setFeatureState({ source: 'matching-stops', id: stop.id }, { hover: true });
    }
    if (this.matchingStopLines) {
      this.map?.setFeatureState({ source: 'matching-stop-lines', id: stop.id }, { hover: true });
    }
  }

  clearHoverState(stop: Feature) {
    if (this.matchingStops) {
      removeFeatureStateSafe(this.map, { source: 'matching-stops', id: stop.id }, 'hover');
    }
    if (this.matchingStopLines) {
      removeFeatureStateSafe(this.map, { source: 'matching-stop-lines', id: stop.id }, 'hover');
    }
  }

  mapSetHover(stop?: Feature<Point, Stop>, highlight = false) {
    this.hoveredStop = stop;
    if (highlight && stop) {
      this.setHoverState(stop);
    }
    this.mapCursor = highlight ? 'pointer' : 'default';
  }

  mapClearHover() {
    if (this.hoveredStop) {
      this.clearHoverState(this.hoveredStop);
    }
    this.hoveredStop = undefined;
    this.mapCursor = undefined;
  }

  onRecentreMap() {
    this.recentreMap.emit();
  }
}
