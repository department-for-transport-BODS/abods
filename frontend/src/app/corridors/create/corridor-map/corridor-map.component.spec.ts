import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import {
  createComponentFactory,
  createSpyObject,
  Spectator,
  SpyObject,
} from "@ngneat/spectator";
import { Feature, FeatureCollection, LineString, Point } from "geojson";
import {
  FeatureIdentifier,
  LngLatBounds,
  LngLatBoundsLike,
  LngLatLike,
  Map,
} from "mapbox-gl";
import { MapComponent, NgxMapboxGLModule } from "ngx-mapbox-gl";
import { NgxSmartModalModule } from "ngx-smart-modal";
import { EMPTY } from "rxjs";
import { ConfigService } from "../../../config/config.service";
import { GdsModule } from "../../../shared/gds/gds.module";
import { SharedModule } from "../../../shared/shared.module";
import { CorridorsService } from "../../corridors.service";
import { CorridorStop } from "../../types";
import { CorridorMapComponent } from "./corridor-map.component";

/**
 * A bare-minimum stub for ngx-mapbox-gl
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "mgl-map",
  template: ``,
  providers: [
    { provide: MapComponent, useExisting: forwardRef(() => StubMapComponent) },
  ],
  standalone: false,
})
export class StubMapComponent implements OnInit {
  @Output() moveEnd = new EventEmitter<void>();
  @Input() bounds?: LngLatBounds;
  @Output() mapLoad = new EventEmitter<Map>();

  mapInstance = createSpyObject(Map, {
    getBounds: () => this.bounds,
    fitBounds: (bounds: LngLatBoundsLike) => {
      this.bounds = LngLatBounds.convert(bounds);
      this.cdr.detectChanges();
      this.moveEnd.emit();
    },
  });
  move = (sw: LngLatLike, ne: LngLatLike) => {
    this.bounds = new LngLatBounds(sw, ne);
    this.moveEnd.emit();
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.mapLoad.emit(this.mapInstance);
  }
}

describe("CorridorMapComponent", () => {
  let spectator: Spectator<CorridorMapComponent>;
  let corridorsService: SpyObject<CorridorsService>;

  const mockPointFeatureCollection: FeatureCollection<Point, CorridorStop> = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [-1.47, 53.37],
        },
        properties: {
          stopId: "test-stop",
          stopName: "Test Stop",
        } as CorridorStop,
        id: "test-stop",
      },
    ],
  };
  const mockLineStringFeatureCollection: FeatureCollection<LineString> = {
    type: "FeatureCollection",
    features: [
      {
        geometry: {
          type: "LineString",
          coordinates: [[-1.47, 53.37]],
        },
      },
    ],
  } as FeatureCollection<LineString>;

  const mockStop: Feature<Point, CorridorStop> = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-1.47, 53.37],
    },
    properties: {
      stopId: "test-stop",
      stopName: "Test Stop",
    } as CorridorStop,
    id: "test",
  };

  const createComponent = createComponentFactory({
    component: CorridorMapComponent,
    imports: [SharedModule, GdsModule, NgxMapboxGLModule, NgxSmartModalModule],
    declarations: [StubMapComponent],
    mocks: [CorridorsService, ConfigService],
    detectChanges: true,
  });

  beforeEach(() => {
    spectator = createComponent();
    corridorsService = spectator.inject(CorridorsService);
    spectator.detectChanges();
    corridorsService.queryStops.and.returnValue(EMPTY);
  });

  it("should create", () => {
    expect(spectator.component).toBeTruthy();
  });

  it("should emit location when map moves", () => {
    spyOn(spectator.component.boundsChanged, "emit");
    // Simulate map move event
    spectator.query(StubMapComponent)?.move([-1.47, 53.37], [-1.46, 53.39]);

    expect(spectator.component.boundsChanged.emit).toHaveBeenCalledWith(
      new LngLatBounds([-1.47, 53.37], [-1.46, 53.39]),
    );
  });

  describe("nonOrgStopLayerBeforeId", () => {
    it("should return other-stop-markers if otherStops exists", () => {
      spectator.component.otherStops = mockPointFeatureCollection;

      expect(spectator.component.nonOrgStopLayerBeforeId).toEqual(
        "other-stop-markers",
      );
    });

    it("should return corridor-markers if otherStops is undefined and corridorStops exists", () => {
      spectator.component.otherStops = undefined;
      spectator.component.corridorStops = mockPointFeatureCollection;

      expect(spectator.component.nonOrgStopLayerBeforeId).toEqual(
        "corridor-markers",
      );
    });

    it("should return matching-stop-markers if otherStops and corridorStops are undefined and matchingStops exists", () => {
      spectator.component.otherStops = undefined;
      spectator.component.corridorStops = undefined;
      spectator.component.matchingStops = mockPointFeatureCollection;

      expect(spectator.component.nonOrgStopLayerBeforeId).toEqual(
        "matching-stop-markers",
      );
    });

    it("should return undefinded if all layers are undefined", () => {
      spectator.component.otherStops = undefined;
      spectator.component.corridorStops = undefined;
      spectator.component.matchingStops = undefined;

      expect(spectator.component.nonOrgStopLayerBeforeId).toBeUndefined();
    });
  });

  it("should set hover state", () => {
    spectator.component.matchingStops = mockPointFeatureCollection;
    spectator.component.matchingStopLines = mockLineStringFeatureCollection;
    spectator.component.mapSetHover(mockStop, true);

    expect(spectator.component.map!.setFeatureState).toHaveBeenCalledWith(
      { source: "matching-stops", id: mockStop.id },
      { hover: true },
    );

    expect(spectator.component.map!.setFeatureState).toHaveBeenCalledWith(
      { source: "matching-stop-lines", id: mockStop.id },
      { hover: true },
    );

    expect(spectator.component.mapCursor).toEqual("pointer");
  });

  it("should not set hover state if highlight is false", () => {
    spectator.component.matchingStops = mockPointFeatureCollection;
    spectator.component.matchingStopLines = mockLineStringFeatureCollection;
    spectator.component.mapSetHover(mockStop);

    expect(spectator.component.map!.setFeatureState).not.toHaveBeenCalledWith(
      { source: "matching-stops", id: mockStop.id },
      { hover: true },
    );

    expect(spectator.component.map!.setFeatureState).not.toHaveBeenCalledWith(
      { source: "matching-stop-lines", id: mockStop.id },
      { hover: true },
    );

    expect(spectator.component.mapCursor).toEqual("default");
  });

  it("should clear hover state", () => {
    const mockMap = {
      getFeatureState: (
        _feature: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature,
      ): any => {
        return undefined;
      },
      removeFeatureState: (
        _target: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature,
        _key?: string,
      ) => {
        return undefined;
      },
    } as Map;
    spyOn(mockMap, "getFeatureState").and.returnValue({ hover: true });
    spyOn(mockMap, "removeFeatureState");

    spectator.component.matchingStops = mockPointFeatureCollection;
    spectator.component.matchingStopLines = mockLineStringFeatureCollection;
    spectator.component.hoveredStop = mockStop;
    spectator.component.map = mockMap;
    spectator.component.mapClearHover();

    expect(spectator.component.map.removeFeatureState).toHaveBeenCalledWith(
      { source: "matching-stops", id: mockStop.id },
      "hover",
    );

    expect(spectator.component.map.removeFeatureState).toHaveBeenCalledWith(
      { source: "matching-stop-lines", id: mockStop.id },
      "hover",
    );

    expect(spectator.component.mapCursor).toBeUndefined();

    expect(spectator.component.hoveredStop).toBeUndefined();
  });
});
