import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CorridorCreateMap } from "@/components/corridors/create/CorridorCreateMap";
import type { CorridorStop } from "@/types/corridors";
import type mapboxgl from "mapbox-gl";

const mapboxMock = vi.hoisted(() => {
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  const images = new Set<string>();
  const methods = {
    addControl: vi.fn((control?: { onAdd?: () => HTMLElement }) => {
      const controlElement = control?.onAdd?.();
      if (controlElement) {
        document.body.appendChild(controlElement);
      }
    }),
    addImage: vi.fn((name: string) => {
      images.add(name);
    }),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    fitBounds: vi.fn(),
    getBounds: vi.fn(() => ({
      getSouth: () => 0,
      getNorth: () => 1,
      getWest: () => 0,
      getEast: () => 0.1,
    })),
    getCanvas: vi.fn(() => ({ style: {} })),
    getLayer: vi.fn(() => undefined),
    getSource: vi.fn(() => undefined),
    hasImage: vi.fn((name: string) => images.has(name)),
    isStyleLoaded: vi.fn(() => true),
    on: vi.fn(),
    loadImage: vi.fn(
      (
        url: string,
        callback: (error: Error | null, image?: unknown) => void,
      ) => {
        callback(null, {
          width: 16,
          height: 16,
          data: new Uint8Array(16 * 16 * 4),
        });
      },
    ),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    setFeatureState: vi.fn(),
    setPaintProperty: vi.fn(),
    setStyle: vi.fn(() => {
      images.clear();
      handlers["style.load"]?.forEach((handler) => handler());
    }),
  };

  class MockMap {
    addControl = methods.addControl;
    addImage = methods.addImage;
    addLayer = methods.addLayer;
    addSource = methods.addSource;
    fitBounds = methods.fitBounds;
    getBounds = methods.getBounds;
    getCanvas = methods.getCanvas;
    getLayer = methods.getLayer;
    getSource = methods.getSource;
    hasImage = methods.hasImage;
    isStyleLoaded = methods.isStyleLoaded;
    on = vi.fn(
      (event: string, layerOrHandler: unknown, maybeHandler?: unknown) => {
        const handler =
          typeof layerOrHandler === "function" ? layerOrHandler : maybeHandler;
        if (typeof handler !== "function") {
          return;
        }

        handlers[event] = handlers[event] ?? [];
        handlers[event].push(handler as (...args: unknown[]) => void);
        methods.on(event, handler);

        if (event === "load") {
          handler();
        }
      },
    );
    loadImage = methods.loadImage;
    remove = methods.remove;
    removeLayer = methods.removeLayer;
    removeSource = methods.removeSource;
    setFeatureState = methods.setFeatureState;
    setPaintProperty = methods.setPaintProperty;
    setStyle = methods.setStyle;

    constructor() {
      return this;
    }
  }

  class MockLngLatBounds {
    extend = vi.fn(() => this);
  }

  const fire = (event: string, ...args: unknown[]) => {
    handlers[event]?.forEach((handler) => handler(...args));
  };

  const resetHandlers = () => {
    for (const key of Object.keys(handlers)) {
      delete handlers[key];
    }
  };

  return { methods, MockMap, MockLngLatBounds, fire, resetHandlers };
});

vi.mock("mapbox-gl", () => ({
  default: {
    Map: mapboxMock.MockMap,
    LngLatBounds: mapboxMock.MockLngLatBounds,
    NavigationControl: class {},
    GeolocateControl: class {},
    Popup: class {
      remove = vi.fn();
      setLngLat = vi.fn(() => this);
      setHTML = vi.fn(() => this);
      addTo = vi.fn(() => this);
    },
    accessToken: "",
  },
  Map: mapboxMock.MockMap,
  LngLatBounds: mapboxMock.MockLngLatBounds,
  NavigationControl: class {},
  GeolocateControl: class {},
}));

const corridorStops: CorridorStop[] = [
  {
    stopId: "a",
    stopName: "Stop A",
    naptan: "ATCO:A",
    localityName: "Town A",
    adminAreaId: "1",
    sourceId: "ATCO:A",
    lon: -1,
    lat: 53,
    intId: 1,
  },
  {
    stopId: "b",
    stopName: "Stop B",
    naptan: "ATCO:B",
    localityName: "Town B",
    adminAreaId: "1",
    sourceId: "ATCO:B",
    lon: -1.1,
    lat: 53.1,
    intId: 2,
  },
];

describe("CorridorCreateMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapboxMock.resetHandlers();
    document
      .querySelectorAll(".mapboxgl-ctrl")
      .forEach((node) => node.remove());
  });

  it("shows the shared display options and switches map style", async () => {
    const user = userEvent.setup();

    render(
      <CorridorCreateMap
        corridorStops={corridorStops}
        matchingStops={corridorStops}
        otherStops={corridorStops}
        nonOrgStops={corridorStops}
        onSelectStop={vi.fn()}
        onBoundsChange={vi.fn()}
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        mapboxSatelliteStyle="mapbox://styles/test/satellite"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Display options" });
    expect(trigger).toBeInTheDocument();

    await waitFor(() => {
      expect(mapboxMock.methods.loadImage).toHaveBeenCalledWith(
        "/assets/icons/map-chevron.svg",
        expect.any(Function),
      );
      expect(mapboxMock.methods.addImage).toHaveBeenCalledWith(
        "map-chevron-large",
        expect.objectContaining({ width: 16, height: 16 }),
      );
      expect(mapboxMock.methods.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "corridor-chevrons",
          type: "symbol",
          layout: expect.objectContaining({
            "icon-image": "map-chevron-large",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "symbol-placement": "line",
            "symbol-spacing": 150,
          }),
        }),
        "corridor-markers",
      );
    });

    expect(mapboxMock.methods.addSource).toHaveBeenCalledWith(
      "matching-stops",
      expect.objectContaining({
        cluster: true,
        clusterMinPoints: 30,
      }),
    );
    expect(mapboxMock.methods.addSource).toHaveBeenCalledWith(
      "matching-stop-lines",
      expect.anything(),
    );

    const matchingLayer = mapboxMock.methods.addLayer.mock.calls.find(
      ([layer]) => layer.id === "matching-stop-markers",
    )?.[0];
    expect(matchingLayer).toMatchObject({
      id: "matching-stop-markers",
      paint: expect.objectContaining({
        "circle-color": "#ffffff",
      }),
    });

    expect(mapboxMock.methods.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "matching-stop-clusters",
        filter: ["has", "point_count"],
      }),
    );

    const otherLayer = mapboxMock.methods.addLayer.mock.calls.find(
      ([layer]) => layer.id === "other-stop-markers",
    )?.[0];
    expect(otherLayer).toMatchObject({
      id: "other-stop-markers",
      paint: expect.objectContaining({
        "circle-color": "#28A197",
      }),
    });

    const nonOrgLayer = mapboxMock.methods.addLayer.mock.calls.find(
      ([layer]) => layer.id === "non-org-stop-markers",
    )?.[0];
    expect(nonOrgLayer).toMatchObject({
      id: "non-org-stop-markers",
      paint: expect.objectContaining({
        "circle-color": "#B1B4B6",
      }),
    });

    expect(mapboxMock.methods.on).toHaveBeenCalledWith(
      "moveend",
      expect.any(Function),
    );

    expect(mapboxMock.methods.on).toHaveBeenCalledWith(
      "style.load",
      expect.any(Function),
    );

    await user.click(trigger);
    expect(screen.getByRole("radio", { name: "Default" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Satellite" }));

    expect(mapboxMock.methods.setStyle).toHaveBeenCalledWith(
      "mapbox://styles/test/satellite",
    );
  });

  it("fits the map to the selected location before a stop is added", () => {
    const locationBounds = {} as mapboxgl.LngLatBounds;

    render(
      <CorridorCreateMap
        corridorStops={[]}
        matchingStops={[]}
        locationBounds={locationBounds}
        onSelectStop={vi.fn()}
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
      />,
    );

    expect(mapboxMock.methods.fitBounds).toHaveBeenCalledWith(locationBounds, {
      padding: 60,
      maxZoom: 14,
    });
  });

  it("fits the map to matching stops during stop-name search", () => {
    render(
      <CorridorCreateMap
        corridorStops={[]}
        matchingStops={corridorStops}
        onSelectStop={vi.fn()}
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
      />,
    );

    expect(mapboxMock.methods.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      {
        padding: 50,
        maxZoom: 16,
        duration: 500,
      },
    );
  });

  it("shows Re-centre after the user moves the map", async () => {
    render(
      <CorridorCreateMap
        corridorStops={[]}
        matchingStops={[]}
        locationBounds={{} as mapboxgl.LngLatBounds}
        showRecentre
        onSelectStop={vi.fn()}
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Re-centre" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      mapboxMock.fire("moveend");
      mapboxMock.fire("moveend");
    });

    expect(
      screen.getByRole("button", { name: "Re-centre" }),
    ).toBeInTheDocument();
  });
});
