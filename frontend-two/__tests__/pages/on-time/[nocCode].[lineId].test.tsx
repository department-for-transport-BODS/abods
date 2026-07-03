// NOTE: The OnTimeServicePage and OnTimeOperatorPage share same components.
// A lot of the testing for the display options and filters have been captured
// in the OnTimeOperatorPage tests, so we will not repeat those here.

import { render, screen, waitFor, cleanup } from "@testing-library/react";
import OnTimeServicePage from "@/pages/on-time/[nocCode]/[lineId]";

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
    fetchServiceInfo: vi.fn(),
    fetchStopPerformanceList: vi.fn(),
  },
}));

vi.mock("@/services/on-time/transit-model.service", () => ({
  transitModelService: {
    fetchServicePatternStops: vi.fn(),
  },
}));

vi.mock("@/services/on-time/headway.service", () => ({
  headwayService: {
    fetchFrequentServiceInfo: vi.fn(),
    fetchTimeSeries: vi.fn(),
  },
}));

vi.mock("@/services/on-time/stop-performance.service", () => ({
  stopPerformanceService: {
    mergeStops: vi.fn(),
  },
}));

vi.mock("@/components/on-time/ExcessWaitTimeChart", () => ({
  default: ({ data, fromTimestamp, toTimestamp }: any) => (
    <div data-testid="excess-wait-time-chart">
      <p>Chart with {data.length} data points</p>
      <p>From: {fromTimestamp}</p>
      <p>To: {toTimestamp}</p>
    </div>
  ),
}));

let mockQuery: Record<string, string | string[] | undefined> = {
  nocCode: "ABCD",
  lineId: "LINE1",
};

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/on-time/[nocCode]/[lineId]",
    asPath: "/on-time/ABCD/LINE1",
    query: mockQuery,
    replace: vi.fn(),
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { headwayService } from "@/services/on-time/headway.service";
import { onTimeService } from "@/services/on-time/on-time.service";
import { stopPerformanceService } from "@/services/on-time/stop-performance.service";
import { transitModelService } from "@/services/on-time/transit-model.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchServiceInfo = vi.mocked(onTimeService.fetchServiceInfo);
const mockFetchStopPerformance = vi.mocked(
  onTimeService.fetchStopPerformanceList,
);
const mockFetchServicePatternStops = vi.mocked(
  transitModelService.fetchServicePatternStops,
);
const mockFetchFrequentServiceInfo = vi.mocked(
  headwayService.fetchFrequentServiceInfo,
);
const mockFetchHeadwayTimeSeries = vi.mocked(headwayService.fetchTimeSeries);
const mockMergeStops = vi.mocked(stopPerformanceService.mergeStops);

describe("OnTimeServicePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = { nocCode: "ABCD", lineId: "LINE1" };
    mockUseConfig.mockReturnValue({
      config: { apiUrl: "http://test-api" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    mockFetchServiceInfo.mockResolvedValue({
      serviceId: "S1",
      serviceName: "Demo Service",
      serviceNumber: "1",
    } as any);
    mockFetchStopPerformance.mockResolvedValue([]);
    mockFetchServicePatternStops.mockResolvedValue([] as any);
    mockFetchFrequentServiceInfo.mockResolvedValue({
      averageHeadway: 10,
      averageExcessWaitTime: 2,
      totalJourneyTime: 30,
      waitingTime: 5,
      inVehicleTime: 25,
    } as any);
    mockFetchHeadwayTimeSeries.mockResolvedValue([] as any);
    mockMergeStops.mockReturnValue([] as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state initially", () => {
    mockFetchServiceInfo.mockImplementation(() => new Promise(() => {}));

    render(<OnTimeServicePage />);

    expect(screen.getByText("Loading service data...")).toBeInTheDocument();
  });

  it("renders ExcessWaitTimeChart when frequent service hours are available", async () => {
    mockFetchFrequentServiceInfo.mockResolvedValue({
      averageHeadway: 10,
      averageExcessWaitTime: 2,
      totalJourneyTime: 30,
      waitingTime: 5,
      inVehicleTime: 25,
      numHours: 10,
      totalHours: 24,
    } as any);

    mockFetchHeadwayTimeSeries.mockResolvedValue([
      { timestamp: "2024-01-01T00:00:00Z", value: 1.5 },
    ] as any);

    render(<OnTimeServicePage />);

    await waitFor(() => {
      expect(screen.getByTestId("excess-wait-time-chart")).toBeInTheDocument();
    });

    expect(screen.getByText("Chart with 1 data points")).toBeInTheDocument();
    expect(
      screen.getByText(
        /10 hours out of a total 24 service hours during the selected period/,
      ),
    ).toBeInTheDocument();
  });

  it("shows unavailable message when no frequent service hours", async () => {
    mockFetchFrequentServiceInfo.mockResolvedValue({
      averageHeadway: 0,
      averageExcessWaitTime: 0,
      totalJourneyTime: 0,
      waitingTime: 0,
      inVehicleTime: 0,
      numHours: 0,
      totalHours: 24,
    } as any);

    render(<OnTimeServicePage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Excess waiting time is unavailable for this service/),
      ).toBeInTheDocument();
    });
  });
});
