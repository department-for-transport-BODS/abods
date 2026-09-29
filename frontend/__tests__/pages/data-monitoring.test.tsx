import { render, screen, waitFor, cleanup } from "@testing-library/react";
import DataMonitoringPage from "@/pages/data-monitoring";

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

vi.mock("@/services/data-monitoring/data-monitoring.service", () => ({
  dataMonitoringService: {
    fetchEmbeddedUrl: vi.fn(),
  },
}));

vi.mock("@/components/data-monitoring/QuickSightEmbed", () => ({
  QuickSightEmbed: ({ url }: { url: string }) => (
    <div data-testid="quicksight-embed">{url}</div>
  ),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/data-monitoring",
    asPath: "/data-monitoring",
    replace: vi.fn(),
  }),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { dataMonitoringService } from "@/services/data-monitoring/data-monitoring.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchEmbeddedUrl = vi.mocked(dataMonitoringService.fetchEmbeddedUrl);

describe("DataMonitoringPage", () => {
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

  it("shows loading state initially", () => {
    mockFetchEmbeddedUrl.mockImplementation(() => new Promise(() => {}));
    render(<DataMonitoringPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders QuickSight embed when enabled and url present", async () => {
    mockFetchEmbeddedUrl.mockResolvedValue({
      enabled: true,
      url: "https://quicksight-embed-url",
    });

    render(<DataMonitoringPage />);

    await waitFor(() => {
      expect(screen.getByTestId("quicksight-embed")).toBeInTheDocument();
    });
    expect(screen.getByTestId("quicksight-embed")).toHaveTextContent(
      "https://quicksight-embed-url",
    );
  });

  it("shows error when enabled is false", async () => {
    mockFetchEmbeddedUrl.mockResolvedValue({
      enabled: false,
      url: "https://quicksight-embed-url",
    });

    render(<DataMonitoringPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load dashboard. Please contact admin"),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("quicksight-embed")).not.toBeInTheDocument();
  });

  it("shows error when url is null", async () => {
    mockFetchEmbeddedUrl.mockResolvedValue({
      enabled: true,
      url: null,
    });

    render(<DataMonitoringPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load dashboard. Please contact admin"),
      ).toBeInTheDocument();
    });
  });

  it("shows error when fetch returns null", async () => {
    mockFetchEmbeddedUrl.mockResolvedValue(null);

    render(<DataMonitoringPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load dashboard. Please contact admin"),
      ).toBeInTheDocument();
    });
  });
});
