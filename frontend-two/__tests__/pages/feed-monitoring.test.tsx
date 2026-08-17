import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
  within,
} from "@testing-library/react";
import FeedMonitoringPage from "@/pages/feed-monitoring";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";

// Setup mocks
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

vi.mock("@/services/feed-monitoring/feed-monitoring.services", () => ({
  feedMonitoringService: {
    fetchFeedMonitoringList: vi.fn(),
    fetchOperatorSparklines: vi.fn(),
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/feed-monitoring",
    asPath: "/feed-monitoring",
    replace: vi.fn(),
  }),
}));

// Mock data
const feedMonitoringListMockData = [
  {
    name: "Alpha Buses",
    nocCode: "ALPH",
    operatorId: "op1",
    feedMonitoring: {
      feedStatus: true,
      availability: 99.5,
      lastOutage: "2026-05-28T10:00:00Z",
      unavailableSince: null,
      liveStats: {
        updateFrequency: 15,
      },
    },
  },
  {
    name: "Beta Coaches",
    nocCode: "BETA",
    operatorId: "op2",
    feedMonitoring: {
      feedStatus: false,
      availability: 85.0,
      lastOutage: "2026-05-27T09:30:00Z",
      unavailableSince: "2026-05-27T09:30:00Z",
      liveStats: {
        updateFrequency: 30,
      },
    },
  },
  {
    name: "Gamma Transit",
    nocCode: "GAMM",
    operatorId: "op3",
    feedMonitoring: {
      feedStatus: true,
      availability: 97.2,
      lastOutage: null,
      unavailableSince: null,
      liveStats: {
        updateFrequency: 10,
      },
    },
  },
];

const vehicleCountMockData = [
  {
    operatorId: "op1",
    last24Hours: [
      { actual: 10, expected: 12, timestamp: "2026-05-28T10:00:00Z" },
      { actual: 11, expected: 12, timestamp: "2026-05-28T11:00:00Z" },
    ],
  },
  {
    operatorId: "op2",
    last24Hours: [
      { actual: 0, expected: 8, timestamp: "2026-05-28T10:00:00Z" },
      { actual: 0, expected: 8, timestamp: "2026-05-28T11:00:00Z" },
    ],
  },
  {
    operatorId: "op3",
    last24Hours: [
      { actual: 9, expected: 10, timestamp: "2026-05-28T10:00:00Z" },
      { actual: 10, expected: 10, timestamp: "2026-05-28T11:00:00Z" },
    ],
  },
];

const mockUseConfig = vi.mocked(useConfig);
const mockFetchFeedMonitoringList = vi.mocked(
  feedMonitoringService.fetchFeedMonitoringList,
);
const mockFetchOperatorSparklines = vi.mocked(
  feedMonitoringService.fetchOperatorSparklines,
);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseConfig.mockReturnValue({
    config: { apiUrl: "http://test-api" },
    isLoading: false,
    error: null,
  } as ReturnType<typeof useConfig>);
});

afterEach(() => {
  cleanup();
});

// Test cases
it("Shows loading state whilst waiting for data", async () => {
  mockFetchFeedMonitoringList.mockImplementation(() => new Promise(() => {}));
  mockFetchOperatorSparklines.mockImplementation(() => new Promise(() => {}));

  render(<FeedMonitoringPage />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

it("Shows an error message when data fails to load", async () => {
  mockFetchFeedMonitoringList.mockRejectedValue(new Error("Network error"));
  mockFetchOperatorSparklines.mockResolvedValue([]);

  render(<FeedMonitoringPage />);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(
        "There was a problem loading the feed monitoring data. Please try refreshing the page.",
      ),
    ).toBeInTheDocument();
  });
});

it("Renders inactive feeds tables with correct headers", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorSparklines.mockResolvedValue(vehicleCountMockData);

  render(<FeedMonitoringPage />);

  await waitFor(() => {
    const tables = screen.getAllByRole("table");
    expect(
      within(tables[0]).getByRole("columnheader", { name: "NOC" }),
    ).toBeInTheDocument();
    expect(
      within(tables[0]).getByRole("columnheader", { name: "Operator" }),
    ).toBeInTheDocument();
    expect(
      within(tables[0]).getByRole("columnheader", { name: "Feed availability" }),
    ).toBeInTheDocument();
    expect(
      within(tables[0]).getByRole("columnheader", { name: "Update frequency" }),
    ).toBeInTheDocument();
    expect(
      within(tables[0]).getByRole("columnheader", { name: "Unavailable since" }),
    ).toBeInTheDocument();
  });
});

it("Renders active feeds tables with correct headers", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorSparklines.mockResolvedValue(vehicleCountMockData);

  render(<FeedMonitoringPage />);

  await waitFor(() => {
    const tables = screen.getAllByRole("table");
    expect(
      within(tables[1]).getByRole("columnheader", { name: "NOC" }),
    ).toBeInTheDocument();
    expect(
      within(tables[1]).getByRole("columnheader", { name: "Operator" }),
    ).toBeInTheDocument();
    expect(
      within(tables[1]).getByRole("columnheader", { name: "Feed availability" }),
    ).toBeInTheDocument();
    expect(
      within(tables[1]).getByRole("columnheader", { name: "Update frequency" }),
    ).toBeInTheDocument();
    expect(
      within(tables[1]).getByRole("columnheader", { name: "Last outage" }),
    ).toBeInTheDocument();
  });
});

it("Splits the data into two tables", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorSparklines.mockResolvedValue(vehicleCountMockData);

  render(<FeedMonitoringPage />);

  await waitFor(() => {
    const rows = screen.getAllByRole("row");

    // Check inactive table rows
    const inactiveRows = rows.slice(1, 2); // First table has 1 data row
    expect(within(inactiveRows[0]).getByText("BETA")).toBeInTheDocument();
    expect(
      within(inactiveRows[0]).getByText("Beta Coaches"),
    ).toBeInTheDocument();

    // Check active table rows
    const activeRows = rows.slice(3); // Second table has 2 data rows
    expect(within(activeRows[0]).getByText("ALPH")).toBeInTheDocument();
    expect(within(activeRows[0]).getByText("Alpha Buses")).toBeInTheDocument();
    expect(within(activeRows[1]).getByText("GAMM")).toBeInTheDocument();
    expect(
      within(activeRows[1]).getByText("Gamma Transit"),
    ).toBeInTheDocument();
  });
});

it("Filters tables based on operator search", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorSparklines.mockResolvedValue(vehicleCountMockData);

  render(<FeedMonitoringPage />);

  await waitFor(() => {
    const searchInput = screen.getByLabelText("Search for an operator");
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "Alpha" } });

    const rows = screen.getAllByRole("row");

    // Check inactive table rows - should be empty
    expect(screen.queryByText("BETA")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta Coaches")).not.toBeInTheDocument();

    // Check active table rows - should only show Alpha Buses
    expect(screen.queryByText("ALPH")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Buses")).toBeInTheDocument();

    expect(screen.queryByText("GAMM")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma Transit")).not.toBeInTheDocument();
  });
});
