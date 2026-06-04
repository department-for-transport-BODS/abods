import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
  within,
} from "@testing-library/react";
import LiveStatusPage from "@/pages/feed-monitoring/[nocCode]/index";
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

vi.mock("@/services/feed-monitoring/feed-monitoring.services", () => ({
  feedMonitoringService: {
    fetchFeedMonitoringList: vi.fn(),
    fetchOperatorLiveStatus: vi.fn(),
  },
}));

const mockRouterPush = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/feed-monitoring/[nocCode]",
    asPath: "/feed-monitoring/[nocCode]",
    query: { nocCode: "ALPH" },
    replace: vi.fn(),
    push: mockRouterPush,
  }),
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    return ({ label }: { label: string }) => (
      <div>
        <h3>{label}</h3>
      </div>
    );
  },
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

const operatorLiveStatusMockData_Alpha = {
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
      currentVehicles: 118,
      expectedVehicles: 125,
      last24Hours: [
        { actual: 112, expected: 120, timestamp: "2026-05-31T08:00:00Z" },
        { actual: 118, expected: 125, timestamp: "2026-05-31T09:00:00Z" },
        { actual: 120, expected: 127, timestamp: "2026-05-31T10:00:00Z" },
      ],
      last20Minutes: [
        { actual: 15, expected: 16, timestamp: "2026-05-31T10:40:00Z" },
        { actual: 16, expected: 16, timestamp: "2026-05-31T10:45:00Z" },
        { actual: 16, expected: 16, timestamp: "2026-05-31T10:50:00Z" },
      ],
    },
  },
};

const operatorLiveStatusMockData_Beta = {
  name: "Beta Coaches",
  nocCode: "BETA",
  operatorId: "op2",
  feedMonitoring: {
    feedStatus: false,
    availability: 87.3,
    lastOutage: "2026-05-31T09:10:00Z",
    unavailableSince: "2026-05-31T09:10:00Z",
    liveStats: {
      updateFrequency: 45,
      currentVehicles: 22,
      expectedVehicles: 30,
      last24Hours: [
        { actual: 18, expected: 24, timestamp: "2026-05-31T08:00:00Z" },
        { actual: 20, expected: 26, timestamp: "2026-05-31T09:00:00Z" },
        { actual: 22, expected: 30, timestamp: "2026-05-31T10:00:00Z" },
      ],
      last20Minutes: [
        { actual: 3, expected: 4, timestamp: "2026-05-31T10:40:00Z" },
        { actual: 4, expected: 5, timestamp: "2026-05-31T10:45:00Z" },
        { actual: 4, expected: 5, timestamp: "2026-05-31T10:50:00Z" },
      ],
    },
  },
};

const mockUseConfig = vi.mocked(useConfig);
const mockFetchFeedMonitoringList = vi.mocked(
  feedMonitoringService.fetchFeedMonitoringList,
);
const mockFetchOperatorLiveStatus = vi.mocked(
  feedMonitoringService.fetchOperatorLiveStatus,
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
  mockFetchOperatorLiveStatus.mockImplementation(() => new Promise(() => {}));

  render(<LiveStatusPage />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

it("Shows an error message when data fails to load", async () => {
  mockFetchFeedMonitoringList.mockRejectedValue(new Error("Network error"));
  mockFetchOperatorLiveStatus.mockRejectedValue(new Error("Network error"));

  render(<LiveStatusPage />);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(
        "There was a problem loading the live status data. Please try refreshing the page.",
      ),
    ).toBeInTheDocument();
  });
});

it("Shows the current date", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorLiveStatus.mockResolvedValue(
    operatorLiveStatusMockData_Alpha,
  );

  render(<LiveStatusPage />);

  const expectedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  await waitFor(() =>
    expect(screen.getByText(expectedDate)).toBeInTheDocument(),
  );
});

it("Shows correct options in operator dropdown", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorLiveStatus.mockResolvedValue(
    operatorLiveStatusMockData_Alpha,
  );

  render(<LiveStatusPage />);

  await waitFor(() =>
    expect(screen.getByText(/Alpha Buses \(ALPH\)/i)).toBeInTheDocument(),
  );

  fireEvent.click(
    screen.getByRole("button", { name: /Alpha Buses \(ALPH\)/i }),
  );

  expect(screen.getAllByText("Alpha Buses (ALPH)").length).toEqual(2); // One in the button, one in the dropdown
  expect(screen.getByText("Beta Coaches (BETA)")).toBeInTheDocument();
  expect(screen.getByText("Gamma Transit (GAMM)")).toBeInTheDocument();
});

it("Changes the page if new operator is selected using dropdown", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorLiveStatus.mockResolvedValue(
    operatorLiveStatusMockData_Alpha,
  );

  render(<LiveStatusPage />);

  await waitFor(() =>
    expect(screen.getByText(/Alpha Buses \(ALPH\)/i)).toBeInTheDocument(),
  );

  fireEvent.click(
    screen.getByRole("button", { name: /Alpha Buses \(ALPH\)/i }),
  );
  fireEvent.click(screen.getByText("Beta Coaches (BETA)"));

  expect(mockRouterPush).toHaveBeenCalledWith("/feed-monitoring/BETA");
});

it("Renders the 4 summary boxes with correct headers and data", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorLiveStatus.mockResolvedValue(
    operatorLiveStatusMockData_Alpha,
  );

  render(<LiveStatusPage />);

  await waitFor(() =>
    expect(screen.getByText("Feed status")).toBeInTheDocument(),
  );

  expect(screen.getByText("Feed status")).toBeInTheDocument();
  expect(screen.getByText("Current vehicles")).toBeInTheDocument();
  expect(screen.getByText("Expected vehicles")).toBeInTheDocument();
  expect(screen.getByText("Update frequency")).toBeInTheDocument();
  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText("118")).toBeInTheDocument();
  expect(screen.getByText("125")).toBeInTheDocument();
  expect(screen.getByText("15s")).toBeInTheDocument();
});

it("Renders warning message if feed is inactive", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorLiveStatus.mockResolvedValue(
    operatorLiveStatusMockData_Beta,
  );

  render(<LiveStatusPage />);

  await waitFor(() =>
    expect(screen.getByText(/Inactive/i)).toBeInTheDocument(),
  );
  expect(
    screen.getByText(
      /If the number of expected vehicles is zero and you were expecting vehicles/i,
    ),
  ).toBeInTheDocument();
});

it("Does not render warning message if feed is active", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorLiveStatus.mockResolvedValue(
    operatorLiveStatusMockData_Alpha,
  );

  render(<LiveStatusPage />);

  await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
  expect(
    screen.queryByText(
      /If the number of expected vehicles is zero and you were expecting vehicles/i,
    ),
  ).not.toBeInTheDocument();
});

it("Renders 2 graphs with data", async () => {
  mockFetchFeedMonitoringList.mockResolvedValue(feedMonitoringListMockData);
  mockFetchOperatorLiveStatus.mockResolvedValue(
    operatorLiveStatusMockData_Alpha,
  );

  render(<LiveStatusPage />);

  await waitFor(() =>
    expect(screen.getByText("Last 24 hours")).toBeInTheDocument(),
  );
  expect(screen.getByText("Last 20 minutes")).toBeInTheDocument();
});
