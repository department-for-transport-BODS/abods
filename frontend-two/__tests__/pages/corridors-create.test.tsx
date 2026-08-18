import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import CorridorsCreatePage from "@/pages/corridors/create";

vi.mock("@/hooks/useAuth", () => ({
  useRequireAuth: vi.fn(),
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/components/layout/BaseLayout", () => ({
  BaseLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="base-layout">{children}</div>
  ),
}));

vi.mock("@/contexts/ConfigContext", () => ({
  useConfig: vi.fn(),
}));

vi.mock("@/contexts/HelpdeskContext", () => ({
  useHelpdesk: vi.fn().mockReturnValue({
    isOpen: false,
    data: null,
    open: vi.fn(),
    close: vi.fn(),
    loadData: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/services/corridors/corridors.service", () => ({
  corridorsService: {
    queryStops: vi.fn(),
    fetchSubsequentStops: vi.fn(),
    createCorridor: vi.fn(),
    updateCorridor: vi.fn(),
    deleteCorridor: vi.fn(),
  },
}));

const mapHarness = vi.hoisted(() => ({
  onBoundsChange: undefined as
    | ((bounds: { getWest: () => number; getEast: () => number }) => void)
    | undefined,
}));

vi.mock("@/components/corridors/create/CorridorCreateMap", () => ({
  CorridorCreateMap: ({
    onBoundsChange,
  }: {
    onBoundsChange?: (bounds: {
      getWest: () => number;
      getEast: () => number;
    }) => void;
  }) => {
    mapHarness.onBoundsChange = onBoundsChange;
    return <div data-testid="corridor-create-map" />;
  },
}));

const mockPush = vi.fn().mockResolvedValue(true);

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/corridors/create",
    asPath: "/corridors/create",
    query: {},
    push: mockPush,
    back: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { corridorsService } from "@/services/corridors/corridors.service";
import { CorridorStop } from "@/types/corridors";

const mockUseConfig = vi.mocked(useConfig);
const mockQueryStops = vi.mocked(corridorsService.queryStops);
const mockFetchSubsequentStops = vi.mocked(
  corridorsService.fetchSubsequentStops,
);
const mockCreateCorridor = vi.mocked(corridorsService.createCorridor);
const mockFetch = vi.fn();

const stopA: CorridorStop = {
  stopId: "a",
  stopName: "Stop A",
  naptan: "ATCO:A",
  localityName: "Town A",
  adminAreaId: "1",
  sourceId: "ATCO:A",
  lon: -1,
  lat: 53,
  intId: 1,
};

const stopB: CorridorStop = {
  stopId: "b",
  stopName: "Stop B",
  naptan: "ATCO:B",
  localityName: "Town B",
  adminAreaId: "1",
  sourceId: "ATCO:B",
  lon: -1.1,
  lat: 53.1,
  intId: 2,
};

const fakeBounds = (west: number, east: number) => ({
  getWest: () => west,
  getEast: () => east,
  getSouth: () => 50,
  getNorth: () => 51,
  toArray: () => [
    [west, 50],
    [east, 51],
  ],
});

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CorridorsCreatePage />
    </SWRConfig>,
  );

describe("CorridorsCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapHarness.onBoundsChange = undefined;
    vi.stubGlobal("fetch", mockFetch);
    mockUseConfig.mockReturnValue({
      config: {
        mapboxToken: "test-mapbox-token",
        mapboxStyle: "mapbox://styles/test/street",
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    mockQueryStops.mockResolvedValue({ orgStops: [stopA], nonOrgStops: [] });
    mockFetchSubsequentStops.mockResolvedValue([stopB]);
    mockCreateCorridor.mockResolvedValue(true);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "place.1",
            text: "Test location",
            place_name: "Test location",
            center: [-1, 53],
            bbox: [-1.1, 52.9, -0.9, 53.1],
          },
        ],
      }),
    } as Response);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders create corridor form", () => {
    renderPage();
    expect(screen.getByText("Create new corridor")).toBeInTheDocument();
    expect(screen.getByLabelText("Enter a corridor name")).toBeInTheDocument();
  });

  it("shows matching stops after selecting a postcode location", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("Location name or postcode"),
      "SW1A 1AA",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Test location" }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Test location" }));

    await waitFor(() => {
      expect(mockQueryStops).toHaveBeenCalledWith(undefined, expect.anything());
      expect(screen.getByText("1 matching stops")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Select" }),
      ).toBeInTheDocument();
    });
  });

  it("shows error for a location search area that is too large", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "place.2",
            text: "Large location",
            bbox: [-2, 50, -0.5, 51],
          },
        ],
      }),
    } as Response);
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("Location name or postcode"),
      "Large location",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Large location" }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Large location" }));

    expect(
      screen.getByText("Search area too large, please zoom in to show stops"),
    ).toBeInTheDocument();
    expect(mockQueryStops).not.toHaveBeenCalled();
  });

  it("does not show the too-large error before a location is selected", () => {
    renderPage();

    act(() => {
      mapHarness.onBoundsChange?.(fakeBounds(-8, 2));
    });

    expect(
      screen.queryByText("Search area too large, please zoom in to show stops"),
    ).not.toBeInTheDocument();
    expect(mockQueryStops).not.toHaveBeenCalled();
  });

  it("shows the too-large error after a location is selected when the map view is too wide", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText("Location name or postcode"),
      "SW1A 1AA",
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Test location" }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Test location" }));

    await waitFor(() => {
      expect(mockQueryStops).toHaveBeenCalled();
    });

    act(() => {
      mapHarness.onBoundsChange?.(fakeBounds(-8, 2));
    });

    expect(
      screen.getByText("Search area too large, please zoom in to show stops"),
    ).toBeInTheDocument();
  });

  it("shows validation error when trying to finish without name", async () => {
    const user = userEvent.setup();
    renderPage();

    // Switch to stop mode to test stop search
    await user.selectOptions(
      screen.getByLabelText("Search for the first stop in your corridor"),
      "stop",
    );

    const searchInput = screen.getByLabelText("Stop name or NaPTAN code");
    await user.type(searchInput, "Test");

    await waitFor(() => {
      expect(mockQueryStops).toHaveBeenCalledWith("Test", undefined);
      expect(
        screen.getByRole("button", { name: "Select" }),
      ).toBeInTheDocument();
    });

    act(() => {
      mapHarness.onBoundsChange?.(fakeBounds(-8, 2));
    });
    expect(mockQueryStops).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Select" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(screen.getAllByText("Name is required").length).toBeGreaterThan(0);
  });

  it("creates a corridor when form is valid", async () => {
    const user = userEvent.setup();
    renderPage();

    // Switch to stop mode to test stop search
    await user.selectOptions(
      screen.getByLabelText("Search for the first stop in your corridor"),
      "stop",
    );

    const searchInput = screen.getByLabelText("Stop name or NaPTAN code");
    await user.type(searchInput, "Test");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Select" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Select" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(
      screen.getByLabelText("Enter a corridor name"),
      "My corridor",
    );

    await user.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() => {
      expect(mockCreateCorridor).toHaveBeenCalledWith("My corridor", [
        "a",
        "b",
      ]);
    });
    expect(mockPush).toHaveBeenCalledWith("/corridors");
  });

  it("shows error when create corridor fails", async () => {
    mockCreateCorridor.mockResolvedValue(false);

    const user = userEvent.setup();
    renderPage();

    // Switch to stop mode to test stop search
    await user.selectOptions(
      screen.getByLabelText("Search for the first stop in your corridor"),
      "stop",
    );

    const searchInput = screen.getByLabelText("Stop name or NaPTAN code");
    await user.type(searchInput, "Test");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Select" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Select" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(
      screen.getByLabelText("Enter a corridor name"),
      "My corridor",
    );
    await user.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "We're having trouble creating your corridor. Please try again later.",
        ),
      ).toBeInTheDocument();
    });
  });
});
