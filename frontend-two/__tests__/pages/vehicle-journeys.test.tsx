import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { SWRConfig } from "swr";
import VehicleJourneysPage from "@/pages/vehicle-journeys";
import { OtpEnum } from "@/src/generated/graphql";

const { mockRouter } = vi.hoisted(() => ({
  mockRouter: {
    pathname: "/vehicle-journeys",
    asPath: "/vehicle-journeys",
    isReady: true,
    query: {} as Record<string, string>,
    replace: vi.fn(),
  },
}));

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

vi.mock("@/components/vehicle-journeys/VehicleJourneyMap", () => ({
  VehicleJourneyMap: () => <div data-testid="vehicle-journey-map" />,
}));

vi.mock("@/services/vehicle-journeys/vehicle-journeys.service", () => ({
  vehicleJourneysService: {
    fetchOperators: vi.fn(),
    fetchLines: vi.fn(),
    fetchDayJourneys: vi.fn(),
    fetchJourney: vi.fn(),
    fetchServicePatternDistanceGeom: vi.fn(),
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

import { useConfig } from "@/contexts/ConfigContext";
import { vehicleJourneysService } from "@/services/vehicle-journeys/vehicle-journeys.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchOperators = vi.mocked(vehicleJourneysService.fetchOperators);
const mockFetchLines = vi.mocked(vehicleJourneysService.fetchLines);
const mockFetchDayJourneys = vi.mocked(vehicleJourneysService.fetchDayJourneys);
const mockFetchJourney = vi.mocked(vehicleJourneysService.fetchJourney);
const mockFetchServicePatternDistanceGeom = vi.mocked(
  vehicleJourneysService.fetchServicePatternDistanceGeom,
);

const operator = {
  name: "Best Buses",
  nocCode: "BBUS",
  operatorId: "OP1",
  adminAreaIds: [],
};

const service = {
  id: "L1",
  name: "Town Centre",
  number: "12",
  adminAreaIds: [],
};

const journey = {
  groupId: "G1",
  startTime: "2026-07-13T10:30:00+01:00",
  serviceName: "Town Centre",
  serviceNumber: "12",
  operatorName: "Best Buses",
  operatorNoc: "BBUS",
  directionRef: "outbound",
  isCancelled: false,
  vehicleJourneyId: 101,
};

const journeyInfo = {
  stops: [
    {
      estimatedDepartureUtc: null,
      actualDepartureUtc: "2026-07-13T09:31:00Z",
      scheduledDepartureUtc: "2026-07-13T09:30:00Z",
      latitude: 51.5,
      longitude: -0.12,
      stopIndex: 1,
      stopName: "High Street",
      stopId: 1,
      isTimingPoint: true,
      otp: OtpEnum.OnTime,
      directionRef: "outbound",
      incompleteReason: 0,
      setDown: false,
    },
  ],
  avls: [
    {
      recordedAtTimeUtc: "2026-07-13T09:31:00Z",
      latitude: 51.5,
      longitude: -0.12,
      vehicleRef: "BUS-1",
      directionRef: "outbound",
    },
  ],
};

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <VehicleJourneysPage />
    </SWRConfig>,
  );

describe("VehicleJourneysPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.pathname = "/vehicle-journeys";
    mockRouter.asPath = "/vehicle-journeys";
    mockRouter.isReady = true;
    mockRouter.query = {};
    mockUseConfig.mockReturnValue({
      config: {
        apiUrl: "http://test-api",
        bodsBaseUrl: "",
        envName: "test",
        analyticsId: "",
        mapboxToken: "test-token",
        mapboxStyle: "mapbox://styles/test/default",
        mapboxSatelliteStyle: "mapbox://styles/test/satellite",
        vehicleJourneys: {
          validDateRange: { offsetISO: "P1D", durationISO: "P6M" },
        },
        otp: { early: 60, late: 359 },
        defaultCookiePolicy: {
          analyticsEnabled: false,
          version: 1,
          userSubmitted: false,
        },
        freshdesk: { apiUrl: "", folders: {} },
        supportEmail: "support@example.com",
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useConfig>);
    mockFetchOperators.mockResolvedValue([operator]);
    mockFetchLines.mockResolvedValue([service]);
    mockFetchDayJourneys.mockResolvedValue([journey]);
    mockFetchJourney.mockResolvedValue(journeyInfo);
    mockFetchServicePatternDistanceGeom.mockResolvedValue({
      distance: 1234,
      geom: [
        [-0.12, 51.5],
        [-0.13, 51.51],
      ],
      __typename: "ServicePatternDistanceResult",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state while journeys are loading", async () => {
    mockRouter.query = { date: "2026-07-13", operator: "OP1", service: "L1" };
    mockFetchDayJourneys.mockImplementation(() => new Promise(() => {}));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Loading journeys")).toBeInTheDocument();
    });
  });

  it("renders grouped journey start times", async () => {
    mockRouter.query = { date: "2026-07-13", operator: "OP1", service: "L1" };

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "10:30" })).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "12: Town Centre" }),
    ).toBeInTheDocument();
  });

  it("shows no journeys message when the service returns an empty list", async () => {
    mockRouter.query = { date: "2026-07-13", operator: "OP1", service: "L1" };
    mockFetchDayJourneys.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No journeys found")).toBeInTheDocument();
    });
  });

  it("shows search error when journeys cannot be loaded", async () => {
    mockRouter.query = { date: "2026-07-13", operator: "OP1", service: "L1" };
    mockFetchDayJourneys.mockResolvedValue(null);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(
          "Sorry, there is a problem finding vehicle journeys. Please try again.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("renders the individual journey summary and stop list", async () => {
    mockRouter.pathname = "/vehicle-journeys/[journeyId]";
    mockRouter.asPath =
      "/vehicle-journeys/G1?date=2026-07-13&operator=OP1&service=L1&direction=outbound";
    mockRouter.query = {
      journeyId: "G1",
      date: "2026-07-13",
      operator: "OP1",
      service: "L1",
      direction: "outbound",
    };

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "12: Town Centre" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Best Buses (BBUS)")).toBeInTheDocument();
    expect(screen.getByText("High Street")).toBeInTheDocument();
    expect(screen.getByTestId("vehicle-journey-map")).toBeInTheDocument();
  });

  it("normalises blank direction queries for journeys without a direction", async () => {
    mockRouter.pathname = "/vehicle-journeys/[journeyId]";
    mockRouter.asPath =
      "/vehicle-journeys/G1?date=2026-07-13&operator=OP1&service=L1&direction=";
    mockRouter.query = {
      journeyId: "G1",
      date: "2026-07-13",
      operator: "OP1",
      service: "L1",
      direction: "",
    };
    mockFetchDayJourneys.mockResolvedValue([
      {
        ...journey,
        directionRef: "",
      },
    ]);
    mockFetchJourney.mockResolvedValue({
      stops: [
        {
          ...journeyInfo.stops[0],
          directionRef: "",
        },
      ],
      avls: [
        {
          ...journeyInfo.avls[0],
          directionRef: "",
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "12: Town Centre" }),
      ).toBeInTheDocument();
    });
    expect(mockFetchServicePatternDistanceGeom).toHaveBeenCalledWith("101");
  });

  it("falls back to the start time date for legacy detail links", async () => {
    mockRouter.pathname = "/vehicle-journeys/[journeyId]";
    mockRouter.asPath =
      "/vehicle-journeys/G1?operator=OP1&service=L1&startTime=2026-07-13T10:30:00%2B01:00&direction=outbound";
    mockRouter.query = {
      journeyId: "G1",
      operator: "OP1",
      service: "L1",
      startTime: "2026-07-13T10:30:00+01:00",
      direction: "outbound",
    };

    renderPage();

    await waitFor(() => {
      expect(mockFetchDayJourneys).toHaveBeenCalledWith("2026-07-13", "L1");
    });
  });

  it("shows a loading heading until the detail route is ready", () => {
    mockRouter.pathname = "/vehicle-journeys/[journeyId]";
    mockRouter.isReady = false;
    mockRouter.query = {
      journeyId: "G1",
      date: "2026-07-13",
      operator: "OP1",
      service: "L1",
      direction: "outbound",
    };

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Loading journey details" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Journey not found")).not.toBeInTheDocument();
  });

  it("keeps the detail page in a loading state while journeys are still loading", async () => {
    mockRouter.pathname = "/vehicle-journeys/[journeyId]";
    mockRouter.asPath =
      "/vehicle-journeys/G1?date=2026-07-13&operator=OP1&service=L1&direction=outbound";
    mockRouter.query = {
      journeyId: "G1",
      date: "2026-07-13",
      operator: "OP1",
      service: "L1",
      direction: "outbound",
    };
    mockFetchDayJourneys.mockImplementation(() => new Promise(() => {}));
    mockFetchJourney.mockImplementation(() => new Promise(() => {}));

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Loading journey details" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Vehicle journey not found/),
    ).not.toBeInTheDocument();
  });
});
