import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CorridorViewMap } from "@/components/corridors/view/CorridorViewMap";

const mapboxMock = vi.hoisted(() => {
  const methods = {
    addControl: vi.fn(),
    addImage: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    fitBounds: vi.fn(),
    getBounds: vi.fn(() => ({
      getSouth: () => 0,
      getNorth: () => 1,
      getWest: () => 2,
      getEast: () => 3,
    })),
    getCanvas: vi.fn(() => ({ style: {} })),
    getLayer: vi.fn(() => undefined),
    getSource: vi.fn(() => undefined),
    hasImage: vi.fn(() => false),
    isStyleLoaded: vi.fn(() => true),
    off: vi.fn(),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    loadImage: vi.fn((_, callback) =>
      callback(null, { width: 16, height: 16 }),
    ),
    setFeatureState: vi.fn(),
    setStyle: vi.fn(),
    on: vi.fn((event, layerOrHandler, handler) => {
      const callback =
        typeof layerOrHandler === "function" ? layerOrHandler : handler;
      if (event === "load" || event === "style.load") {
        callback?.();
      }
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
    off = methods.off;
    on = methods.on;
    remove = methods.remove;
    removeLayer = methods.removeLayer;
    removeSource = methods.removeSource;
    loadImage = methods.loadImage;
    setFeatureState = methods.setFeatureState;
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
    LngLatBounds: class {
      extend() {
        return this;
      }
    },
    accessToken: "",
    Popup: class {
      remove = vi.fn();
    },
  },
  Map: mapboxMock.MockMap,
  NavigationControl: class {},
  LngLatBounds: class {
    extend() {
      return this;
    }
  },
}));

describe("CorridorViewMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the shared display options and switches map style", async () => {
    const user = userEvent.setup();

    render(
      <CorridorViewMap
        stops={[
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
        ]}
        serviceLinks={[]}
        selectedSegmentIndex={null}
        mapboxToken="test-token"
        mapboxStyle="mapbox://styles/test/street"
        mapboxSatelliteStyle="mapbox://styles/test/satellite"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Display options" });
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByRole("radio", { name: "Default" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Satellite" }));

    expect(mapboxMock.methods.setStyle).toHaveBeenCalledWith(
      "mapbox://styles/test/satellite",
    );

    expect(mapboxMock.methods.loadImage).toHaveBeenCalledWith(
      "/assets/icons/map-chevron.svg",
      expect.any(Function),
    );
    expect(mapboxMock.methods.addImage).toHaveBeenCalledWith(
      "map-chevron-large",
      expect.any(Object),
    );

    expect(mapboxMock.methods.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "corridor-chevrons",
        type: "symbol",
      }),
      "corridor-markers",
    );
  });
});
