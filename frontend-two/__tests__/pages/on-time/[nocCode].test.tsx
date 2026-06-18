import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@/components/on-time/DelayFrequencyChart", () => ({
  default: ({ data }: any) => (
    <div data-testid="delay-frequency-chart">
      Delay Frequency: {data.length} items
    </div>
  ),
}));

vi.mock("@/components/on-time/TimeOfDayChart", () => ({
  default: ({ data }: any) => (
    <div data-testid="time-of-day-chart">Time of Day: {data.length} items</div>
  ),
}));

vi.mock("@/components/on-time/DayOfWeekChart", () => ({
  default: ({ data }: any) => (
    <div data-testid="day-of-week-chart">Day of Week: {data.length} items</div>
  ),
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

  it("renders charts section with all tabs", async () => {
    mockFetchDelayFrequency.mockResolvedValue([
      { delayMinutes: 0, count: 100 },
      { delayMinutes: 5, count: 50 },
    ] as any);
    mockFetchTimeOfDay.mockResolvedValue([
      { hour: 0, onTime: 50, early: 10, late: 40 },
    ] as any);
    mockFetchDayOfWeek.mockResolvedValue([
      { dayOfWeek: "Monday", onTime: 60, early: 10, late: 30 },
    ] as any);

    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(screen.getByTestId("delay-frequency-chart")).toBeInTheDocument();
    });

    expect(screen.getByText("Delay Frequency: 2 items")).toBeInTheDocument();
  });

  it("switches between chart tabs", async () => {
    mockFetchDelayFrequency.mockResolvedValue([
      { delayMinutes: 0, count: 100 },
    ] as any);
    mockFetchTimeOfDay.mockResolvedValue([
      { hour: 0, onTime: 50, early: 10, late: 40 },
      { hour: 1, onTime: 60, early: 5, late: 35 },
    ] as any);
    mockFetchDayOfWeek.mockResolvedValue([
      { dayOfWeek: "Monday", onTime: 60, early: 10, late: 30 },
    ] as any);

    const user = userEvent.setup();
    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(screen.getByText("Delay Frequency: 1 items")).toBeInTheDocument();
    });

    const timeOfDayTab = screen.getByRole("button", { name: "Time of day" });
    await user.click(timeOfDayTab);

    expect(screen.getByText("Time of Day: 2 items")).toBeInTheDocument();

    const dayOfWeekTab = screen.getByRole("button", { name: "Day of week" });
    await user.click(dayOfWeekTab);

    expect(screen.getByText("Day of Week: 1 items")).toBeInTheDocument();
  });
});
