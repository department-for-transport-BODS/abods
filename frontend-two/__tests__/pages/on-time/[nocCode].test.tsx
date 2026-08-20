import {
  render,
  screen,
  waitFor,
  cleanup,
  within,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnTimeOperatorPage from "@/pages/on-time/[nocCode]";
import { Direction } from "../../../src/generated/graphql";
import type { FrequentServicePerformance } from "@/services/on-time/performance.service";
import { Settings } from "luxon";
import boxStyles from "@/components/shared/Box/box.module.scss";

vi.mock("@/hooks/useAuth", () => ({
  useRequireAuth: vi.fn(),
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/components/layout/BaseLayout", () => ({
  BaseLayout: ({
    backLink,
    children,
  }: {
    backLink?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="base-layout">
      {backLink ? <div className="page__back-link">{backLink}</div> : null}
      <main className="page__main-wrapper">{children}</main>
    </div>
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

vi.mock("@/services/operator.service", () => ({
  operatorsService: {
    fetchOperators: vi.fn(),
    fetchOperator: vi.fn(),
    fetchAdminAreas: vi.fn(),
  },
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
const mockReplace = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/on-time/[nocCode]",
    asPath: "/on-time/ABCD",
    query: mockQuery,
    isReady: true,
    replace: mockReplace,
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { headwayService } from "@/services/on-time/headway.service";
import { onTimeService } from "@/services/on-time/on-time.service";
import { performanceService } from "@/services/on-time/performance.service";
import { operatorsService } from "@/services/operator.service";

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
const mockFetchOperators = vi.mocked(operatorsService.fetchOperators);
const mockFetchAdminAreas = vi.mocked(operatorsService.fetchAdminAreas);

const makeService = (
  overrides: Partial<FrequentServicePerformance> = {},
): FrequentServicePerformance => ({
  lineId: "L1",
  lineInfo: {
    serviceId: "S1",
    serviceName: "City Express",
    serviceNumber: "101",
  },
  direction: null,
  frequent: false,
  scheduledDepartures: 100,
  actualDepartures: 90,
  onTime: 70,
  late: 15,
  early: 5,
  total: 90,
  onTimeRatio: 0.778,
  lateRatio: 0.167,
  earlyRatio: 0.056,
  completedRatio: 0.9,
  averageDelay: 45,
  countDelayed: 20,
  onTimeInSeconds: 10,
  lateInSeconds: 120,
  earlyInSeconds: -30,
  ...overrides,
});
const mockFetchOperator = vi.mocked(operatorsService.fetchOperator);

describe("OnTimeOperatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Settings.now = () => new Date("2026-06-28T12:00:00Z").valueOf();
    mockQuery = { nocCode: "ABCD" };
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
    mockFetchOperators.mockResolvedValue([
      {
        operatorId: "OP1",
        nocCode: "ABCD",
        name: "Demo Operator",
        adminAreaIds: [],
      },
    ]);
    mockFetchAdminAreas.mockResolvedValue([]);

    mockFetchOverviewStats.mockResolvedValue({});
    mockFetchDelayFrequency.mockResolvedValue([]);
    mockFetchTimeSeries.mockResolvedValue([]);
    mockFetchTimeOfDay.mockResolvedValue([]);
    mockFetchDayOfWeek.mockResolvedValue([]);
    mockFetchServicePerformancePlain.mockResolvedValue([]);
    mockFetchServicePerformance.mockResolvedValue([]);
    mockFetchHeadwayTimeSeries.mockResolvedValue([]);
  });

  afterEach(() => {
    Settings.now = () => Date.now();
    cleanup();
  });

  it("shows loading state initially", () => {
    mockFetchOperator.mockImplementation(() => new Promise(() => {}));

    render(<OnTimeOperatorPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the page heading and back link after data loads", async () => {
    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "All services" }),
      ).toBeInTheDocument();
    });

    const backLink = screen.getByRole("link", { name: /All operators/i });

    expect(backLink).toHaveAttribute("href", "/on-time");
    expect(backLink.parentElement).toHaveClass("page__back-link");
  });

  it("uses the date range from the operator link", async () => {
    mockQuery = {
      nocCode: "ABCD",
      from: "2026-06-01",
      to: "2026-06-14",
    };

    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(mockFetchOverviewStats).toHaveBeenCalledWith(
        expect.objectContaining({
          fromTimestamp: expect.stringContaining("2026-06-01"),
          toTimestamp: expect.stringContaining("2026-06-15"),
        }),
      );
    });

      expect(mockFetchOverviewStats).toHaveBeenCalledTimes(1);
  });

  it("refreshes data when a custom date range is applied", async () => {
    const user = userEvent.setup();
    mockQuery = { nocCode: "ABCD", preset: "lastMonth" };
    render(<OnTimeOperatorPage />);

    await user.click(
      await screen.findByRole("button", { name: /May 2026/ }),
    );

    const [startDate, endDate] = screen.getAllByDisplayValue(/2026-05-/);
    fireEvent.change(startDate, { target: { value: "2026-06-10" } });
    fireEvent.change(endDate, { target: { value: "2026-06-12" } });
    await user.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => {
      expect(mockFetchOverviewStats).toHaveBeenCalledWith(
        expect.objectContaining({
          fromTimestamp: expect.stringContaining("2026-06-10"),
          toTimestamp: expect.stringContaining("2026-06-13"),
        }),
      );
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            from: "2026-06-10",
            to: "2026-06-12",
          }),
        }),
        undefined,
        { shallow: true },
      );
      expect(mockReplace.mock.calls[0][0].query.preset).toBeUndefined();
    });
  });

  it("shows loading while refreshing data after a custom range is applied", async () => {
    const user = userEvent.setup();
    render(<OnTimeOperatorPage />);

    await screen.findByRole("heading", { name: "All services" });
    mockFetchOverviewStats.mockImplementationOnce(
      () => new Promise(() => {}),
    );

    await user.click(screen.getByRole("button", { name: /Jun 2026/ }));
    const [startDate, endDate] = screen.getAllByDisplayValue(/2026-06-/);
    fireEvent.change(startDate, { target: { value: "2026-06-10" } });
    fireEvent.change(endDate, { target: { value: "2026-06-12" } });
    await user.click(screen.getByRole("button", { name: "Apply" }));

    const loadingMessage = await screen.findByText("Loading...");
    expect(loadingMessage.closest(".app-box")).toBeInTheDocument();
  });

  it("requests hourly timeline data for a range of five days or fewer", async () => {
    mockQuery = {
      nocCode: "ABCD",
      from: "2026-06-01",
      to: "2026-06-05",
    };

    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(mockFetchTimeSeries).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ granularity: "hour" }),
        }),
      );
    });
  });

  it("renders a service row with a link to its detail page", async () => {
    mockFetchServicePerformance.mockResolvedValue([
      makeService({
        lineId: "LINE1",
        direction: Direction.Inbound,
        lineInfo: {
          serviceId: "S1",
          serviceName: "Demo Service",
          serviceNumber: "1",
        },
      }),
    ]);

    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "1: Demo Service" }),
      ).toHaveAttribute(
        "href",
        "/on-time/ABCD/LINE1?direction=all",
      );
    });
  });

  it("preserves the selected direction in a service link", async () => {
    mockFetchServicePerformance.mockResolvedValue([
      makeService({
        lineId: "LINE1",
        direction: Direction.Inbound,
        lineInfo: {
          serviceId: "S1",
          serviceName: "Demo Service",
          serviceNumber: "1",
        },
      }),
    ]);

    render(<OnTimeOperatorPage />);

    const directionsInput = await screen.findByRole("textbox", {
      name: "Directions",
    });
    fireEvent.focus(directionsInput);
    fireEvent.click(screen.getByRole("checkbox", { name: "Inbound" }));

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "1: Demo Service" }),
      ).toHaveAttribute(
        "href",
        "/on-time/ABCD/LINE1?direction=Inbound",
      );
    });
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

    const user = userEvent.setup();
    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Distribution" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Timeline" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Time of day" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Day of week" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Distribution" }));

    expect(screen.getByTestId("delay-frequency-chart")).toBeInTheDocument();

    expect(screen.getByText("Delay Frequency: 2 items")).toBeInTheDocument();
  });

  it("shows the vehicle location no-data message inside the chart box", async () => {
    render(<OnTimeOperatorPage />);

    const message = await screen.findByText(
      "We have not received any vehicle location data for the time period and filters selected.",
    );

    expect(message.closest(`.${boxStyles.box}`)).not.toBeNull();
    expect(message.closest('[class*="noData"]')).not.toBeNull();
  });

  it("shows the service export button below the empty table message", async () => {
    render(<OnTimeOperatorPage />);

    const emptyMessage = await screen.findByText("No service data found");
    const exportButton = screen.getByRole("button", { name: "Export data" });

    expect(
      emptyMessage.compareDocumentPosition(exportButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("exports service data with hidden metric columns", async () => {
    mockFetchServicePerformance.mockResolvedValue([
      makeService({
        lineId: "LINE1",
        lineInfo: {
          serviceId: "S1",
          serviceName: "Demo Service",
          serviceNumber: "1",
        },
      }),
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

    render(<OnTimeOperatorPage />);

    await screen.findByRole("link", { name: "1: Demo Service" });

    await user.click(screen.getByRole("button", { name: "Export data" }));

    const blob = createObjectUrl.mock.calls[0][0] as Blob;
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });

    expect(csv.split("\r\n")[0]).toBe(
      "Frequent service,Service,Direction,Scheduled departures,Recorded departures,Recorded departures (percentage),Av. delay (seconds),On time,On time (percentage),On time (seconds),Late,Late (percentage),Late (seconds),Early,Early (percentage),Early (seconds)",
    );
    expect(csv.split("\r\n")[1]).toBe(
      ",Total:,-,100,90,90%,45,70,77.7%,10,15,16.7%,120,5,5.6%,-30",
    );
    expect(csv.split("\r\n")[2]).toBe(
      ",1: Demo Service,-,100,90,90%,45,70,77.7%,10,15,16.7%,120,5,5.6%,-30",
    );

    expect(anchorClick).toHaveBeenCalled();
    expect(downloadedFilename).toBe(
      "Service_Performance_ABCD_26-06-21_-_26-06-27.csv",
    );
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test-csv");
    anchorClick.mockRestore();
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
      expect(
        screen.getByRole("button", { name: "Distribution" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Distribution" }));

    expect(screen.getByText("Delay Frequency: 1 items")).toBeInTheDocument();

    const timeOfDayTab = screen.getByRole("button", { name: "Time of day" });
    await user.click(timeOfDayTab);

    expect(screen.getByText("Time of Day: 2 items")).toBeInTheDocument();

    const dayOfWeekTab = screen.getByRole("button", { name: "Day of week" });
    await user.click(dayOfWeekTab);

    expect(screen.getByText("Day of Week: 1 items")).toBeInTheDocument();
  });

  describe("service search filtering", () => {
    beforeEach(() => {
      mockFetchServicePerformance.mockResolvedValue([
        makeService({
          lineId: "L1",
          lineInfo: {
            serviceId: "S1",
            serviceNumber: "101",
            serviceName: "City Express",
          },
        }),
        makeService({
          lineId: "L2",
          lineInfo: {
            serviceId: "S2",
            serviceNumber: "202",
            serviceName: "Night Bus",
          },
        }),
      ]);
    });

    it("shows all services before any search term is entered", async () => {
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole("link", { name: "202: Night Bus" }),
      ).toBeInTheDocument();
    });

    it("filters services by service name", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.type(
        screen.getByRole("textbox", { name: "Search for a service" }),
        "City",
      );

      expect(
        screen.getByRole("link", { name: "101: City Express" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "202: Night Bus" }),
      ).not.toBeInTheDocument();
    });

    it("filters services by service number", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "202: Night Bus" }),
        ).toBeInTheDocument();
      });

      await user.type(
        screen.getByRole("textbox", { name: "Search for a service" }),
        "202",
      );

      expect(
        screen.queryByRole("link", { name: "101: City Express" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "202: Night Bus" }),
      ).toBeInTheDocument();
    });

    it("shows all services again when the search term is cleared", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByRole("textbox", {
        name: "Search for a service",
      });
      await user.type(searchInput, "City");
      expect(
        screen.queryByRole("link", { name: "202: Night Bus" }),
      ).not.toBeInTheDocument();

      await user.clear(searchInput);
      expect(
        screen.getByRole("link", { name: "101: City Express" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "202: Night Bus" }),
      ).toBeInTheDocument();
    });
  });

  describe("direction filtering", () => {
    beforeEach(() => {
      mockFetchServicePerformance.mockResolvedValue([
        makeService({
          lineId: "L1",
          lineInfo: {
            serviceId: "S1",
            serviceNumber: "101",
            serviceName: "City Express",
          },
          direction: Direction.Inbound,
        }),
        makeService({
          lineId: "L2",
          lineInfo: {
            serviceId: "S2",
            serviceNumber: "202",
            serviceName: "Night Bus",
          },
          direction: Direction.Outbound,
        }),
      ]);
    });

    it("shows all services (aggregated) when no direction filter is selected", async () => {
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole("link", { name: "202: Night Bus" }),
      ).toBeInTheDocument();
    });

    it("shows only inbound services when Inbound direction is selected", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      const directionsControl = screen.getByLabelText("Directions");
      await user.click(directionsControl);
      await user.click(screen.getByRole("checkbox", { name: "Inbound" }));

      expect(
        screen.getByRole("link", { name: "101: City Express" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "202: Night Bus" }),
      ).not.toBeInTheDocument();
    });

    it("shows only outbound services when Outbound direction is selected", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      const directionsControl = screen.getByLabelText("Directions");
      await user.click(directionsControl);
      await user.click(screen.getByRole("checkbox", { name: "Outbound" }));

      expect(
        screen.queryByRole("link", { name: "101: City Express" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "202: Night Bus" }),
      ).toBeInTheDocument();
    });

    it("shows all services again after clearing the direction filter", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      const directionsControl = screen.getByLabelText("Directions");
      await user.click(directionsControl);
      await user.click(screen.getByRole("checkbox", { name: "Inbound" }));
      expect(
        screen.queryByRole("link", { name: "202: Night Bus" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Show all" }));

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole("link", { name: "202: Night Bus" }),
      ).toBeInTheDocument();
    });
  });

  describe("display mode radio options", () => {
    beforeEach(() => {
      mockFetchServicePerformance.mockResolvedValue([
        makeService({
          lineId: "L1",
          lineInfo: {
            serviceId: "S1",
            serviceNumber: "101",
            serviceName: "City Express",
          },
          actualDepartures: 90,
          onTime: 70,
          onTimeRatio: 0.778,
          onTimeInSeconds: 10,
        }),
      ]);
    });

    it("defaults to percentage display mode", async () => {
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      expect(screen.getByRole("radio", { name: "Percentage" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Count" })).not.toBeChecked();
      expect(screen.getByRole("radio", { name: "Time" })).not.toBeChecked();
    });

    it("shows on-time values as percentages in default mode", async () => {
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      const serviceLink = screen.getByRole("link", {
        name: "101: City Express",
      });
      const row = serviceLink.closest("tr");
      expect(row).not.toBeNull();
      expect(
        within(row as HTMLTableRowElement).getByText("77.7%"),
      ).toBeInTheDocument();
    });

    it("shows on-time values as counts when Count mode is selected", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("radio", { name: "Count" }));

      const serviceLink = screen.getByRole("link", {
        name: "101: City Express",
      });
      const row = serviceLink.closest("tr");
      expect(row).not.toBeNull();
      expect(
        within(row as HTMLTableRowElement).getByText("70"),
      ).toBeInTheDocument();
      expect(
        within(row as HTMLTableRowElement).queryByText("77.7%"),
      ).not.toBeInTheDocument();
    });

    it("shows on-time values as time offsets when Time mode is selected", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("radio", { name: "Time" }));

      const serviceLink = screen.getByRole("link", {
        name: "101: City Express",
      });
      const row = serviceLink.closest("tr");
      expect(row).not.toBeNull();
      expect(
        within(row as HTMLTableRowElement).getByText("+00:10"),
      ).toBeInTheDocument();
      expect(
        within(row as HTMLTableRowElement).queryByText("77.7%"),
      ).not.toBeInTheDocument();
    });
  });

  describe("display options modal", () => {
    beforeEach(() => {
      mockFetchServicePerformance.mockResolvedValue([
        makeService({
          lineId: "L1",
          lineInfo: {
            serviceId: "S1",
            serviceNumber: "101",
            serviceName: "City Express",
          },
        }),
      ]);
    });

    it("opens the display options modal when the Display options button is clicked", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Display options" }));

      expect(
        screen.getByRole("heading", { name: "Display options" }),
      ).toBeInTheDocument();
    });

    it("closes the modal when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Display options" }));
      expect(
        screen.getByRole("heading", { name: "Display options" }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(
        screen.queryByRole("heading", { name: "Display options" }),
      ).not.toBeInTheDocument();
    });

    it("hides a column when it is unchecked in the modal and Update is clicked", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      // "Av. delay" column header should be visible initially
      expect(
        screen.getByRole("columnheader", { name: "Av. delay" }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Display options" }));

      expect(
        screen.getByRole("checkbox", { name: "Frequent service" }),
      ).toBeInTheDocument();

      const averageDelayCheckbox = screen.getByRole("checkbox", {
        name: "Average delay",
      });
      expect(averageDelayCheckbox).toBeChecked();
      await user.click(averageDelayCheckbox);
      expect(averageDelayCheckbox).not.toBeChecked();

      await user.click(screen.getByRole("button", { name: "Update" }));

      expect(
        screen.queryByRole("heading", { name: "Display options" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("columnheader", { name: "Av. delay" }),
      ).not.toBeInTheDocument();
    });

    it("restores all columns when Show all is clicked before applying", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Display options" }));

      // Uncheck "Av. delay"
      await user.click(screen.getByRole("checkbox", { name: "Average delay" }));
      expect(
        screen.getByRole("checkbox", { name: "Average delay" }),
      ).not.toBeChecked();

      // Click "Show all" to restore
      await user.click(screen.getByRole("button", { name: "Show all" }));
      expect(
        screen.getByRole("checkbox", { name: "Average delay" }),
      ).toBeChecked();
    });

    it("does not apply changes when Cancel is clicked after unchecking a column", async () => {
      const user = userEvent.setup();
      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Display options" }));
      await user.click(screen.getByRole("checkbox", { name: "Average delay" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Column should still be visible after cancelling
      expect(
        screen.getByRole("columnheader", { name: "Av. delay" }),
      ).toBeInTheDocument();
    });
  });

  describe("refine results panel", () => {
    it("keeps the panel open while applying an area filter", async () => {
      const user = userEvent.setup();
      mockFetchOperator.mockResolvedValue({
        operatorId: "OP1",
        nocCode: "ABCD",
        name: "Demo Operator",
        adminAreaIds: ["AA100"],
      });
      mockFetchOperators.mockResolvedValue([
        {
          operatorId: "OP1",
          nocCode: "ABCD",
          name: "Demo Operator",
          adminAreaIds: ["AA100"],
        },
      ]);
      mockFetchAdminAreas.mockResolvedValue([
        { id: "AA100", name: "Derbyshire", shape: "{}" },
        { id: "AA200", name: "Nottinghamshire", shape: "{}" },
      ]);
      mockFetchServicePerformance.mockResolvedValueOnce([
        makeService({
          lineInfo: {
            serviceId: "S1",
            serviceNumber: "101",
            serviceName: "City Express",
          },
        }),
      ]);
      mockFetchServicePerformance.mockResolvedValueOnce([]);

      render(<OnTimeOperatorPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: "101: City Express" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Refine results" }));
      const panel = screen.getByRole("dialog", {
        name: "Refine results",
      });
      const areasInput = within(panel).getByRole("textbox", { name: "Area" });

      await waitFor(() => {
        expect(areasInput).not.toBeDisabled();
      });

      await user.click(areasInput);
      await user.click(
        await within(panel).findByRole("checkbox", { name: "Nottinghamshire" }),
      );
      await user.click(screen.getByRole("button", { name: "Apply" }));

      await waitFor(() => {
        const lastCall =
          mockFetchServicePerformance.mock.calls[
            mockFetchServicePerformance.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.adminAreaIds).toEqual(["AA200"]);
      });

      expect(
        screen.queryByRole("dialog", { name: "Refine results" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Loading on-time data..."),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Area:")).toBeInTheDocument();
      expect(screen.getByText("Nottinghamshire")).toBeInTheDocument();
    });
  });

  it("redirects to operator-not-found when nocCode is inaccessible", async () => {
    mockFetchOperator.mockResolvedValue(null);

    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/on-time/operator-not-found");
    });

    expect(mockFetchOverviewStats).not.toHaveBeenCalled();
  });
});
