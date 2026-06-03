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
  },
}));

vi.mock("@/services/on-time/stop-performance.service", () => ({
  stopPerformanceService: {
    mergeStops: vi.fn(),
  },
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

  it("renders skeleton json sections and calls mergeStops", async () => {
    render(<OnTimeServicePage />);

    await waitFor(() => {
      expect(
        screen.getByText("onTimeService.fetchServiceInfo"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("transitModelService.fetchServicePatternStops"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("stopPerformanceService.mergeStops"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("headwayService.fetchFrequentServiceInfo"),
    ).toBeInTheDocument();
    expect(mockMergeStops).toHaveBeenCalled();
  });
});
