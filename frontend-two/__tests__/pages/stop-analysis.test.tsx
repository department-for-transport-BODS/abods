import { render, screen, cleanup } from "@testing-library/react";
import StopAnalysisPage, {
  computeAdminAreaGeoJSON,
  mergeStopAnalysisQuery,
  pruneStopAnalysisSelections,
} from "@/pages/stop-analysis";

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

vi.mock("@/contexts/PanelContext", () => ({
  usePanel: () => ({
    setContent: vi.fn(),
    toggle: vi.fn(),
    destroy: vi.fn(),
  }),
}));

vi.mock("@/services/apolloClient", () => ({
  apolloClient: {
    query: vi.fn().mockResolvedValue({ data: {} }),
    mutate: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("@/services/stop-analysis/stop-analysis.service", () => ({
  stopAnalysisService: {
    fetchStopAnalysis: vi.fn(),
  },
}));

vi.mock("@/services/operator.service", () => ({
  operatorsService: {
    fetchOperators: vi.fn(),
    fetchAdminAreas: vi.fn(),
    fetchLines: vi.fn(),
  },
}));

vi.mock("@/components/stop-analysis/StopAnalysisMap", () => ({
  StopAnalysisMap: () => <div data-testid="stop-analysis-map" />,
}));

vi.mock("@/components/stop-analysis/StopAnalysisFilters", () => ({
  StopAnalysisFilters: (props: {
    onOperatorsChange: (values: string[]) => void;
  }) => {
    latestStopAnalysisFiltersProps = props;
    return <div data-testid="stop-analysis-filters" />;
  },
  RefineFilters: () => <div data-testid="refine-filters" />,
}));

vi.mock("@/components/stop-analysis/StopAnalysisTable", () => ({
  StopAnalysisTable: ({
    data,
    loading,
    errored,
    showTotals,
    directions,
    onDirectionsChange,
  }: {
    data: unknown[];
    loading: boolean;
    errored: boolean;
    showTotals?: boolean;
    directions: string[];
    onDirectionsChange: (values: string[]) => void;
  }) => (
    <div
      data-testid="stop-analysis-table"
      data-loading={loading}
      data-errored={errored}
      data-show-totals={showTotals ? "true" : "false"}
      data-directions={directions.join(",")}
    >
      {data.length} rows
    </div>
  ),
}));

let mockRouterQuery: Record<string, string | string[] | undefined> = {};
const mockRouterReplace = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/stop-analysis",
    asPath: "/stop-analysis",
    query: mockRouterQuery,
    replace: mockRouterReplace,
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { stopAnalysisService } from "@/services/stop-analysis/stop-analysis.service";
import { operatorsService } from "@/services/operator.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchStopAnalysis = vi.mocked(stopAnalysisService.fetchStopAnalysis);
const mockFetchOperators = vi.mocked(operatorsService.fetchOperators);
const mockFetchAdminAreas = vi.mocked(operatorsService.fetchAdminAreas);
const mockFetchLines = vi.mocked(operatorsService.fetchLines);
let latestStopAnalysisFiltersProps:
  | {
      onOperatorsChange: (values: string[]) => void;
    }
  | undefined;

describe("StopAnalysisPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestStopAnalysisFiltersProps = undefined;
    mockRouterQuery = {};
    mockUseConfig.mockReturnValue({
      config: {
        apiUrl: "http://test-api",
        mapboxToken: "test-token",
        mapboxStyle: "mapbox://styles/test",
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);
    mockFetchOperators.mockResolvedValue([]);
    mockFetchAdminAreas.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the page heading", () => {
    render(<StopAnalysisPage />);
    expect(screen.getByText("Stop Analysis")).toBeInTheDocument();
  });

  it("renders filters component", () => {
    render(<StopAnalysisPage />);
    expect(screen.getByTestId("stop-analysis-filters")).toBeInTheDocument();
  });

  it("renders the table component with loading state when no bounds set", () => {
    render(<StopAnalysisPage />);
    const table = screen.getByTestId("stop-analysis-table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute("data-show-totals", "true");
    expect(table).toHaveAttribute("data-directions", "Inbound,Outbound");
  });

  it("renders base layout wrapper", () => {
    render(<StopAnalysisPage />);
    expect(screen.getByTestId("base-layout")).toBeInTheDocument();
  });

  it("does not render map when config is missing mapbox token", () => {
    mockUseConfig.mockReturnValue({
      config: { apiUrl: "http://test-api" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    render(<StopAnalysisPage />);
    expect(screen.queryByTestId("stop-analysis-map")).not.toBeInTheDocument();
  });

  it("flips admin area coordinates before rendering the map geojson", () => {
    const geojson = computeAdminAreaGeoJSON(
      [
        {
          id: "AA1",
          name: "Example area",
          shape: JSON.stringify({
            type: "Polygon",
            coordinates: [
              [
                [1, 2],
                [3, 4],
                [5, 6],
                [1, 2],
              ],
            ],
          }),
        },
      ],
      ["AA1"],
    );

    expect(geojson.features).toHaveLength(1);
    expect(geojson.features[0].geometry).toMatchObject({
      type: "Polygon",
      coordinates: [
        [
          [2, 1],
          [4, 3],
          [6, 5],
          [2, 1],
        ],
      ],
    });
  });

  it("prunes operators and services when admin areas change", () => {
    const operators = [
      {
        operatorId: "suffolk-op",
        adminAreaIds: ["1"],
      },
      {
        operatorId: "northampton-op",
        adminAreaIds: ["2"],
      },
    ];
    const lines = [
      {
        id: "suffolk-line",
        adminAreaIds: [1],
      },
      {
        id: "northampton-line",
        adminAreaIds: [2],
      },
    ];

    expect(
      pruneStopAnalysisSelections(
        ["1"],
        ["suffolk-op", "northampton-op"],
        ["suffolk-line", "northampton-line"],
        operators,
        lines,
      ),
    ).toEqual({
      operatorIds: ["suffolk-op"],
      lineIds: [],
    });

    expect(
      pruneStopAnalysisSelections(
        ["1"],
        ["suffolk-op"],
        ["suffolk-line", "northampton-line"],
        operators,
        lines,
      ),
    ).toEqual({
      operatorIds: ["suffolk-op"],
      lineIds: ["suffolk-line"],
    });
  });

  it("clears line selections when all operators are removed", () => {
    render(<StopAnalysisPage />);

    expect(latestStopAnalysisFiltersProps).toBeDefined();

    latestStopAnalysisFiltersProps?.onOperatorsChange([]);

    expect(mockRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/stop-analysis",
        query: expect.objectContaining({
          operatorIds: [],
        }),
      }),
      undefined,
      { shallow: true },
    );
  });

  it("round-trips an empty direction selection through the query", () => {
    mockRouterQuery = { direction: "none" };

    render(<StopAnalysisPage />);

    expect(screen.getByTestId("stop-analysis-table")).toHaveAttribute(
      "data-directions",
      "",
    );
  });

  it("preserves the selected stop type when map bounds are merged into the query", () => {
    expect(
      mergeStopAnalysisQuery(
        { stopType: "AllStops", fromTimestamp: "2026-01-01" },
        { minLatitude: "51.1", maxLatitude: "51.2" },
      ),
    ).toMatchObject({
      stopType: "AllStops",
      fromTimestamp: "2026-01-01",
      minLatitude: "51.1",
      maxLatitude: "51.2",
    });
  });

  it("falls back to the latest selected stop type when the query snapshot is stale", () => {
    expect(
      mergeStopAnalysisQuery(
        { fromTimestamp: "2026-01-01" },
        { minLatitude: "51.1", maxLatitude: "51.2" },
        "AllStops",
      ),
    ).toMatchObject({
      stopType: "AllStops",
      fromTimestamp: "2026-01-01",
      minLatitude: "51.1",
      maxLatitude: "51.2",
    });
  });
});
