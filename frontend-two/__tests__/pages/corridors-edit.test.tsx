import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import CorridorsEditPage from "@/pages/corridors/edit/[corridorId]";

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

vi.mock("@/services/corridors/corridors.service", () => ({
  corridorsService: {
    queryStops: vi.fn(),
    fetchSubsequentStops: vi.fn(),
    createCorridor: vi.fn(),
    updateCorridor: vi.fn(),
    deleteCorridor: vi.fn(),
    fetchCorridorById: vi.fn(),
  },
}));

let mockQuery: Record<string, string | string[] | undefined> = {
  corridorId: "12",
};
const mockPush = vi.fn().mockResolvedValue(true);
const mockBack = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/corridors/edit/[corridorId]",
    asPath: "/corridors/edit/12",
    query: mockQuery,
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { corridorsService } from "@/services/corridors/corridors.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchCorridorById = vi.mocked(corridorsService.fetchCorridorById);
const mockUpdateCorridor = vi.mocked(corridorsService.updateCorridor);
const mockDeleteCorridor = vi.mocked(corridorsService.deleteCorridor);
const mockCreateCorridor = vi.mocked(corridorsService.createCorridor);
const mockFetchSubsequentStops = vi.mocked(
  corridorsService.fetchSubsequentStops,
);

const corridor = {
  id: 12,
  name: "Corridor 12",
  stops: [
    {
      stopId: "a",
      stopName: "Stop A",
      naptan: "ATCO:A",
      localityName: "Town A",
      adminAreaId: "1",
      sourceId: "ATCO:A",
      lon: -1,
      lat: 53,
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
    },
  ],
};

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CorridorsEditPage />
    </SWRConfig>,
  );

describe("CorridorsEditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = { corridorId: "12" };

    mockUseConfig.mockReturnValue({
      config: { apiUrl: "http://test-api" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    mockFetchCorridorById.mockResolvedValue(corridor);
    mockFetchSubsequentStops.mockResolvedValue([]);
    mockUpdateCorridor.mockResolvedValue(true);
    mockDeleteCorridor.mockResolvedValue(true);
    mockCreateCorridor.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading while corridor is fetched", () => {
    mockFetchCorridorById.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows not found view when corridor is missing", async () => {
    mockFetchCorridorById.mockResolvedValue(null);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        /Corridor not found, or you do not have permission to view\./,
      ),
    ).toBeInTheDocument();
  });

  it("updates corridor when save is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Corridor 12")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("Enter a corridor name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated corridor");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockUpdateCorridor).toHaveBeenCalledWith("http://test-api", {
        id: 12,
        name: "Updated corridor",
        stopList: ["a", "b"],
      });
    });
  });

  it("deletes corridor after confirmation", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Delete this corridor" }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Delete this corridor" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete corridor" }));

    await waitFor(() => {
      expect(mockDeleteCorridor).toHaveBeenCalledWith("http://test-api", 12);
    });
    expect(mockPush).toHaveBeenCalledWith("/corridors");
  });

  it("shows not found for invalid corridor ids", () => {
    mockQuery = { corridorId: "abc" };

    renderPage();

    expect(screen.getByText("Not found")).toBeInTheDocument();
  });
});
