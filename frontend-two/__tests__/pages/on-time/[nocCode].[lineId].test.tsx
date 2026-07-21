// TODO: The OnTimeServicePage and OnTimeOperatorPage share same components.
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

vi.mock("@/components/on-time/OnTimeServiceMap", () => ({
  OnTimeServiceMap: () => <div data-testid="on-time-service-map" />,
}));

vi.mock("@/contexts/ConfigContext", () => ({
  useConfig: vi.fn(),
}));

vi.mock("@/services/operator.service", () => ({
  operatorsService: {
    fetchOperator: vi.fn(),
  },
}));

vi.mock("@/services/on-time/on-time.service", () => ({
  onTimeService: {
    fetchServiceInfo: vi.fn(),
    fetchStopPerformanceList: vi.fn(),
    fetchOnTimeDelayFrequencyData: vi.fn(),
    fetchOnTimeTimeSeriesData: vi.fn(),
    fetchOnTimePunctualityTimeOfDayData: vi.fn(),
    fetchOnTimePunctualityDayOfWeekData: vi.fn(),
  },
}));

vi.mock("@/services/on-time/headway.service", () => ({
  headwayService: {
    fetchFrequentServiceInfo: vi.fn(),
    fetchTimeSeries: vi.fn(),
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
const mockReplace = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/on-time/[nocCode]/[lineId]",
    asPath: "/on-time/ABCD/LINE1",
    query: mockQuery,
    isReady: true,
    replace: mockReplace,
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { headwayService } from "@/services/on-time/headway.service";
import { onTimeService } from "@/services/on-time/on-time.service";
import { operatorsService } from "@/services/operator.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchServiceInfo = vi.mocked(onTimeService.fetchServiceInfo);
const mockFetchStopPerformance = vi.mocked(
  onTimeService.fetchStopPerformanceList,
);
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
const mockFetchFrequentServiceInfo = vi.mocked(
  headwayService.fetchFrequentServiceInfo,
);
const mockFetchHeadwayTimeSeries = vi.mocked(headwayService.fetchTimeSeries);
const mockFetchOperator = vi.mocked(operatorsService.fetchOperator);

describe("OnTimeServicePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = { nocCode: "ABCD", lineId: "LINE1" };
    mockReplace.mockReset();
    mockUseConfig.mockReturnValue({
      config: { apiUrl: "http://test-api" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    mockFetchOperator.mockResolvedValue({
      operatorId: "OP1",
      nocCode: "ABCD",
      name: "Demo Operator",
      adminAreaIds: [],
    });

    mockFetchServiceInfo.mockResolvedValue({
      serviceId: "S1",
      serviceName: "Demo Service",
      serviceNumber: "1",
    } as any);
    mockFetchStopPerformance.mockResolvedValue([]);
    mockFetchDelayFrequency.mockResolvedValue([] as any);
    mockFetchTimeSeries.mockResolvedValue([] as any);
    mockFetchTimeOfDay.mockResolvedValue([] as any);
    mockFetchDayOfWeek.mockResolvedValue([] as any);
    mockFetchFrequentServiceInfo.mockResolvedValue({
      averageHeadway: 10,
      averageExcessWaitTime: 2,
      totalJourneyTime: 30,
      waitingTime: 5,
      inVehicleTime: 25,
    } as any);
    mockFetchHeadwayTimeSeries.mockResolvedValue([] as any);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state initially", () => {
    mockFetchOperator.mockImplementation(() => new Promise(() => {}));

    render(<OnTimeServicePage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders service heading and back link when service data is available", async () => {
    render(<OnTimeServicePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "1 - Demo Service" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Back to ABCD/i })).toHaveAttribute(
      "href",
      "/on-time/ABCD",
    );
  });

  it("redirects to operator-not-found when nocCode is inaccessible", async () => {
    mockFetchOperator.mockResolvedValue(null);

    render(<OnTimeServicePage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/on-time/operator-not-found");
    });

    expect(mockFetchServiceInfo).not.toHaveBeenCalled();
  });

  it("shows line-not-found content when service info is unavailable", async () => {
    mockFetchServiceInfo.mockResolvedValue(null);

    render(<OnTimeServicePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Not found" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Service not found, or you do not have permission to view/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "operator" })).toHaveAttribute(
      "href",
      "/on-time/ABCD",
    );
  });

  it("renders OnTimeServiceMap component", async () => {
    mockUseConfig.mockReturnValue({
      config: {
        apiUrl: "http://test-api",
        mapboxToken: "test-mapbox-token",
        mapboxStyle: "mapbox://styles/test/street",
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);

    render(<OnTimeServicePage />);

    await waitFor(() => {
      expect(screen.getByTestId("on-time-service-map")).toBeInTheDocument();
    });
  });
});
