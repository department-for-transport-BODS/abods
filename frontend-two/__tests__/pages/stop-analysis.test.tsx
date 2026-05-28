import { render, screen, cleanup } from "@testing-library/react";
import StopAnalysisPage from "@/pages/stop-analysis";

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

vi.mock("@/services/apolloClient", () => ({
  apolloClient: {
    query: vi.fn().mockResolvedValue({ data: {} }),
    mutate: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("@/services/stop-analysis/stop-analysis.service", () => ({
  stopAnalysisService: {
    fetchStopAnalysis: vi.fn(),
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
}));

vi.mock("@/components/stop-analysis/StopAnalysisTable", () => ({
  StopAnalysisTable: ({
    data,
    loading,
    errored,
  }: {
    data: unknown[];
    loading: boolean;
    errored: boolean;
  }) => (
    <div
      data-testid="stop-analysis-table"
      data-loading={loading}
      data-errored={errored}
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

const mockUseConfig = vi.mocked(useConfig);
const mockFetchStopAnalysis = vi.mocked(stopAnalysisService.fetchStopAnalysis);
const mockFetchOperators = vi.mocked(stopAnalysisService.fetchOperators);
const mockFetchAdminAreas = vi.mocked(stopAnalysisService.fetchAdminAreas);

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
});
