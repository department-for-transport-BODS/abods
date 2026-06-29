import {
  render,
  screen,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnTimeOperatorPage from "@/pages/on-time/[nocCode]";
import { Direction } from "../../../src/generated/graphql";
import type { FrequentServicePerformance } from "@/services/on-time/performance.service";

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

vi.mock("@/services/operator.service", () => ({
  operatorsService: {
    fetchOperator: vi.fn(),
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
    replace: vi.fn(),
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
    cleanup();
  });

  it("shows loading state initially", () => {
    mockFetchOverviewStats.mockImplementation(() => new Promise(() => {}));

    render(<OnTimeOperatorPage />);

    expect(screen.getByText("Loading on-time data...")).toBeInTheDocument();
  });

  it("renders the page heading and back link after data loads", async () => {
    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "All services" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /All operators/i }),
    ).toHaveAttribute("href", "/on-time");
  });

  it("renders a service row with a link to its detail page", async () => {
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

    render(<OnTimeOperatorPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "1: Demo Service" }),
      ).toHaveAttribute("href", "/on-time/ABCD/LINE1");
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

      await user.click(screen.getByRole("button", { name: /All directions/i }));
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

      await user.click(screen.getByRole("button", { name: /All directions/i }));
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

      await user.click(screen.getByRole("button", { name: /All directions/i }));
      await user.click(screen.getByRole("checkbox", { name: "Inbound" }));
      expect(
        screen.queryByRole("link", { name: "202: Night Bus" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Clear all" }));

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

      // "Average delay" column header should be visible initially
      expect(
        screen.getByRole("columnheader", { name: "Average delay" }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Display options" }));

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
        screen.queryByRole("columnheader", { name: "Average delay" }),
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

      // Uncheck "Average delay"
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
        screen.getByRole("columnheader", { name: "Average delay" }),
      ).toBeInTheDocument();
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
