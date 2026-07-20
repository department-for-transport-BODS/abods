// TODO: The OnTimeServicePage and OnTimeOperatorPage share same components.
// A lot of the testing for the display options and filters have been captured
// in the OnTimeOperatorPage tests, so we will not repeat those here.

import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnTimeServicePage from "@/pages/on-time/[nocCode]/[lineId]";
import { Settings } from "luxon";

vi.mock("@/hooks/useAuth", () => ({
  useRequireAuth: vi.fn(),
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/components/layout/BaseLayout", () => ({
  BaseLayout: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="base-layout" data-title={title}>
      {children}
    </div>
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
    Settings.now = () => new Date("2026-06-28T12:00:00Z").valueOf();
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
    Settings.now = () => Date.now();
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

    expect(screen.getByTestId("base-layout")).toHaveAttribute(
      "data-title",
      "1 - Demo Service",
    );
    expect(screen.getByRole("link", { name: /All Services/i })).toHaveAttribute(
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

  it("exports stop data with an Angular-style filename", async () => {
    mockQuery = { nocCode: "FBSM", lineId: "4-PK1147727_10" };
    mockFetchStopPerformance.mockResolvedValue([
      {
        stopId: "STOP1",
        timingPoint: true,
        stopInfo: { stopName: "Example Stop" },
        direction: null,
        scheduledDepartures: 10,
        actualDepartures: 8,
        completedRatio: 0.8,
        averageScheduled: 120,
        averageActual: 130,
        averageDelay: 10,
        countDelayed: 8,
        onTime: 6,
        onTimeRatio: 0.75,
        onTimeInSeconds: 180,
        late: 1,
        lateRatio: 0.125,
        lateInSeconds: 60,
        early: 1,
        earlyRatio: 0.125,
        earlyInSeconds: 30,
      } as any,
    ]);
    const createObjectUrl = vi.fn().mockReturnValue("blob:test-csv");
    const revokeObjectUrl = vi.fn();
    let downloadedFilename = "";
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedFilename = this.download;
      });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl,
    });
    const user = userEvent.setup();

    render(<OnTimeServicePage />);

    await screen.findByText("Example Stop");
    await user.click(screen.getByRole("button", { name: "Export data" }));

    const blob = createObjectUrl.mock.calls[0][0] as Blob;
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });

    expect(csv.split("\r\n")[0]).toBe(
      "NAPTAN,Timing point,Name,Direction,Scheduled departures,Recorded departures,Recorded departures (percentage),Av. Scheduled Travel Time (seconds),Av. Actual Travel Time (seconds),Av. delay (seconds),On time,On time (percentage),On time (seconds),Late,Late (percentage),Late (seconds),Early,Early (percentage),Early (seconds)",
    );
    expect(csv.split("\r\n")[1]).toBe(
      ",,Total:,-,10,8,80%,120,130,10,6,75%,180,1,12.5%,60,1,12.5%,30",
    );
    expect(csv.split("\r\n")[2]).toBe(
      "STOP1,true,Example Stop,-,10,8,80%,120,130,10,6,75%,180,1,12.5%,60,1,12.5%,30",
    );

    expect(anchorClick).toHaveBeenCalled();
    expect(downloadedFilename).toBe(
      "Stop_Performance_4-PK1147727_10_26-06-21_-_26-06-27.csv",
    );
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test-csv");
    anchorClick.mockRestore();
  });
});
