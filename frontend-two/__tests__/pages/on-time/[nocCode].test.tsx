import { render, screen, waitFor, cleanup } from "@testing-library/react";
import OnTimeOperatorPage from "@/pages/on-time/[nocCode]";

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

vi.mock("@/services/on-time/on-time.service", () => ({
  onTimeService: {
    fetchOnTimeDelayFrequencyData: vi.fn(),
    fetchOnTimeTimeSeriesData: vi.fn(),
    fetchOnTimePunctualityTimeOfDayData: vi.fn(),
    fetchOnTimePunctualityDayOfWeekData: vi.fn(),
    fetchOnTimePerformanceList: vi.fn(),
  },
}));

vi.mock("@/services/on-time/performance.service", () => ({
  performanceService: {
    fetchOverviewStats: vi.fn(),
    fetchServicePerformance: vi.fn(),
  },
}));

vi.mock("@/services/on-time/headway.service", () => ({
  headwayService: {
    fetchTimeSeries: vi.fn(),
  },
}));

let mockQuery: Record<string, string | string[] | undefined> = {
  nocCode: "ABCD",
};

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/on-time/[nocCode]",
    asPath: "/on-time/ABCD",
    query: mockQuery,
    replace: vi.fn(),
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { headwayService } from "@/services/on-time/headway.service";
import { onTimeService } from "@/services/on-time/on-time.service";
import { performanceService } from "@/services/on-time/performance.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchOverviewStats = vi.mocked(performanceService.fetchOverviewStats);
const mockFetchDelayFrequency = vi.mocked(
  onTimeService.fetchOnTimeDelayFrequencyData,
);
const mockFetchTimeSeries = vi.mocked(onTimeService.fetchOnTimeTimeSeriesData);
const mockFetchTimeOfDay = vi.mocked(
  onTimeService.fetchOnTimePunctualityTimeOfDayData,
);
const mockFetchDayOfWeek = vi.mocked(
  onTimeService.fetchOnTimePunctualityDayOfWeekData,
);
const mockFetchServicePerformancePlain = vi.mocked(
  onTimeService.fetchOnTimePerformanceList,
);
const mockFetchServicePerformance = vi.mocked(
  performanceService.fetchServicePerformance,
);
const mockFetchHeadwayTimeSeries = vi.mocked(headwayService.fetchTimeSeries);

describe("OnTimeOperatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = { nocCode: "ABCD" };
    mockUseConfig.mockReturnValue({
      config: { apiUrl: "http://test-api" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    mockFetchOverviewStats.mockResolvedValue({});
    mockFetchDelayFrequency.mockResolvedValue([]);
    mockFetchTimeSeries.mockResolvedValue([]);
    mockFetchTimeOfDay.mockResolvedValue([]);
    mockFetchDayOfWeek.mockResolvedValue([]);
    mockFetchServicePerformancePlain.mockResolvedValue([
      {
        lineId: "LINE1",
        lineInfo: {
          serviceId: "S1",
          serviceName: "Demo Service",
          serviceNumber: "1",
        },
        onTime: 1,
        early: 0,
        late: 0,
        total: 1,
        onTimeRatio: 1,
        earlyRatio: 0,
        lateRatio: 0,
        completedRatio: 0,
      },
    ] as any);
    mockFetchServicePerformance.mockResolvedValue([]);
    mockFetchHeadwayTimeSeries.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state initially", () => {
    mockFetchOverviewStats.mockImplementation(() => new Promise(() => {}));

    render(<OnTimeOperatorPage />);

    expect(screen.getByText("Loading on-time data...")).toBeInTheDocument();
  });

  it("renders skeleton json sections after data loads", async () => {
    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(
        screen.getByText("performanceService.fetchOverviewStats"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("onTimeService.fetchOnTimeDelayFrequencyData"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onTimeService.fetchOnTimeTimeSeriesData"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("headwayService.fetchTimeSeries"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LINE1" })).toHaveAttribute(
      "href",
      "/on-time/ABCD/LINE1",
    );
  });
});
