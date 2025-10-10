import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { Data } from "@angular/router";
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
import { MapComponent } from "ngx-mapbox-gl";
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
  template: `<ng-content></ng-content>`,
  providers: [
    { provide: MapComponent, useExisting: forwardRef(() => StubMapComponent) },
  ],
  standalone: false,
})
export class StubMapComponent implements OnInit {
  @Output() moveEnd = new EventEmitter<void>();
  @Output() moveStart = new EventEmitter<void>();
  @Input() bounds?: LngLatBounds;
  @Input() cursorStyle?: string;
  @Input() style?: string;
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

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "mgl-control",
  template: `<ng-content></ng-content>`,
  standalone: false,
})
export class StubControlComponent {
  @Input() position?: string;
  @Input() mglNavigation?: boolean;
  @Input() mglGeolocate?: boolean;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "mgl-geojson-source",
  template: ``,
  standalone: false,
})
export class StubGeojsonSourceComponent {
  @Input() id?: string;
  @Input() data?: Data;
  @Input() cluster?: boolean;
  @Input() clusterMinPoints?: number;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "mgl-layer",
  template: ``,
  standalone: false,
})
export class StubLayerComponent {
  @Input() id?: string;
  @Input() type?: string;
  @Input() paint?: string;
  @Input() layout?: string;
  @Input() source?: string;
  @Input() before?: string;
  @Input() filter?: string;
  @Output() layerMouseMove = new EventEmitter<unknown>();
  @Output() layerMouseLeave = new EventEmitter<unknown>();
  @Output() layerClick = new EventEmitter<unknown>();
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "mgl-popup",
  template: `<ng-content></ng-content>`,
  standalone: false,
})
export class StubPopupComponent {
  @Input() feature?: string;
  @Input() closeButton?: boolean;
  @Input() closeOnClick?: boolean;
  @Input() maxWidth?: string;
  @Input() offset?: number;
  @Input() className?: string;
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
    imports: [SharedModule, GdsModule, NgxSmartModalModule],
    declarations: [
      StubMapComponent,
      StubControlComponent,
      StubGeojsonSourceComponent,
      StubLayerComponent,
      StubPopupComponent,
    ],
    mocks: [CorridorsService, ConfigService],
    detectChanges: true,
  });

  beforeEach(() => {
    spectator = createComponent();
    corridorsService = spectator.inject(CorridorsService);
    spectator.detectChanges();
    corridorsService.queryStops.and.returnValue(EMPTY);
  });

  it("should create", async () => {
    await expect(spectator.component).toBeTruthy();
  });

  it("should emit location when map moves", () => {
    const stubMapComponent = spectator.query(StubMapComponent);
    spectator.component.map = stubMapComponent!.mapInstance;
    spyOn(spectator.component.boundsChanged, "emit");

    // Simulate map move event
    stubMapComponent?.move([-1.47, 53.37], [-1.46, 53.39]);

    expect(spectator.component.boundsChanged.emit).toHaveBeenCalledWith(
      new LngLatBounds([-1.47, 53.37], [-1.46, 53.39]),
    );
  });

  describe("nonOrgStopLayerBeforeId", () => {
    it("should return other-stop-markers if otherStops exists", async () => {
      spectator.component.otherStops = mockPointFeatureCollection;

      await expect(spectator.component.nonOrgStopLayerBeforeId).toEqual(
        "other-stop-markers",
      );
    });

    it("should return corridor-markers if otherStops is undefined and corridorStops exists", async () => {
      spectator.component.otherStops = undefined;
      spectator.component.corridorStops = mockPointFeatureCollection;

      await expect(spectator.component.nonOrgStopLayerBeforeId).toEqual(
        "corridor-markers",
      );
    });

    it("should return matching-stop-markers if otherStops and corridorStops are undefined and matchingStops exists", async () => {
      spectator.component.otherStops = undefined;
      spectator.component.corridorStops = undefined;
      spectator.component.matchingStops = mockPointFeatureCollection;

      await expect(spectator.component.nonOrgStopLayerBeforeId).toEqual(
        "matching-stop-markers",
      );
    });

    it("should return undefinded if all layers are undefined", async () => {
      spectator.component.otherStops = undefined;
      spectator.component.corridorStops = undefined;
      spectator.component.matchingStops = undefined;

      await expect(spectator.component.nonOrgStopLayerBeforeId).toBeUndefined();
    });
  });

  it("should set hover state", async () => {
    const stubMapComponent = spectator.query(StubMapComponent);
    spectator.component.map = stubMapComponent!.mapInstance;

    spectator.component.matchingStops = mockPointFeatureCollection;
    spectator.component.matchingStopLines = mockLineStringFeatureCollection;
    spectator.component.mapSetHover(mockStop, true);

    expect(spectator.component.map.setFeatureState).toHaveBeenCalledWith(
      { source: "matching-stops", id: mockStop.id },
      { hover: true },
    );

    expect(spectator.component.map.setFeatureState).toHaveBeenCalledWith(
      { source: "matching-stop-lines", id: mockStop.id },
      { hover: true },
    );

    await expect(spectator.component.mapCursor).toEqual("pointer");
  });

  it("should not set hover state if highlight is false", async () => {
    const stubMapComponent = spectator.query(StubMapComponent);
    spectator.component.map = stubMapComponent!.mapInstance;

    spectator.component.matchingStops = mockPointFeatureCollection;
    spectator.component.matchingStopLines = mockLineStringFeatureCollection;
    spectator.component.mapSetHover(mockStop);

    expect(spectator.component.map.setFeatureState).not.toHaveBeenCalledWith(
      { source: "matching-stops", id: mockStop.id },
      { hover: true },
    );

    expect(spectator.component.map.setFeatureState).not.toHaveBeenCalledWith(
      { source: "matching-stop-lines", id: mockStop.id },
      { hover: true },
    );

    await expect(spectator.component.mapCursor).toEqual("default");
  });

  it("should clear hover state", async () => {
    const mockMap = {
      getFeatureState: (
        _feature: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature,
      ): unknown => {
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

    await expect(spectator.component.mapCursor).toBeUndefined();

    await expect(spectator.component.hoveredStop).toBeUndefined();
  });
});
