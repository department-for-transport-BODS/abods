import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CorridorCreateMap } from "@/components/corridors/create/CorridorCreateMap";
import type { CorridorStop } from "@/types/corridors";

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
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    setFeatureState: vi.fn(),
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
    removeLayer = methods.removeLayer;
    removeSource = methods.removeSource;
    setFeatureState = methods.setFeatureState;
    setStyle = methods.setStyle;

    constructor() {
      return this;
    }
  }

  class MockLngLatBounds {
    extend = vi.fn(() => this);
  }

  return { methods, MockMap, MockLngLatBounds };
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
  });

  it("shows the shared display options and switches map style", async () => {
    const user = userEvent.setup();

    render(
      <CorridorCreateMap
        corridorStops={corridorStops}
        matchingStops={corridorStops}
        onSelectStop={vi.fn()}
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        mapboxSatelliteStyle="mapbox://styles/test/satellite"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Display options" });
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole("radio", { name: "Street" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Satellite" }));

    expect(mapboxMock.methods.setStyle).toHaveBeenCalledWith(
      "mapbox://styles/test/satellite",
    );
  });
});
