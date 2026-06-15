import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime } from "luxon";
import { SWRConfig } from "swr";
import CorridorsViewPage from "@/pages/corridors/[corridorId]";
import { useConfig } from "@/contexts/ConfigContext";
import { corridorsService } from "@/services/corridors/corridors.service";
import { Corridor, CorridorStats } from "@/types/corridors";
import { RouteType } from "../../src/generated/graphql";

vi.mock("@/hooks/useAuth", () => ({
  useRequireAuth: vi.fn(),
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/components/layout/BaseLayout", () => ({
  BaseLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="base-layout">{children}</div>
  ),
}));

vi.mock("@/components/shared/DateRangeSelect", () => ({
  DateRangeSelect: ({
    value,
    onChange,
  }: {
    value: { from: string; to: string };
    onChange: (dateRange: { from: string; to: string }) => void;
  }) => (
    <button
      type="button"
      data-testid="date-range-select"
      onClick={() => onChange({ from: "2026-05-01", to: "2026-05-08" })}
    >
      {value.from} - {value.to}
    </button>
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
    fetchCorridorById: vi.fn(),
    fetchStats: vi.fn(),
  },
}));

let mockQuery: Record<string, string | string[] | undefined> = {
  corridorId: "12",
};
const mockReplace = vi.fn().mockResolvedValue(true);

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/corridors/[corridorId]",
    asPath: "/corridors/12",
    query: mockQuery,
    replace: mockReplace,
  }),
}));

const mockUseConfig = vi.mocked(useConfig);
const mockFetchCorridorById = vi.mocked(corridorsService.fetchCorridorById);
const mockFetchStats = vi.mocked(corridorsService.fetchStats);

const corridor: Corridor = {
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
  ],
};

const stats: CorridorStats = {
  summaryStats: {
    averageTransitTime: 420,
    numberOfServices: 2,
    scheduledTransits: 10,
    totalTransits: 8,
  },
  transitTimeStats: [
    {
      ts: "2026-05-01T00:00:00+00:00",
      minTransitTime: 300,
      maxTransitTime: 600,
      avgTransitTime: 420,
      percentile25: 350,
      percentile75: 500,
    },
  ],
  transitTimeTimeOfDayStats: [
    {
      hour: 10,
      category: "10:00",
      binLabel: "10:00 - 11:00",
      minTransitTime: 320,
      maxTransitTime: 640,
      avgTransitTime: 440,
      percentile25: 370,
      percentile75: 520,
    },
  ],
  transitTimeDayOfWeekStats: [
    {
      dow: 1,
      category: "Mon",
      binLabel: "Monday",
      minTransitTime: 330,
      maxTransitTime: 650,
      avgTransitTime: 450,
      percentile25: 380,
      percentile75: 530,
    },
  ],
  transitTimeHistogram: [
    {
      bin: 6,
      freq: 4,
      xAxisCategory: "6:00",
      xAxisLabel: "6:00 - 6:59",
    },
  ],
  transitTimePerServiceStats: [
    {
      lineName: "10",
      servicePatternName: "Outbound",
      noc: "ABC",
      operatorName: "Operator A",
      recordedTransits: 4,
      scheduledTransits: 5,
      totalTransitTime: 1680,
    },
  ],
  serviceLinks: [
    {
      fromStop: "ATCO:A",
      toStop: "ATCO:B",
      distance: 1000,
      routeValidity: RouteType.Valid,
      linkRoute: null,
    },
  ],
};

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CorridorsViewPage />
    </SWRConfig>,
  );

describe("CorridorsViewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockQuery = {
      corridorId: "12",
      from: "2026-05-26T00:00:00.000Z",
      to: "2026-06-02T00:00:00.000Z",
      preset: "custom",
    };

    mockUseConfig.mockReturnValue({
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    mockFetchCorridorById.mockResolvedValue(corridor);
    mockFetchStats.mockResolvedValue(stats);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state while corridor is fetching", () => {
    mockFetchCorridorById.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    expect(
      document.querySelector(".corridor__summary-stat .stat__value--loading"),
    ).toBeTruthy();
    expect(
      document.querySelector(".corridor__summary-stat .stat__value--tooltip"),
    ).toBeNull();
    expect(document.querySelector(".corridor__summary-stat button")).toBeNull();
  });

  it("shows loading dots while stats are fetching", async () => {
    mockFetchStats.mockImplementation(() => new Promise(() => {}));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Corridor 12")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
    expect(
      document.querySelector(".corridor__summary-stat .stat__value--loading"),
    ).toBeTruthy();
    expect(
      document.querySelector(".corridor__summary-stat .stat__value--tooltip"),
    ).toBeNull();
    expect(document.querySelector(".corridor__summary-stat button")).toBeNull();
  });

  it("shows not found when corridor is missing", async () => {
    mockFetchCorridorById.mockResolvedValue(null);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });

  it("renders corridor stats and services", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Corridor 12")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Recorded transits").length).toBeGreaterThan(0);
    expect(screen.getByText("Missing transits")).toBeInTheDocument();
    expect(screen.getAllByText("Average journey time").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByRole("heading", { name: "Services" }),
    ).toBeInTheDocument();
    expect(screen.getByText("10: Outbound")).toBeInTheDocument();
  });

  it("updates URL when segment selection changes", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      // CorridorSegmentSelector renders buttons with accessible name like "Segment - {from}, {to}"
      expect(
        screen.getAllByRole("button", { name: /segment -/i }).length,
      ).toBeGreaterThan(0);
    });

    const segmentButtons = screen.getAllByRole("button", {
      name: /segment -/i,
    });
    await user.click(segmentButtons[0]);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it("stores hide outlier settings in one localStorage object", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: "Hide outliers" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("checkbox", { name: "Hide outliers" }));

    const raw = localStorage.getItem("abods.corridors.hideOutliers");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}");
    expect(parsed).toEqual({
      journeyTime: true,
      timeOfDay: false,
      dayOfWeek: false,
    });
  });

  it("renders the shared date range control and updates the query when changed", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("date-range-select")).toHaveTextContent(
        "2026-05-26T00:00:00.000Z - 2026-06-02T00:00:00.000Z",
      );
    });

    await user.click(screen.getByTestId("date-range-select"));

    const expectedFrom = DateTime.fromISO("2026-05-01")
      .startOf("day")
      .toUTC()
      .toISO();
    const expectedTo = DateTime.fromISO("2026-05-08")
      .endOf("day")
      .toUTC()
      .toISO();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/corridors/[corridorId]",
          query: expect.objectContaining({
            from: expectedFrom,
            to: expectedTo,
            preset: "custom",
          }),
        }),
        undefined,
        { shallow: true },
      );
    });
  });
});
