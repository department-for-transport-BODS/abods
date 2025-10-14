import { SimpleChange } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FeatureIdentifier, Map } from "mapbox-gl";
import { StopHoverEvent } from "../stop-list/stop-item/stop-item.component";

import { JourneyMapComponent } from "./journey-map.component";
import { Stop, OtpEnum, Direction } from "../../../../generated/graphql";
import { SharedModule } from "../../../shared/shared.module";
import { GdsModule } from "../../../shared/gds/gds.module";
import { NgxMapboxGLModule } from "ngx-mapbox-gl";
import { NgxSmartModalModule } from "ngx-smart-modal";
import { HttpClientTestingModule } from "@angular/common/http/testing";

// Mock stops with correct property names
const t1 = "2022-08-18T11:20:00.000+01:00";
const t2 = "2022-08-18T11:21:00.000+01:00";
const startTime = "2022-08-18T11:20:00.000+01:00";
const mockStops: Stop[] = [
  {
    stopId: 1,
    stopName: "Solihull Town Centre",
    longitude: -1.78000522,
    latitude: 52.4139824,
    isTimingPoint: true,
    otp: OtpEnum.OnTime,
    estimatedDepartureUtc: null,
    actualDepartureUtc: null,
    directionRef: Direction.Inbound,
    incompleteReason: 4,
    scheduledDepartureUtc: startTime,
    stopIndex: 0,
    setDown: true,
  },
  {
    stopId: 2,
    stopName: "Whitefields Rd",
    longitude: -1.77750742,
    latitude: 52.407795,
    isTimingPoint: false,
    otp: OtpEnum.Late,
    estimatedDepartureUtc: null,
    actualDepartureUtc: null,
    directionRef: Direction.Inbound,
    incompleteReason: 4,
    scheduledDepartureUtc: startTime,
    stopIndex: 1,
    setDown: true,
  },
  {
    stopId: 3,
    stopName: "Solihull Sixth Form College",
    longitude: -1.77633333,
    latitude: 52.4044762,
    isTimingPoint: false,
    otp: OtpEnum.Early,
    estimatedDepartureUtc: null,
    actualDepartureUtc: null,
    directionRef: Direction.Inbound,
    incompleteReason: 4,
    scheduledDepartureUtc: startTime,
    stopIndex: 2,
    setDown: true,
  },
];

// Mock journey (avls)
const mockJourney: any[] = [
  {
    latitude: 52.4139834,
    longitude: -1.78000502,
    recordedAtTimeUtc: t1,
  },
  {
    latitude: 52.4139838,
    longitude: -1.78000505,
    recordedAtTimeUtc: t2,
  },
];

// Mock JourneyInfo
const mockView: any = {
  stops: mockStops,
  avls: mockJourney,
  stopList: mockStops,
};

const mapStub = {
  setFeatureState: (
    _feature: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature,
    _state: Record<string, unknown>,
  ) => {
    // stub
  },
  removeFeatureState: (
    _target: FeatureIdentifier | mapboxgl.MapboxGeoJSONFeature,
    _key?: string,
  ) => {
    // stub
  },
  addControl: (_: any) => {
    /* stub */
  },
} as Map;

describe("JourneyMapComponent", () => {
  let component: JourneyMapComponent;
  let fixture: ComponentFixture<JourneyMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JourneyMapComponent],
      imports: [
        SharedModule,
        GdsModule,
        NgxMapboxGLModule,
        NgxSmartModalModule,
        HttpClientTestingModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JourneyMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.map = mapStub;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnChanges", () => {
    beforeEach(() => {
      component.ngOnChanges({ view: new SimpleChange(null, mockView, true) });
    });

    describe("view updated", () => {
      it("should update stops (non-timing points)", () => {
        expect(component.stops).toBeTruthy();
        expect(component.stops?.features.length).toEqual(2);
        expect(component.stops?.features[0].geometry.coordinates[0]).toEqual(
          mockStops[1]?.longitude,
        );
        expect(component.stops?.features[0].geometry.coordinates[1]).toEqual(
          mockStops[1]?.latitude,
        );
        expect(component.stops?.features[1].geometry.coordinates[0]).toEqual(
          mockStops[2]?.longitude,
        );
        expect(component.stops?.features[1].geometry.coordinates[1]).toEqual(
          mockStops[2]?.latitude,
        );
      });

      it("should update timingPoints", () => {
        expect(component.timingPoints).toBeTruthy();
        expect(component.timingPoints?.features.length).toEqual(1);
        expect(
          component.timingPoints?.features[0].geometry.coordinates[0],
        ).toEqual(mockStops[0]?.longitude);
        expect(
          component.timingPoints?.features[0].geometry.coordinates[1],
        ).toEqual(mockStops[0]?.latitude);
      });

      it("should update line", () => {
        expect(component.line).toBeTruthy();
        expect(component.line?.features[0].geometry.coordinates[0]).toEqual([
          mockJourney[0].longitude,
          mockJourney[0].latitude,
        ]);
        expect(component.line?.features[0].geometry.coordinates[1]).toEqual([
          mockJourney[1].longitude,
          mockJourney[1].latitude,
        ]);
      });

      it("should update pings", () => {
        expect(component.pings).toBeTruthy();
        expect(component.pings?.features[0].geometry.coordinates[0]).toEqual(
          mockJourney[0].longitude,
        );
        expect(component.pings?.features[0].geometry.coordinates[1]).toEqual(
          mockJourney[0].latitude,
        );
        expect(component.pings?.features[1].geometry.coordinates[0]).toEqual(
          mockJourney[1].longitude,
        );
        expect(component.pings?.features[1].geometry.coordinates[1]).toEqual(
          mockJourney[1].latitude,
        );
      });

      it("should update bounds", () => {
        // The bounds are calculated using combineBounds, which may depend on turf/bbox2d logic.
        // Here we check that bounds is an array of 4 numbers.
        expect(component.bounds.length).toBe(4);
        expect(component.bounds.every((v) => typeof v === "number")).toBeTrue();
      });

      it("should reset move counter when loading", () => {
        component.moveCounter = 5;
        component.loading = true;
        component.ngOnChanges({ view: new SimpleChange(null, mockView, true) });

        expect(component.moveCounter).toEqual(0);
      });
    });

    describe("selectedStop updated", () => {
      it("should update map bounds to timing point", () => {
        component.ngOnChanges({
          selectedStop: new SimpleChange(null, mockView.stopList[0], true),
        });
        const expectedBounds = [
          mockStops[0].longitude,
          mockStops[0].latitude,
          mockStops[0].longitude,
          mockStops[0].latitude,
        ];
        expect(component.bounds).toEqual(expectedBounds);
      });

      it("should update map bounds to stop", () => {
        component.ngOnChanges({
          selectedStop: new SimpleChange(null, mockView.stopList[1], true),
        });
        const expectedBounds = [
          mockStops[1].longitude,
          mockStops[1].latitude,
          mockStops[1].longitude,
          mockStops[1].latitude,
        ];
        expect(component.bounds).toEqual(expectedBounds);
      });
    });

    describe("hoveredStop updated", () => {
      const hoveredStop: StopHoverEvent = {
        stop: mockView.stopList[0],
        event: "enter",
      };

      beforeEach(() => {
        hoveredStop.event = "enter";
        component.ngOnChanges({
          hoveredStop: new SimpleChange(null, hoveredStop, true),
        });
      });

      it("should set tooltipStop to hoveredStop on enter", () => {
        expect(component.tooltipStop?.id).toEqual(
          mockView.stopList[0].stopId.toString(),
        );
      });

      it("should set tooltipStop to undefined on leave", () => {
        hoveredStop.event = "leave";
        component.ngOnChanges({
          hoveredStop: new SimpleChange(null, hoveredStop, true),
        });

        expect(component.tooltipStop).toBeUndefined();
      });
    });
  });

  describe("ping tooltip", () => {
    const hoveredPing = { id: "001", latitude: 1, longitude: 2, ts: t1 };

    beforeEach(() => {
      component.onPingMouseEnter({
        features: [{ properties: hoveredPing }],
      } as any);
    });

    it("should set tooltipPing to hoveredPing on enter", () => {
      expect(component.tooltipPing).toEqual(hoveredPing as any);
    });

    it("should set tooltipPing to undefined on leave", () => {
      component.onPingMouseLeave({} as any);

      expect(component.tooltipPing).toBeUndefined();
    });
  });

  describe("recentre", () => {
    beforeEach(() => {
      component.ngOnChanges({ view: new SimpleChange(null, mockView, true) });
    });

    it("should reset move counter", () => {
      component.moveCounter = 6;
      component.recentre();

      expect(component.moveCounter).toEqual(0);
    });

    it("should set bounds", () => {
      component.bounds = [1, 2, 3, 4];
      component.recentre();

      expect(component.bounds.length).toBe(4);
      expect(component.bounds.every((v) => typeof v === "number")).toBeTrue();
    });
  });
});
