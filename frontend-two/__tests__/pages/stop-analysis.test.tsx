import { render, screen, cleanup } from "@testing-library/react";
import StopAnalysisPage, {
  computeAdminAreaGeoJSON,
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
  StopAnalysisFilters: () => <div data-testid="stop-analysis-filters" />,
  RefineFilters: () => <div data-testid="refine-filters" />,
}));

vi.mock("@/components/stop-analysis/StopAnalysisTable", () => ({
  StopAnalysisTable: ({
    data,
    loading,
    errored,
    showTotals,
  }: {
    data: unknown[];
    loading: boolean;
    errored: boolean;
    showTotals?: boolean;
  }) => (
    <div
      data-testid="stop-analysis-table"
      data-loading={loading}
      data-errored={errored}
      data-show-totals={showTotals ? "true" : "false"}
    >
      {data.length} rows
    </div>
  ),
}));

const mockRouterReplace = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/stop-analysis",
    asPath: "/stop-analysis",
    query: {},
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

describe("StopAnalysisPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
