import { render, screen, waitFor, cleanup } from "@testing-library/react";
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

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CorridorsCreatePage />
    </SWRConfig>,
  );

describe("CorridorsCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockUseConfig.mockReturnValue({
      config: {
        mapboxToken: "test-mapbox-token",
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
      expect(
        screen.getByRole("button", { name: "Select" }),
      ).toBeInTheDocument();
    });

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
