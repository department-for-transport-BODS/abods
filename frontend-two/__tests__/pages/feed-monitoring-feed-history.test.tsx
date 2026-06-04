import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
  within,
} from "@testing-library/react";
import FeedHistoryPage from "@/pages/feed-monitoring/[nocCode]/feed-history";
import { useConfig } from "@/contexts/ConfigContext";
import { feedMonitoringService } from "@/services/feed-monitoring/feed-monitoring.services";
import { DateTime } from "luxon";

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

vi.mock("@/services/feed-monitoring/feed-monitoring.services", () => ({
  feedMonitoringService: {
    fetchFeedMonitoringList: vi.fn(),
    fetchOperatorHistory: vi.fn(),
  },
}));

const mockRouterPush = vi.fn();
let routerQuery = {
  nocCode: "ALPH",
  date: DateTime.now().startOf("day").minus({ days: 1 }).toISODate(),
};

const mockRouter = {
  pathname: "/feed-monitoring",
  asPath: "/feed-monitoring",
  query: routerQuery,
  replace: vi.fn(),
  push: vi.fn((url: string) => {
    const [_, queryString] = url.split("?");
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const newDate = params.get("date");
      if (newDate) {
        routerQuery = { ...routerQuery, date: newDate };
        mockRouter.query = routerQuery;
      }
    }
    mockRouterPush(url);
    return Promise.resolve(true);
  }),
};

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => (props: any) => <div data-testid="historic-vehicle-stats" />,
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

const operatorHistoryMockData_Alpha_Today = {
  name: "Alpha Buses",
  nocCode: "ALPH",
  operatorId: "op1",
  feedMonitoring: {
    historicalStats: {
      updateFrequency: 15,
      availability: 0.9237,
    },
    vehicleStats: [
      { actual: 110, expected: 120, timestamp: "2026-05-31T08:00:00Z" },
      { actual: 115, expected: 121, timestamp: "2026-05-31T09:00:00Z" },
      { actual: 118, expected: 122, timestamp: "2026-05-31T10:00:00Z" },
      { actual: 117, expected: 120, timestamp: "2026-05-31T11:00:00Z" },
      { actual: 119, expected: 123, timestamp: "2026-05-31T12:00:00Z" },
    ],
  },
};

const mockUseConfig = vi.mocked(useConfig);
const mockFetchFeedMonitoringList = vi.mocked(
  feedMonitoringService.fetchFeedMonitoringList,
);
const mockFetchOperatorHistory = vi.mocked(
  feedMonitoringService.fetchOperatorHistory,
);

beforeEach(() => {
  vi.clearAllMocks();
  routerQuery = {
    nocCode: "ALPH",
    date: DateTime.now().startOf("day").minus({ days: 1 }).toISODate(),
  };
  mockRouter.query = routerQuery;

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
  mockFetchOperatorHistory.mockImplementation(() => new Promise(() => {}));

  render(<FeedHistoryPage />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

it("Shows an error message when data fails to load", async () => {
  mockFetchFeedMonitoringList.mockRejectedValue(new Error("Network error"));
  mockFetchOperatorHistory.mockRejectedValue(new Error("Network error"));

  render(<FeedHistoryPage />);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(
        "There was a problem loading the feed history data. Please try refreshing the page.",
      ),
    ).toBeInTheDocument();
  });
});

it("Renders yesterday's date by default", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue({} as any);

  const yesterday = DateTime.now().startOf("day").minus({ days: 1 });

  render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(
      screen.getByText(yesterday.toFormat("d MMMM yyyy")),
    ).toBeInTheDocument(),
  );
});

it("Renders the DateNavigation component with correct date range", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue({} as any);

  const yesterday = DateTime.now().startOf("day").minus({ days: 1 });
  const earliestDate = yesterday.minus({ months: 3 }).plus({ days: 1 });

  render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(
      screen.getByText(yesterday.toFormat("d MMMM yyyy")),
    ).toBeInTheDocument(),
  );

  const earliestDateButton = screen.getByRole("button", {
    name: earliestDate.toFormat("d MMMM"),
  });
  expect(earliestDateButton).toBeInTheDocument();

  const beforeEarliestDateButton = screen.queryByRole("button", {
    name: earliestDate.minus({ days: 1 }).toFormat("d MMMM"),
  });
  expect(beforeEarliestDateButton).not.toBeInTheDocument();

  const tomorrowButton = screen.queryByRole("button", {
    name: yesterday.plus({ days: 1 }).toFormat("d MMMM"),
  });
  expect(tomorrowButton).not.toBeInTheDocument();
});

it("Shows previous date navigation and disables the next button on the latest available date", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue({} as any);

  render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(screen.getByText("‹ Previous")).toBeInTheDocument(),
  );

  const previousLink = screen.getByRole("link", { name: /‹ Previous/i });
  expect(previousLink).toHaveAttribute(
    "href",
    expect.stringContaining("/feed-monitoring/ALPH/feed-history?date="),
  );

  const nextSpan = screen.getByText("Next ›").closest("span");
  expect(nextSpan).toBeInTheDocument();
  expect(nextSpan).toHaveClass("govuk-link--disabled");
});

it("Displays the DateNavigation active date and pushes a new URL when a different date is selected", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue({} as any);

  const yesterday = DateTime.now().startOf("day").minus({ days: 1 });
  const lastMonth = yesterday.minus({ days: 30 });

  const { container } = render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(
      screen.getByText(yesterday.toFormat("d MMMM yyyy")),
    ).toBeInTheDocument(),
  );
  expect(container.querySelector(".datenav__item--active")).toBeInTheDocument();

  const lastMonthButton = screen.getByRole("button", {
    name: lastMonth.toFormat("d MMMM"),
  });
  fireEvent.click(lastMonthButton);

  expect(mockRouterPush).toHaveBeenCalledWith(
    `/feed-monitoring/ALPH/feed-history?date=${lastMonth.toISODate()}`,
  );
});

it("Shows next date navigation and disables the previous button on the earliest available date", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue({} as any);

  const yesterday = DateTime.now().startOf("day").minus({ days: 1 });
  const earliestDate = yesterday.minus({ months: 3 }).plus({ days: 1 });

  render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(
      screen.getByText(yesterday.toFormat("d MMMM yyyy")),
    ).toBeInTheDocument(),
  );

  const earliestDateButton = screen.getByRole("button", {
    name: earliestDate.toFormat("d MMMM"),
  });
  expect(earliestDateButton).toBeInTheDocument();
  fireEvent.click(earliestDateButton);

  expect(mockRouterPush).toHaveBeenCalledWith(
    `/feed-monitoring/ALPH/feed-history?date=${earliestDate.toISODate()}`,
  );

  render(<FeedHistoryPage />);

  await waitFor(() => expect(screen.getByText("Next ›")).toBeInTheDocument());

  const nextLink = screen.getByRole("link", { name: /Next ›/i });
  expect(nextLink).toHaveAttribute(
    "href",
    expect.stringContaining("/feed-monitoring/ALPH/feed-history?date="),
  );

  const previousLinks = screen.getAllByRole("link", { name: /‹ Previous/i });
  expect(
    previousLinks.some((link) =>
      link
        .getAttribute("href")
        ?.includes(
          `/feed-monitoring/ALPH/feed-history?date=${earliestDate.minus({ days: 1 }).toISODate()}`,
        ),
    ),
  ).toBe(true);
});

it("Shows operator dropdown options and navigates when a new operator is selected", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue({} as any);

  render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(screen.getByText("Alpha Buses (ALPH)")).toBeInTheDocument(),
  );

  const dropdownButton = screen.getByText(/Alpha Buses \(ALPH\)/i);
  fireEvent.click(dropdownButton);

  expect(screen.getAllByText("Alpha Buses (ALPH)").length).toEqual(2); // One in the button, one in the dropdown
  expect(screen.getByText("Beta Coaches (BETA)")).toBeInTheDocument();
  expect(screen.getByText("Gamma Transit (GAMM)")).toBeInTheDocument();

  fireEvent.click(screen.getByText("Beta Coaches (BETA)"));
  const yesterday = DateTime.now().startOf("day").minus({ days: 1 });
  expect(mockRouterPush).toHaveBeenCalledWith(
    `/feed-monitoring/BETA/feed-history?date=${yesterday.toISODate()}`,
  );
});

it("Renders a no data message when historical vehicle stats are empty", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue({
    ...operatorHistoryMockData_Alpha_Today,
    feedMonitoring: {
      ...operatorHistoryMockData_Alpha_Today.feedMonitoring,
      vehicleStats: [],
    },
  });

  render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(
      screen.getByText("No data found for the date selected."),
    ).toBeInTheDocument(),
  );
});

it("Renders summary stats with the correct headers and data", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorHistory.mockResolvedValue(
    operatorHistoryMockData_Alpha_Today,
  );

  render(<FeedHistoryPage />);

  await waitFor(() =>
    expect(screen.getByText("Feed availability")).toBeInTheDocument(),
  );
  expect(screen.getByText("Average update frequency")).toBeInTheDocument();

  await waitFor(() => expect(screen.getByText("92.37%")).toBeInTheDocument());
  expect(screen.getByText("15s")).toBeInTheDocument();
});
