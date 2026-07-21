import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { RouteType, ServiceLinkType, StopType } from "@/src/generated/graphql";
import { onTimeService } from "@/services/on-time/on-time.service";
import { transitModelService } from "@/services/on-time/transit-model.service";
import { ON_TIME_SERVICE_MAP_IDS } from "@/utils/map-constants";
import { setCoordinates } from "@/utils/on-time/on-time-service-map";
import { OnTimeServiceMap } from "@/components/on-time/OnTimeServiceMap";

const mocks = vi.hoisted(() => ({
  registerTimingPointIcons: vi.fn(async () => undefined),
}));

vi.mock("@/components/icons/timingPointIcons", () => ({
  registerTimingPointIcons: mocks.registerTimingPointIcons,
}));

const mapboxMock = vi.hoisted(() => {
  const methods = {
    addControl: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    fitBounds: vi.fn(),
    getCanvas: vi.fn(() => ({ style: {} })),
    getLayer: vi.fn(() => undefined),
    getSource: vi.fn(() => undefined),
    isStyleLoaded: vi.fn(() => true),
    on: vi.fn(),
    remove: vi.fn(),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
    setStyle: vi.fn(),
  };

  class MockMap {
    addControl = methods.addControl;
    addLayer = methods.addLayer;
    addSource = methods.addSource;
    fitBounds = methods.fitBounds;
    getCanvas = methods.getCanvas;
    getLayer = methods.getLayer;
    getSource = methods.getSource;
    isStyleLoaded = methods.isStyleLoaded;
    on = methods.on;
    remove = methods.remove;
    setLayoutProperty = methods.setLayoutProperty;
    setPaintProperty = methods.setPaintProperty;
    setStyle = methods.setStyle;

    constructor() {
      return this;
    }
  }

  return { methods, MockMap };
});

vi.mock("mapbox-gl", () => ({
  default: {
    Map: mapboxMock.MockMap,
    NavigationControl: class {},
    Popup: class {
      remove = vi.fn(() => this);
      setLngLat = vi.fn(() => this);
      setHTML = vi.fn(() => this);
      setDOMContent = vi.fn(() => this);
      addTo = vi.fn(() => this);
    },
    accessToken: "",
  },
  Map: mapboxMock.MockMap,
  NavigationControl: class {},
  Popup: class {
    remove = vi.fn(() => this);
    setLngLat = vi.fn(() => this);
    setHTML = vi.fn(() => this);
    setDOMContent = vi.fn(() => this);
    addTo = vi.fn(() => this);
  },
}));

const stops: StopType[] = [
  { stopId: "ST0000001", stopName: "Mansfield", lat: 53.1472, lon: 1.1987 },
  {
    stopId: "ST0000002",
    stopName: "Sheffield",
    lat: 53.383331,
    lon: -1.466667,
  },
];

const serviceLinks: ServiceLinkType[] = [
  {
    fromStop: "ST0000001",
    toStop: "ST0000002",
    distance: 100,
    routeValidity: RouteType.Valid,
    linkRoute: "[[1.1987, 53.1472],[-1.466667, 53.383331],[-1.2, 53.4231]]",
  },
  {
    fromStop: "ST0000002",
    toStop: "ST0000001",
    distance: 100,
    routeValidity: RouteType.InvalidNoRoutePoints,
    linkRoute: "[[-1.466667, 53.383331],[1.1987, 53.1472]]",
  },
];

const servicePatterns = [
  {
    servicePatternId: "SVC0000000001",
    serviceLinks: [serviceLinks[0]],
    stops,
  },
  {
    servicePatternId: "SVC0000000002",
    serviceLinks: [serviceLinks[1]],
    stops: stops.slice().reverse(),
  },
] as any[];

const stopPerformance = [
  {
    stopId: "ST0000001",
    onTime: 9,
    early: 0,
    late: 1,
    total: 10,
    onTimeRatio: 0.9,
    earlyRatio: 0,
    lateRatio: 0.1,
    completedRatio: 1,
    actualDepartures: 10,
    averageDelay: 0,
    timingPoint: false,
  },
  {
    stopId: "ST0000002",
    onTime: 6,
    early: 1,
    late: 3,
    total: 10,
    onTimeRatio: 0.6,
    earlyRatio: 0.1,
    lateRatio: 0.3,
    completedRatio: 1,
    actualDepartures: 10,
    averageDelay: 20,
    timingPoint: true,
  },
] as any[];

describe("OnTimeServiceMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(onTimeService, "fetchStopPerformanceList").mockResolvedValue(
      stopPerformance as any,
    );
    vi.spyOn(transitModelService, "fetchServicePatternStops").mockResolvedValue(
      servicePatterns as any,
    );
  });

  it("should create", async () => {
    const { container } = render(
      <OnTimeServiceMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        params={null}
      />,
    );

    expect(container).toBeTruthy();
  });

  it("should generate service patterns feature", async () => {
    const fromTimestamp = "2021-07-01T00:00:00Z";
    const toTimestamp = "2021-07-31T23:59:59.999Z";

    render(
      <OnTimeServiceMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        params={{
          fromTimestamp,
          toTimestamp,
          filters: {
            operatorIds: ["OP152"],
            lineIds: ["LN12345"],
            adminAreaIds: ["AA050"],
          },
        }}
      />,
    );

    const loadHandler = mapboxMock.methods.on.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as (() => void) | undefined;

    await act(async () => {
      loadHandler?.();
    });

    await waitFor(() => {
      expect(transitModelService.fetchServicePatternStops).toHaveBeenCalledWith(
        "OP152",
        "LN12345",
      );
    });

    expect(onTimeService.fetchStopPerformanceList).toHaveBeenCalledWith({
      fromTimestamp,
      toTimestamp,
      filters: {
        operatorIds: ["OP152"],
        lineIds: ["LN12345"],
      },
    });

    const patternSourceCall = mapboxMock.methods.addSource.mock.calls.find(
      ([id]) => id === ON_TIME_SERVICE_MAP_IDS.patternSource,
    );
    const stopSourceCall = mapboxMock.methods.addSource.mock.calls.find(
      ([id]) => id === ON_TIME_SERVICE_MAP_IDS.stopSource,
    );

    expect(patternSourceCall).toBeDefined();
    expect(stopSourceCall).toBeDefined();

    const patternData = patternSourceCall?.[1]
      ?.data as FeatureCollection<LineString>;
    const stopData = stopSourceCall?.[1]?.data as FeatureCollection<Point>;

    expect(patternData.type).toBe("FeatureCollection");
    expect(patternData.features).toHaveLength(2);
    expect(patternData.features[0].geometry.coordinates).toEqual([
      [1.1987, 53.1472],
      [-1.466667, 53.383331],
      [-1.2, 53.4231],
    ]);
    expect(patternData.features[1].geometry.coordinates).toEqual([
      [-1.466667, 53.383331],
      [1.1987, 53.1472],
    ]);

    expect(stopData.type).toBe("FeatureCollection");
    expect(stopData.features).toHaveLength(2);
    expect(stopData.features[0].geometry.coordinates).toEqual([
      1.1987, 53.1472,
    ]);
    expect(stopData.features[0].properties?.naptan).toBe("ST0000001");
    expect(stopData.features[0].properties?.stopName).toBe("Mansfield");
    expect(stopData.features[1].geometry.coordinates).toEqual([
      -1.466667, 53.383331,
    ]);
    expect(stopData.features[1].properties?.naptan).toBe("ST0000002");
    expect(stopData.features[1].properties?.stopName).toBe("Sheffield");
  });

  it("setCoordinates() should set coordinates using service link data", async () => {
    const features: Feature<LineString>[] = [];
    const result = setCoordinates([stops[0], stops[1]], serviceLinks, features);

    await expect(result).toEqual([
      [1.1987, 53.1472],
      [-1.466667, 53.383331],
      [-1.2, 53.4231],
    ]);
  });

  it("setCoordinates() should return undefined when serviceLink is not available and feature is already present", async () => {
    const features: Feature<LineString>[] = [
      {
        type: "Feature",
        geometry: { coordinates: [], type: "LineString" },
        properties: {
          dashedLine: true,
          segmentId: "ST0000001ST0000002",
          servicePatternId: "",
        },
      },
    ];
    const result = setCoordinates([stops[0], stops[1]], [], features);

    await expect(result).toEqual(undefined);
  });
});
