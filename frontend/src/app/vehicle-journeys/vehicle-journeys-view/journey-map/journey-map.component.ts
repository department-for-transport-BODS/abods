import { Component, Input, OnChanges } from "@angular/core";
import { featureCollection, lineString, point } from "@turf/helpers";
import { Feature, FeatureCollection, LineString, Point } from "geojson";
import {
  EventData,
  Map,
  MapboxGeoJSONFeature,
  MapMouseEvent,
  ScaleControl,
} from "mapbox-gl";
import { pairwise } from "../../../shared/array-operators";
import {
  bbox2d,
  BRITISH_ISLES_BBOX,
  combineBounds,
  position,
} from "../../../shared/geo";
import { StopHoverEvent } from "../stop-list/stop-item/stop-item.component";
import { ConfigService } from "../../../config/config.service";
import {
  AvlPoint,
  MatchType,
  OtpEnum,
  Stop,
} from "../../../../generated/graphql";
import { DateTime } from "luxon";
import { JourneyInfo } from "../vehicle-journeys-view.component";

interface LineSegmentProps {
  id: string;
  onTimePerformance: OtpEnum | null;
}
type MouseEvent = MapMouseEvent & {
  features?: MapboxGeoJSONFeature[] | undefined;
} & EventData;

export const createStopModel = (stop: Stop, estimated: boolean) => ({
  id: stop.stopId.toString(),
  stopName: stop.stopName,
  isTimingPoint: stop.isTimingPoint,
  lat: stop.latitude,
  lon: stop.longitude,
  onTimePerformance:
    !estimated && stop.estimatedDepartureUtc ? null : stop.otp ?? null,
});
export type VehiclePingStop = ReturnType<typeof createStopModel>;

const createVehiclePing = (ping: AvlPoint, otp: OtpEnum | null) => ({
  lat: ping.latitude,
  lon: ping.longitude,
  ts: ping.recordedAtTimeUtc,
  onTimePerformance: otp,
  id:
    ping.latitude.toString() +
    ping.longitude.toString() +
    ping.recordedAtTimeUtc,
});

export type VehiclePing = ReturnType<typeof createVehiclePing>;

const segmentToLine = (
  segment: [VehiclePing, VehiclePing],
): Feature<LineString, LineSegmentProps> => {
  return lineString([position(segment[0]), position(segment[1])], {
    id: segment[0].id + segment[1].id,
    onTimePerformance: segment[0].onTimePerformance,
  });
};

export interface ComponentChange<T, P extends keyof T> {
  previousValue: T[P];
  currentValue: T[P];
  firstChange: boolean;
}

export type ComponentChanges<T> = {
  [P in keyof T]?: ComponentChange<T, P>;
};

@Component({
  selector: "app-journey-map",
  templateUrl: "./journey-map.component.html",
  styleUrls: ["./journey-map.component.scss"],
  standalone: false,
})
export class JourneyMapComponent implements OnChanges {
  protected readonly DateTime = DateTime;
  @Input() view: JourneyInfo | null = null;
  @Input() selectedStop?: Stop;
  @Input() hoveredStop?: StopHoverEvent;
  @Input() loading = false;
  @Input() matchType = MatchType.Evidenced;

  map!: Map;
  enableScaleControl = false;

  bounds = BRITISH_ISLES_BBOX;
  moveCounter = 0;
  cursorStyle = "";

  stops?: FeatureCollection<Point, VehiclePingStop>;
  timingPoints?: FeatureCollection<Point, VehiclePingStop>;
  line?: FeatureCollection<LineString, LineSegmentProps>;
  pings?: FeatureCollection<Point, VehiclePing>;

  tooltipStop?: VehiclePingStop;
  tooltipPing?: VehiclePing;

  otp = ["get", "onTimePerformance"];
  isEarly = ["==", this.otp, OtpEnum.Early];
  isOnTime = ["==", this.otp, OtpEnum.OnTime];
  isLate = ["==", this.otp, OtpEnum.Late];
  earlyColor = "#d53880";
  onTimeColor = "#4c2c92";
  lateColor = "#e5c700";
  noDataColor = "#b1b4b6";

  private _mapboxStyle: string = this.config.mapboxStyle;

  set mapboxStyle(style: string) {
    this._mapboxStyle = style;
  }
  get mapboxStyle(): string {
    return this._mapboxStyle;
  }

  constructor(private config: ConfigService) {}

  ngOnChanges(changes: ComponentChanges<JourneyMapComponent>): void {
    if (this.map && !this.enableScaleControl) {
      this.map.addControl(
        new ScaleControl({
          maxWidth: 80,
          unit: "metric", // You can use 'imperial' or 'nautical' as well
        }),
      );
      this.enableScaleControl = true;
    }
    const view = changes.view?.currentValue ?? this.view;
    if (view && (changes.view || changes.matchType)) {
      this.updateView(
        view,
        changes.matchType
          ? changes.matchType.currentValue === MatchType.Estimated
          : this.matchType === MatchType.Estimated,
      );
    }
    if (this.map && changes.selectedStop?.currentValue) {
      this.updateBoundsToSelectedStop(changes.selectedStop.currentValue);
    }
    if (this.map && changes.hoveredStop?.currentValue) {
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

  private updateView(view: JourneyInfo, estimated: boolean) {
    const models = view.stops.map((n) => createStopModel(n, estimated));
    this.stops = featureCollection(
      models
        .filter((stop) => !stop.isTimingPoint)
        .map((stop) => point(position(stop), stop)),
    );
    this.timingPoints = featureCollection(
      models
        .filter((stop) => stop.isTimingPoint)
        .map((stop) => point(position(stop), stop)),
    );
    const pings = view.avls.map((ping) => {
      const lastMatchedStop = view.stops
        .filter(
          (s) =>
            (s.actualDepartureUtc &&
              s.actualDepartureUtc <= ping.recordedAtTimeUtc) ||
            (estimated &&
              s.estimatedDepartureUtc &&
              s.estimatedDepartureUtc <= ping.recordedAtTimeUtc),
        )
        .pop();
      return createVehiclePing(ping, lastMatchedStop?.otp ?? null);
    });
    this.line = featureCollection(
      pairwise(pings).map((segment) => segmentToLine(segment)),
    );
    this.pings = featureCollection(
      pings.map((ping) => point(position(ping), ping)),
    );

    this.setJourneyBounds();
  }

  private updateBoundsToSelectedStop(selectedStop: Stop) {
    const collection = selectedStop.isTimingPoint
      ? this.timingPoints
      : this.stops;
    const selected = collection?.features.find(
      (stop) => stop.properties.id === selectedStop.stopId.toString(),
    );
    if (selected) {
      this.bounds = bbox2d(selected);
    }
  }

  private updateHoveredStopState(hoveredStop: StopHoverEvent) {
    switch (hoveredStop.event) {
      case "enter":
        this.stopSelected(
          createStopModel(
            hoveredStop.stop,
            this.matchType === MatchType.Estimated,
          ),
        );
        break;
      case "leave":
        this.stopUnselected();
        break;
    }
  }

  private stopSelected(stop: VehiclePingStop) {
    this.tooltipStop = stop;
    this.map.setFeatureState(
      { source: "journey-stops", id: this.tooltipStop.id },
      { hover: true },
    );
  }

  private stopUnselected() {
    this.cursorStyle = "";
    if (!this.tooltipStop) {
      return;
    }
    this.map.removeFeatureState(
      { source: "journey-stops", id: this.tooltipStop.id },
      "hover",
    );
    this.tooltipStop = undefined;
  }

  private pingSelected(ping: VehiclePing) {
    this.tooltipPing = ping;
    this.map.setFeatureState(
      { source: "journey-pings", id: this.tooltipPing.id },
      { hover: true },
    );
  }

  private pingUnselected() {
    this.cursorStyle = "";
    if (!this.tooltipPing) {
      return;
    }
    this.map.removeFeatureState(
      { source: "journey-pings", id: this.tooltipPing.id },
      "hover",
    );
    this.tooltipPing = undefined;
  }

  onStopMouseEnter(event: MouseEvent) {
    this.cursorStyle = "pointer";
    const stop = event.features?.[0]?.properties;
    if (!stop) {
      return;
    }
    this.stopSelected(stop as VehiclePingStop);
  }

  onStopMouseLeave(_: MouseEvent) {
    this.stopUnselected();
  }

  onPingMouseEnter(event: MouseEvent) {
    this.cursorStyle = "pointer";
    const ping = event.features?.[0]?.properties;
    if (!ping) {
      return;
    }
    this.pingSelected(ping as VehiclePing);
  }

  onPingMouseLeave(_: MouseEvent) {
    this.pingUnselected();
  }

  recentre() {
    this.moveCounter = 0;
    this.setJourneyBounds();
  }
}
