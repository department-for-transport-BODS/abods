import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import CorridorsPage from "@/pages/corridors";

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CorridorsPage />
    </SWRConfig>,
  );

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
    fetchCorridors: vi.fn(),
  },
}));

const mockReplace = vi.fn().mockResolvedValue(true);
let mockQuery: Record<string, string | string[] | undefined> = {};

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/corridors",
    asPath: "/corridors",
    query: mockQuery,
    replace: mockReplace,
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { corridorsService } from "@/services/corridors/corridors.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchCorridors = vi.mocked(corridorsService.fetchCorridors);

describe("CorridorsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {};
    mockUseConfig.mockReturnValue({
      config: { apiUrl: "http://test-api" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state initially", () => {
    mockFetchCorridors.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders corridors in the grid when fetch succeeds", async () => {
    mockFetchCorridors.mockResolvedValue([
      { id: 1, name: "Alpha", numStops: 3 },
      { id: 2, name: "Beta", numStops: 5 },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
      "href",
      "/corridors/1",
    );
    expect(screen.getAllByRole("link", { name: "Edit" })[0]).toHaveAttribute(
      "href",
      "/corridors/edit/1",
    );
    expect(
      screen.getByRole("button", { name: "Create new corridor" }),
    ).toHaveAttribute("href", "/corridors/create");
  });

  it("sorts corridors by name ascending by default using numeric collation", async () => {
    mockFetchCorridors.mockResolvedValue([
      { id: 1, name: "Route 10", numStops: 4 },
      { id: 2, name: "Route 2", numStops: 4 },
      { id: 3, name: "Route 1", numStops: 4 },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Route 1")).toBeInTheDocument();
    });

    const rowNames = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector("td")?.textContent);
    expect(rowNames).toEqual(["Route 1", "Route 2", "Route 10"]);
  });

  it("filters corridors based on the search input", async () => {
    mockFetchCorridors.mockResolvedValue([
      { id: 1, name: "Alpha", numStops: 3 },
      { id: 2, name: "Beta", numStops: 5 },
    ]);

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
    });

    const input = screen.getByLabelText("Search for a corridor");
    await user.type(input, "bet");

    expect(mockReplace).toHaveBeenCalled();
  });

  it("shows no-matches message when filter excludes all rows", async () => {
    mockQuery = { search: encodeURIComponent("zzz") };
    mockFetchCorridors.mockResolvedValue([
      { id: 1, name: "Alpha", numStops: 3 },
    ]);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("No corridors matched the search query."),
      ).toBeInTheDocument();
    });
  });

  it("shows error summary when fetch returns null", async () => {
    mockFetchCorridors.mockResolvedValue(null);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(
          "There was an error loading operator data, please try again.",
        ),
      ).toBeInTheDocument();
    });
  });
});
