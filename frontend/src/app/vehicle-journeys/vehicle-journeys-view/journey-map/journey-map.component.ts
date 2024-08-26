import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { featureCollection, lineString, point } from '@turf/helpers';
import { Feature, FeatureCollection, GeoJsonProperties, LineString, Point } from 'geojson';
import { Map } from 'mapbox-gl';
import { pairwise } from '../../../shared/array-operators';
import { BRITISH_ISLES_BBOX, bbox2d, combineBounds, position } from '../../../shared/geo';
import { OnTimePerformanceEnum } from '../on-time-performance.enum';
import { StopHoverEvent } from '../stop-list/stop-item/stop-item.component';
import { VehicleJourneyView } from '../vehicle-journey-view.model';
import { VehiclePing } from '../vehicle-ping.model';
import { VehiclePingStop } from '../vehicle-ping-stop.model';
import { ConfigService } from '../../../config/config.service';

type LineSegmentProps = { id: string; onTimePerformance: OnTimePerformanceEnum };

const segmentToLine = (segment: [VehiclePing, VehiclePing]): Feature<LineString, LineSegmentProps> => {
  return lineString([position(segment[0]), position(segment[1])], {
    id: segment[0].id + segment[1].id,
    onTimePerformance: segment[0].onTimePerformance,
  });
};

@Component({
  selector: 'app-journey-map',
  templateUrl: './journey-map.component.html',
  styleUrls: ['./journey-map.component.scss'],
})
export class JourneyMapComponent implements OnChanges {
  @Input() view?: VehicleJourneyView;
  @Input() selectedStop?: VehiclePingStop;
  @Input() hoveredStop?: StopHoverEvent;
  @Input() loading = false;

  map!: Map;

  bounds = BRITISH_ISLES_BBOX;
  moveCounter = 0;
  cursorStyle = '';

  stops?: FeatureCollection<Point, VehiclePingStop>;
  timingPoints?: FeatureCollection<Point, VehiclePingStop>;
  line?: FeatureCollection<LineString, LineSegmentProps>;
  pings?: FeatureCollection<Point, VehiclePing>;

  tooltipStop?: VehiclePingStop;
  tooltipPing?: VehiclePing;

  otp = ['get', 'onTimePerformance'];
  isEarly = ['==', this.otp, OnTimePerformanceEnum.Early];
  isOnTime = ['==', this.otp, OnTimePerformanceEnum.OnTime];
  isLate = ['==', this.otp, OnTimePerformanceEnum.Late];
  earlyColor = '#d53880';
  onTimeColor = '#4c2c92';
  lateColor = '#e5c700';
  noDataColor = '#b1b4b6';

  private _mapboxStyle: string = this.config.mapboxStyle;

  set mapboxStyle(style: string) {
    this._mapboxStyle = style;
  }
  get mapboxStyle(): string {
    return this._mapboxStyle;
  }

  constructor(private config: ConfigService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.view && changes.view.currentValue) {
      this.updateView(changes.view.currentValue);
    }
    if (this.map && changes.selectedStop && changes.selectedStop.currentValue) {
      this.updateBoundsToSelectedStop(changes.selectedStop.currentValue);
    }
    if (this.map && changes.hoveredStop && changes.hoveredStop.currentValue) {
      this.updateHoveredStopState(changes.hoveredStop.currentValue);
    }
    if (this.loading) {
      this.moveCounter = 0;
    }
  }

  private setJourneyBounds() {
    this.bounds = combineBounds([
      combineBounds([bbox2d(this.line), bbox2d(this.pings)]),
      combineBounds([bbox2d(this.stops), bbox2d(this.timingPoints)]),
    ]);
  }

  private updateView(view: VehicleJourneyView) {
    this.stops = featureCollection(
      view.stopList.filter((stop) => !stop.isTimingPoint).map((stop) => point(position(stop), stop))
    );
    this.timingPoints = featureCollection(
      view.stopList.filter((stop) => stop.isTimingPoint).map((stop) => point(position(stop), stop))
    );
    this.line = featureCollection(pairwise(view.gpsPingList).map((segment) => segmentToLine(segment)));
    this.pings = featureCollection(view.gpsPingList.map((ping) => point(position(ping), ping)));

    this.setJourneyBounds();
  }

  private updateBoundsToSelectedStop(selectedStop: VehiclePingStop) {
    let selected: Feature<Point, VehiclePingStop> | undefined;
    if (selectedStop.isTimingPoint) {
      selected = this.timingPoints?.features.find((stop) => stop.properties.id === selectedStop.id);
    } else {
      selected = this.stops?.features.find((stop) => stop.properties.id === selectedStop.id);
    }
    if (selected) {
      this.bounds = bbox2d(selected);
    }
  }

  private updateHoveredStopState(hoveredStop: StopHoverEvent) {
    switch (hoveredStop.event) {
      case 'enter':
        this.onStopMouseEnter(hoveredStop.stop);
        break;
      case 'leave':
        this.onStopMouseLeave();
        break;
    }
  }

  onStopMouseEnter(stop?: VehiclePingStop | GeoJsonProperties) {
    this.cursorStyle = 'pointer';
    if (!stop) {
      return;
    }
    this.tooltipStop = stop as VehiclePingStop;
    this.map.setFeatureState({ source: 'journey-stops', id: this.tooltipStop.id }, { hover: true });
  }

  onStopMouseLeave() {
    this.cursorStyle = '';
    if (!this.tooltipStop) {
      return;
    }
    this.map.removeFeatureState({ source: 'journey-stops', id: this.tooltipStop.id }, 'hover');
    this.tooltipStop = undefined;
  }

  onPingMouseEnter(ping?: VehiclePing | GeoJsonProperties) {
    this.cursorStyle = 'pointer';
    if (!ping) {
      return;
    }
    this.tooltipPing = ping as VehiclePing;
    this.map.setFeatureState({ source: 'journey-pings', id: this.tooltipPing.id }, { hover: true });
  }

  onPingMouseLeave() {
    this.cursorStyle = '';
    if (!this.tooltipPing) {
      return;
    }
    this.map.removeFeatureState({ source: 'journey-pings', id: this.tooltipPing.id }, 'hover');
    this.tooltipPing = undefined;
  }

  recentre() {
    this.moveCounter = 0;
    this.setJourneyBounds();
  }
}
