import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
  within,
} from "@testing-library/react";
import { useConfig } from "@/contexts/ConfigContext";
import { onTimeService } from "@/services/on-time/on-time.service";
import { operatorsService } from "@/services/operator.service";
import { distanceService } from "@/services/distances/distance.services";
import OnTimeIndexPage from "@/pages/on-time";
import { DateTime } from "luxon";

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

vi.mock("@/contexts/HelpdeskContext", () => ({
  useHelpdesk: vi.fn().mockReturnValue({
    isOpen: false,
    data: null,
    open: vi.fn(),
    close: vi.fn(),
    loadData: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/services/on-time/on-time.service", () => ({
  onTimeService: {
    fetchOperatorPerformanceList: vi.fn(),
    fetchOnTimeStats: vi.fn(),
  },
}));

vi.mock("@/services/operator.service", () => ({
  operatorsService: {
    fetchAdminAreas: vi.fn(),
  },
}));

vi.mock("@/services/distances/distance.services", () => ({
  distanceService: {
    fetchAdminOrg: vi.fn(),
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/on-time",
    asPath: "/on-time",
    replace: vi.fn(),
  }),
}));

vi.mock("kainossoftwareltd-govuk-react-kainos", () => ({
  Select: ({
    items,
    onChange,
    name,
  }: {
    items: any[];
    onChange: (e: any) => void;
    name: string;
  }) => (
    <select name={name} onChange={onChange} data-testid={`select-${name}`}>
      {items.map((item) => (
        <option key={item.value} value={item.value} selected={item.selected}>
          {item.text}
        </option>
      ))}
    </select>
  ),
  // TODO: This will need to change once we implement the table properly
  Table: ({ head, rows }: any) => (
    <table>
      <thead>
        <tr>
          {head.map((h: any, i: number) => (
            <th key={i}>{h.content}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row: any[], i: number) => (
          <tr key={i}>
            {row.map((cell: any, j: number) => (
              <td key={j}>{cell?.content || cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

// Mock data
const mockOperatorData = [
  {
    name: "First Operator",
    nocCode: "ABCD",
    operatorId: "ABCD",
    onTime: 10,
    early: 1,
    late: 2,
    total: 13,
    onTimeRatio: 0.76,
    earlyRatio: 0.08,
    lateRatio: 0.15,
    completedRatio: 0,
    averageDelay: 1.5,
  },
];

const mockUseConfig = vi.mocked(useConfig);
const mockFetchOperatorPerformanceList = vi.mocked(
  onTimeService.fetchOperatorPerformanceList,
);
const mockFetchOnTimeStats = vi.mocked(onTimeService.fetchOnTimeStats);
const mockFetchAdminAreas = vi.mocked(operatorsService.fetchAdminAreas);
const mockFetchAdminOrg = vi.mocked(distanceService.fetchAdminOrg);

describe("OnTimeIndexPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConfig.mockReturnValue({
      config: { apiUrl: "http://test-api" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);
    mockFetchOnTimeStats.mockResolvedValue({
      early: 0,
      onTime: 0,
      late: 0,
      completed: 0,
      scheduled: 0,
      incomplete: "0",
      averageDelay: null,
      noData: 0,
    });
    mockFetchAdminAreas.mockResolvedValue([
      { id: "AA100", name: "Derbyshire", shape: "{}" },
      { id: "AA200", name: "Nottinghamshire", shape: "{}" },
    ]);
    mockFetchAdminOrg.mockResolvedValue([
      { adminAreaId: 100, adminName: "Derbyshire" },
      { adminAreaId: 200, adminName: "Nottinghamshire" },
    ] as Awaited<ReturnType<typeof distanceService.fetchAdminOrg>>);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state initially", () => {
    mockFetchOperatorPerformanceList.mockImplementation(
      () => new Promise(() => {}),
    );
    mockFetchOnTimeStats.mockImplementation(() => new Promise(() => {}));

    render(<OnTimeIndexPage />);

    expect(screen.getByText("Loading on-time data...")).toBeInTheDocument();
  });

  describe("Filter defaults", () => {
    it("renders date preset selector with Last 7 days option", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue([]);

      render(<OnTimeIndexPage />);

      await waitFor(() => {
        expect(screen.getByText("Last 7 days")).toBeInTheDocument();
      });
    });

    it("defaults match type to 'evidenced'", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue([]);

      render(<OnTimeIndexPage />);

      await waitFor(() => {
        expect(screen.getByRole("radio", { name: "Evidenced" })).toBeChecked();
      });
    });

    it("defaults stop type to 'timing-points'", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue([]);

      render(<OnTimeIndexPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("radio", { name: "Timing points" }),
        ).toBeChecked();
      });
    });

    it("defaults to no active filters from refine results", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);

      render(<OnTimeIndexPage />);

      await waitFor(() => {
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.matchType).toBe("evidenced");
        expect(lastCall.filters.timingPointsOnly).toBe(true);
      });
    });
  });

  describe("Date selection", () => {
    it("defaults to 'Last 7 days' and shows correct date range", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);

      const today = DateTime.local().startOf("day");
      const from = today.minus({ days: 7 });
      const expectedButtonText = `${from.toFormat("dd MMM yyyy")} - ${today.minus({ days: 1 }).toFormat("dd MMM yyyy")}`;

      await waitFor(() => {
        expect(screen.getByText(expectedButtonText)).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.fromTimestamp).toContain(from.toFormat("yyyy-MM-dd"));
        expect(lastCall.toTimestamp).toContain(today.toFormat("yyyy-MM-dd"));
      });
    });

    it("'Last 28 days' preset shows correct date range and passes correct timestamps", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      const today = DateTime.local().startOf("day");
      const from = today.minus({ days: 28 });
      const expectedButtonText = `${from.toFormat("dd MMM yyyy")} - ${today.minus({ days: 1 }).toFormat("dd MMM yyyy")}`;

      fireEvent.change(screen.getByDisplayValue("Last 7 days"), {
        target: { value: "Last 28 days" },
      });

      await waitFor(() => {
        expect(screen.getByText(expectedButtonText)).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.fromTimestamp).toContain(from.toFormat("yyyy-MM-dd"));
        expect(lastCall.toTimestamp).toContain(today.toFormat("yyyy-MM-dd"));
      });
    });

    it("'Last month' preset shows correct date range and passes correct timestamps", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      const today = DateTime.local().startOf("day");
      const lastMonth = today.minus({ months: 1 });
      const from = lastMonth.startOf("month");
      const displayEnd = lastMonth.endOf("month").startOf("day");
      const toTimestampDate = from.plus({ months: 1 });
      const expectedButtonText = `${from.toFormat("dd MMM yyyy")} - ${displayEnd.toFormat("dd MMM yyyy")}`;

      fireEvent.change(screen.getByDisplayValue("Last 7 days"), {
        target: { value: "Last month" },
      });

      await waitFor(() => {
        expect(screen.getByText(expectedButtonText)).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.fromTimestamp).toContain(from.toFormat("yyyy-MM-dd"));
        expect(lastCall.toTimestamp).toContain(
          toTimestampDate.toFormat("yyyy-MM-dd"),
        );
      });
    });

    it("'Month to date' preset shows correct date range and passes correct timestamps", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      const today = DateTime.local().startOf("day");
      const from = today.startOf("month");
      // to = today + 1 day (exclusive), so DateRangeSelect displays today as the end
      const expectedButtonText = `${from.toFormat("dd MMM yyyy")} - ${today.toFormat("dd MMM yyyy")}`;

      fireEvent.change(screen.getByDisplayValue("Last 7 days"), {
        target: { value: "Month to date" },
      });

      await waitFor(() => {
        expect(screen.getByText(expectedButtonText)).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.fromTimestamp).toContain(from.toFormat("yyyy-MM-dd"));
        expect(lastCall.toTimestamp).toContain(
          today.plus({ days: 1 }).toFormat("yyyy-MM-dd"),
        );
      });
    });
  });

  describe("Match type selection", () => {
    it("fetches with 'evidenced' when evidenced is selected", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);

      render(<OnTimeIndexPage />);

      await waitFor(() => {
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.matchType).toBe("evidenced");
      });
    });

    it("fetches with 'estimated' when estimated is selected", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);

      render(<OnTimeIndexPage />);

      const estimatedRadio = await screen.findByRole("radio", {
        name: "Estimated",
      });
      fireEvent.click(estimatedRadio);

      await waitFor(() => {
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.matchType).toBe("estimated");
      });
    });
  });

  describe("Stop type selection", () => {
    it("fetches with timingPointsOnly true when timing points is selected", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);

      render(<OnTimeIndexPage />);

      await waitFor(() => {
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              timingPointsOnly: true,
            }),
          }),
        );
      });
    });

    it("fetches with timingPointsOnly false when all stops is selected", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);

      render(<OnTimeIndexPage />);

      const allStopsRadio = await screen.findByRole("radio", {
        name: "All stops",
      });
      fireEvent.click(allStopsRadio);

      await waitFor(() => {
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              timingPointsOnly: false,
            }),
          }),
        );
      });
    });
  });

  describe("Refine results panel", () => {
    const openRefinePanel = () => {
      fireEvent.click(screen.getByText("Refine results"));
    };

    const filterChips = () =>
      document.querySelector(".filterChipsContainer") as HTMLElement;

    const applyFilters = () => {
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    };

    it("does not show the area filter", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      openRefinePanel();
      const panel = screen
        .getByRole("heading", { name: "Refine results" })
        .closest("div.refine-results-panel") as HTMLElement;

      expect(
        within(panel).queryByRole("textbox", { name: "Area" }),
      ).not.toBeInTheDocument();
    });

    it("day of week filter: unchecking Saturday shows a filter chip", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      openRefinePanel();
      fireEvent.click(screen.getByRole("checkbox", { name: "Sat" }));
      applyFilters();

      await waitFor(() => {
        expect(
          within(filterChips()).getByText("Day of the week:"),
        ).toBeInTheDocument();
        expect(screen.getByText("First Operator")).toBeInTheDocument();
        expect(
          screen.queryByRole("dialog", { name: "Refine results" }),
        ).not.toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.dayOfWeekFlags).toEqual(
          expect.objectContaining({ saturday: false }),
        );
      });
    });

    it("day of week filter: selecting only weekdays shows 'Weekdays' chip", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      openRefinePanel();
      fireEvent.click(screen.getByRole("checkbox", { name: "Sat" }));
      fireEvent.click(screen.getByRole("checkbox", { name: "Sun" }));
      applyFilters();

      await waitFor(() => {
        expect(
          within(filterChips()).getByText("Day of the week:"),
        ).toBeInTheDocument();
        expect(within(filterChips()).getByText("Weekdays")).toBeInTheDocument();
        expect(screen.getByText("First Operator")).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.dayOfWeekFlags).toEqual(
          expect.objectContaining({ saturday: false, sunday: false }),
        );
      });
    });

    it("time range filter: changing start time shows a time range filter chip", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      openRefinePanel();
      const panel = screen
        .getByRole("heading", { name: "Refine results" })
        .closest("div.refine-results-panel") as HTMLElement;
      fireEvent.change(
        within(panel).getByRole("spinbutton", { name: "Start time" }),
        { target: { value: "8" } },
      );
      fireEvent.blur(
        within(panel).getByRole("spinbutton", { name: "Start time" }),
      );
      applyFilters();

      await waitFor(() => {
        expect(
          within(filterChips()).getByText("Time range:"),
        ).toBeInTheDocument();
        expect(
          within(filterChips()).getByText("08:00 - 23:59"),
        ).toBeInTheDocument();
        expect(screen.getByText("First Operator")).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.startTime).toBe("08:00");
      });
    });

    it("time range filter: changing end time shows a time range filter chip", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      openRefinePanel();
      const panel = screen
        .getByRole("heading", { name: "Refine results" })
        .closest("div.refine-results-panel") as HTMLElement;
      fireEvent.change(
        within(panel).getByRole("spinbutton", { name: "End time" }),
        { target: { value: "18" } },
      );
      fireEvent.blur(
        within(panel).getByRole("spinbutton", { name: "End time" }),
      );
      applyFilters();

      await waitFor(() => {
        expect(
          within(filterChips()).getByText("Time range:"),
        ).toBeInTheDocument();
        expect(
          within(filterChips()).getByText("00:00 - 18:59"),
        ).toBeInTheDocument();
        expect(screen.getByText("First Operator")).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.endTime).toBe("18:59");
      });
    });

    it("maximum early filter: selecting a delay limit shows a filter chip", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      openRefinePanel();
      fireEvent.change(screen.getByLabelText("Maximum early"), {
        target: { value: "10" },
      });
      applyFilters();

      await waitFor(() => {
        expect(
          within(filterChips()).getByText("Maximum early:"),
        ).toBeInTheDocument();
        expect(
          within(filterChips()).getByText("10 minutes"),
        ).toBeInTheDocument();
        expect(screen.getByText("First Operator")).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.minDelay).toBe(-10);
      });
    });

    it("maximum late filter: selecting a delay limit shows a filter chip", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      openRefinePanel();
      fireEvent.change(screen.getByLabelText("Maximum late"), {
        target: { value: "20" },
      });
      applyFilters();

      await waitFor(() => {
        expect(
          within(filterChips()).getByText("Maximum late:"),
        ).toBeInTheDocument();
        expect(
          within(filterChips()).getByText("20 minutes"),
        ).toBeInTheDocument();
        expect(screen.getByText("First Operator")).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.maxDelay).toBe(20);
      });
    });

    it("resetting filters removes all filter chips", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue(mockOperatorData);
      render(<OnTimeIndexPage />);
      await waitFor(() =>
        expect(mockFetchOperatorPerformanceList).toHaveBeenCalled(),
      );

      // Apply a filter first
      openRefinePanel();
      fireEvent.click(screen.getByRole("checkbox", { name: "Sat" }));
      applyFilters();

      await waitFor(() => {
        expect(
          within(filterChips()).getByText("Day of the week:"),
        ).toBeInTheDocument();
      });

      openRefinePanel();
      fireEvent.click(screen.getByText("Reset to defaults"));

      await waitFor(() => {
        expect(
          within(filterChips()).queryByText("Day of the week:"),
        ).not.toBeInTheDocument();
        expect(screen.getByText("First Operator")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Refine results" }),
        ).toBeInTheDocument();
        const lastCall =
          mockFetchOperatorPerformanceList.mock.calls[
            mockFetchOperatorPerformanceList.mock.calls.length - 1
          ][0];
        expect(lastCall.filters.dayOfWeekFlags).toBeUndefined();
      });
    });
  });

  describe("Error handling", () => {
    it("shows vehicle location no-data message", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue([]);

      render(<OnTimeIndexPage />);

      await waitFor(() => {
        expect(
          screen.getAllByText(
            "We have not received any vehicle location data for the time period and filters selected.",
          ).length,
        ).toBeGreaterThan(0);
      });
    });

    it("shows timetable no-data message", async () => {
      mockFetchOperatorPerformanceList.mockResolvedValue([]);

      render(<OnTimeIndexPage />);

      fireEvent.click(await screen.findByText("Estimated"));

      await waitFor(() => {
        expect(
          screen.getAllByText(
            "We have not found any timetable data for the time period and filters selected.",
          ).length,
        ).toBeGreaterThan(0);
      });
    });
  });
});
