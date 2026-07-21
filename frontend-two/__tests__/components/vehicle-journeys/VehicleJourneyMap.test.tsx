import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleJourneyMap } from "@/components/vehicle-journeys/VehicleJourneyMap";
import { MatchType, OtpEnum } from "@/src/generated/graphql";

vi.mock("@/contexts/ConfigContext", () => ({
  useConfig: () => ({
    config: {
      mapboxToken: "test-token",
      mapboxStyle: "mapbox://styles/test/default",
      mapboxSatelliteStyle: "mapbox://styles/test/satellite",
    },
    isLoading: false,
    error: null,
  }),
}));

const mapboxMock = vi.hoisted(() => {
  const eventHandlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  const registeredImages = new Set<string>();

  const methods = {
    addControl: vi.fn((control?: { onAdd?: () => HTMLElement }) => {
      const controlElement = control?.onAdd?.();
      if (controlElement) {
        document.body.appendChild(controlElement);
      }
    }),
    addImage: vi.fn((id: string) => registeredImages.add(id)),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    fitBounds: vi.fn(),
    getCanvas: vi.fn(() => ({ style: {} })),
    getLayer: vi.fn(() => undefined),
    getSource: vi.fn(() => undefined),
    hasImage: vi.fn((id: string) => registeredImages.has(id)),
    isStyleLoaded: vi.fn(() => true),
    loadImage: vi.fn(
      (_url: string, callback: (error: Error | null, image?: {}) => void) =>
        callback(null, {}),
    ),
    off: vi.fn(
      (event: string, layerOrHandler: unknown, maybeHandler?: unknown) => {
        const handler =
          typeof layerOrHandler === "function" ? layerOrHandler : maybeHandler;
        if (!handler || !eventHandlers[event]) {
          return;
        }
        eventHandlers[event] = eventHandlers[event].filter(
          (registeredHandler) => registeredHandler !== handler,
        );
      },
    ),
    on: vi.fn(
      (event: string, layerOrHandler: unknown, maybeHandler?: unknown) => {
        const handler =
          typeof layerOrHandler === "function" ? layerOrHandler : maybeHandler;
        if (!handler) {
          return;
        }
        eventHandlers[event] ??= [];
        eventHandlers[event].push(handler as (...args: unknown[]) => void);
      },
    ),
    once: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      eventHandlers[event] ??= [];
      eventHandlers[event].push(handler);
    }),
    remove: vi.fn(),
    removeFeatureState: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    setFeatureState: vi.fn(),
  };

  class MockLngLatBounds {
    private readonly points: Array<[number, number]> = [];

    constructor(sw?: [number, number], ne?: [number, number]) {
      if (sw) {
        this.extend(sw);
      }
      if (ne) {
        this.extend(ne);
      }
    }

    extend(point: [number, number]) {
      this.points.push(point);
      return this;
    }

    isEmpty() {
      return this.points.length === 0;
    }
  }

  class MockMap {
    addControl = methods.addControl;
    addImage = methods.addImage;
    addLayer = methods.addLayer;
    addSource = methods.addSource;
    fitBounds = methods.fitBounds;
    getCanvas = methods.getCanvas;
    getLayer = methods.getLayer;
    getSource = methods.getSource;
    hasImage = methods.hasImage;
    isStyleLoaded = methods.isStyleLoaded;
    loadImage = methods.loadImage;
    off = methods.off;
    on = methods.on;
    once = methods.once;
    remove = methods.remove;
    removeFeatureState = methods.removeFeatureState;
    removeLayer = methods.removeLayer;
    removeSource = methods.removeSource;
    setFeatureState = methods.setFeatureState;
  }

  class MockPopup {
    remove = vi.fn(() => this);
    setLngLat = vi.fn(() => this);
    setDOMContent = vi.fn(() => this);
    addTo = vi.fn(() => this);
  }

  const clearEventHandlers = () => {
    Object.keys(eventHandlers).forEach((event) => {
      delete eventHandlers[event];
    });
  };

  const clearRegisteredImages = () => registeredImages.clear();

  return {
    clearEventHandlers,
    clearRegisteredImages,
    eventHandlers,
    methods,
    MockLngLatBounds,
    MockMap,
    MockPopup,
  };
});

vi.mock("mapbox-gl", () => ({
  default: {
    Map: mapboxMock.MockMap,
    NavigationControl: class {},
    Popup: mapboxMock.MockPopup,
    ScaleControl: class {},
    LngLatBounds: mapboxMock.MockLngLatBounds,
    accessToken: "",
  },
  Map: mapboxMock.MockMap,
  NavigationControl: class {},
  Popup: mapboxMock.MockPopup,
  ScaleControl: class {},
  LngLatBounds: mapboxMock.MockLngLatBounds,
}));

const stops = [
  {
    actualDepartureUtc: "2026-07-13T09:31:00Z",
    estimatedDepartureUtc: null,
    scheduledDepartureUtc: "2026-07-13T09:30:00Z",
    latitude: 51.5,
    longitude: -0.12,
    stopIndex: 1,
    stopName: "High Street",
    stopId: 1,
    isTimingPoint: true,
    otp: OtpEnum.OnTime,
    directionRef: "outbound",
    incompleteReason: 0,
    setDown: false,
  },
];

const avls = [
  {
    recordedAtTimeUtc: "2026-07-13T09:31:00Z",
    latitude: 51.5,
    longitude: -0.12,
    vehicleRef: "BUS-1",
    directionRef: "outbound",
  },
];

const renderMap = (viewportKey = "journey-1") =>
  render(
    <VehicleJourneyMap
      stops={stops}
      avls={avls}
      rawAvls={avls}
      scheduledRoute={[
        [-0.12, 51.5],
        [-0.13, 51.51],
      ]}
      directionRef="outbound"
      matchType={MatchType.Evidenced}
      viewportKey={viewportKey}
    />,
  );

describe("VehicleJourneyMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapboxMock.clearEventHandlers();
    mapboxMock.clearRegisteredImages();
    document.body.innerHTML = "";
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;

        onerror: (() => void) | null = null;

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the re-centre control after the first map movement", async () => {
    renderMap();

    await waitFor(() => {
      expect(mapboxMock.methods.fitBounds).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      mapboxMock.eventHandlers.movestart?.forEach((handler) => handler());
    });

    expect(
      screen.getByRole("button", { name: "Re-centre" }),
    ).toBeInTheDocument();
  });

  it("registers each icon once when initialization effects overlap", async () => {
    renderMap();

    await waitFor(() => {
      expect(mapboxMock.methods.addImage).toHaveBeenCalledTimes(8);
    });
  });

  it("only auto-fits on initial load and journey changes", async () => {
    const user = userEvent.setup();
    const { rerender } = renderMap();

    await waitFor(() => {
      expect(mapboxMock.methods.fitBounds).toHaveBeenCalledTimes(1);
    });

    rerender(
      <VehicleJourneyMap
        stops={stops}
        avls={avls}
        rawAvls={avls}
        scheduledRoute={[
          [-0.12, 51.5],
          [-0.13, 51.51],
        ]}
        directionRef="outbound"
        matchType={MatchType.Evidenced}
        viewportKey="journey-2"
      />,
    );

    await waitFor(() => {
      expect(mapboxMock.methods.fitBounds).toHaveBeenCalledTimes(2);
    });

    await user.click(screen.getByRole("button", { name: "Display options" }));
    await user.click(screen.getByRole("radio", { name: "Hide" }));

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: "Hide" })).toBeChecked();
    });
    expect(mapboxMock.methods.fitBounds).toHaveBeenCalledTimes(2);
  });
});
