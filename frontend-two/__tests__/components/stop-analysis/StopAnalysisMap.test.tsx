import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FeatureCollection } from "geojson";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StopAnalysisMap } from "@/components/stop-analysis/StopAnalysisMap";

const mocks = vi.hoisted(() => ({
  registerTimingPointIcons: vi.fn(async () => undefined),
}));

vi.mock("@/components/stop-analysis/timingPointIcons", () => ({
  registerTimingPointIcons: mocks.registerTimingPointIcons,
}));

const mapboxMock = vi.hoisted(() => {
  const popupInstances: MockPopup[] = [];

  const methods = {
    addControl: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    easeTo: vi.fn(),
    fitBounds: vi.fn(),
    flyTo: vi.fn(),
    getBounds: vi.fn(() => ({
      getSouth: () => 0,
      getNorth: () => 1,
      getWest: () => 2,
      getEast: () => 3,
    })),
    getCanvas: vi.fn(() => ({ style: {} })),
    getSource: vi.fn(() => undefined),
    getZoom: vi.fn(() => 12),
    isStyleLoaded: vi.fn(() => true),
    on: vi.fn(),
    remove: vi.fn(),
    setFeatureState: vi.fn(),
    setStyle: vi.fn(),
  };

  class MockMap {
    addControl = methods.addControl;
    addLayer = methods.addLayer;
    addSource = methods.addSource;
    easeTo = methods.easeTo;
    fitBounds = methods.fitBounds;
    flyTo = methods.flyTo;
    getBounds = methods.getBounds;
    getCanvas = methods.getCanvas;
    getSource = methods.getSource;
    getZoom = methods.getZoom;
    isStyleLoaded = methods.isStyleLoaded;
    on = methods.on;
    remove = methods.remove;
    setFeatureState = methods.setFeatureState;
    setStyle = methods.setStyle;

    constructor() {
      return this;
    }
  }

  class MockPopup {
    remove = vi.fn(() => this);
    setLngLat = vi.fn(() => this);
    setHTML = vi.fn(() => this);
    setDOMContent = vi.fn((_content: HTMLElement) => {
      popupInstances.push(this);
      return this;
    });
    addTo = vi.fn(() => this);
  }

  return { methods, MockMap, MockPopup, popupInstances };
});

vi.mock("@turf/bbox-clip", () => ({
  default: vi.fn((feature) => feature),
}));

vi.mock("@turf/point-on-feature", () => ({
  default: vi.fn(() => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: [0.5, 0.5],
    },
  })),
}));

vi.mock("mapbox-gl", () => ({
  default: {
    Map: mapboxMock.MockMap,
    NavigationControl: class {},
    GeolocateControl: class {},
    Popup: mapboxMock.MockPopup,
    accessToken: "",
  },
  Map: mapboxMock.MockMap,
  NavigationControl: class {},
  GeolocateControl: class {},
  Popup: mapboxMock.MockPopup,
}));

const emptyFeatureCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

describe("StopAnalysisMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.registerTimingPointIcons.mockClear();
    mapboxMock.popupInstances.length = 0;
  });

  it("opens the display options dropdown and switches the map view", async () => {
    const user = userEvent.setup();

    render(
      <StopAnalysisMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        mapboxSatelliteStyle="mapbox://styles/test/satellite"
        stops={[]}
        adminAreaShapes={emptyFeatureCollection}
        boundingBoxTooBig={false}
        onBoundsChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Display options" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("radio", { name: "Default" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Satellite" })).not.toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Satellite" }));

    expect(mapboxMock.methods.setStyle).toHaveBeenCalledWith(
      "mapbox://styles/test/satellite",
    );
    expect(screen.getByRole("radio", { name: "Satellite" })).toBeChecked();
  });

  it("registers timing point icons when the map loads", async () => {
    render(
      <StopAnalysisMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        stops={[]}
        adminAreaShapes={emptyFeatureCollection}
        boundingBoxTooBig={false}
        onBoundsChange={vi.fn()}
      />,
    );

    const loadHandler = mapboxMock.methods.on.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as (() => void) | undefined;

    await act(async () => {
      loadHandler?.();
    });

    expect(mocks.registerTimingPointIcons).toHaveBeenCalledTimes(1);
  });

  it("adds separate timing and non-timing stop layers when the map loads", async () => {
    render(
      <StopAnalysisMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        stops={[]}
        adminAreaShapes={emptyFeatureCollection}
        boundingBoxTooBig={false}
        onBoundsChange={vi.fn()}
      />,
    );

    const loadHandler = mapboxMock.methods.on.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as (() => void) | undefined;

    await act(async () => {
      loadHandler?.();
    });

    expect(mapboxMock.methods.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "other-stops",
        type: "circle",
        source: "stops",
      }),
    );
    expect(mapboxMock.methods.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "timing-stops",
        type: "symbol",
        source: "stops",
      }),
    );
  });

  it("shows a loading overlay while stop analysis data is being fetched", () => {
    render(
      <StopAnalysisMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        loading
        stops={[]}
        adminAreaShapes={emptyFeatureCollection}
        boundingBoxTooBig={false}
        onBoundsChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("status", { name: /loading stop analysis map/i }),
    ).toBeInTheDocument();
  });

  it("shows admin area hover details in a popup", async () => {
    mapboxMock.methods.getZoom.mockReturnValue(10);

    render(
      <StopAnalysisMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        stops={[]}
        adminAreaShapes={{
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: "AA001",
              properties: {
                id: "AA001",
                name: "Bedford",
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                  ],
                ],
              },
            },
          ],
        }}
        boundingBoxTooBig={false}
        onBoundsChange={vi.fn()}
      />,
    );

    const loadHandler = mapboxMock.methods.on.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as (() => void) | undefined;

    await act(async () => {
      loadHandler?.();
    });

    const moveHandler = mapboxMock.methods.on.mock.calls.find(
      ([event, layer]) =>
        event === "mousemove" && layer === "admin-area-boundaries",
    )?.[2] as
      | ((event: {
          features?: Array<{
            id?: string | number;
            properties?: { id?: string; name?: string };
            geometry?: { type: string; coordinates: number[][][] };
          }>;
        }) => void)
      | undefined;

    expect(moveHandler).toBeDefined();

    moveHandler?.({
      features: [
        {
          id: "AA001",
          properties: {
            id: "AA001",
            name: "Bedford",
          },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0],
              ],
            ],
          },
        },
      ],
    });

    expect(mapboxMock.popupInstances).toHaveLength(1);
    expect(mapboxMock.popupInstances[0].setDOMContent).toHaveBeenCalledTimes(1);
    const popupContent = mapboxMock.popupInstances[0].setDOMContent.mock
      .calls[0]?.[0] as HTMLElement;
    expect(popupContent.textContent).toContain("Bedford");
    expect(popupContent.textContent).toContain("AA001");
  });

  it("zooms immediately when an admin area is clicked", async () => {
    const onAdminAreaClick = vi.fn();

    render(
      <StopAnalysisMap
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        stops={[]}
        adminAreaShapes={{
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: "AA001",
              properties: {
                id: "AA001",
                name: "Bedford",
              },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0],
                  ],
                ],
              },
            },
          ],
        }}
        boundingBoxTooBig={false}
        onBoundsChange={vi.fn()}
        onAdminAreaClick={onAdminAreaClick}
      />,
    );

    const loadHandler = mapboxMock.methods.on.mock.calls.find(
      ([event]) => event === "load",
    )?.[1] as (() => void) | undefined;

    await act(async () => {
      loadHandler?.();
    });

    mapboxMock.methods.fitBounds.mockClear();

    const clickHandler = mapboxMock.methods.on.mock.calls.find(
      ([event, layer]) =>
        event === "click" && layer === "admin-area-boundaries",
    )?.[2] as
      | ((event: {
          features?: Array<{
            id?: string | number;
            properties?: { id?: string; name?: string };
            geometry?: { type: string; coordinates: number[][][] };
          }>;
        }) => void)
      | undefined;

    expect(clickHandler).toBeDefined();

    await act(async () => {
      clickHandler?.({
        features: [
          {
            id: "AA001",
            properties: {
              id: "AA001",
              name: "Bedford",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 1],
                  [0, 0],
                ],
              ],
            },
          },
        ],
      });
    });

    expect(onAdminAreaClick).toHaveBeenCalledWith("AA001");
  });
});
