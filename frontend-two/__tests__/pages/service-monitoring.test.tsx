import { render, screen, cleanup, waitFor } from "@testing-library/react";
import ServiceMonitoringPage from "@/pages/service-monitoring";

const mockFetchServiceMonitoringUser = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useRequireAuth: vi.fn(),
  useAuth: vi.fn().mockReturnValue({ isAuthenticated: true, isLoading: false }),
}));

vi.mock("@/services/service-monitoring/service-monitoring.service", () => ({
  serviceMonitoringService: {
    fetchServiceMonitoringUser: () => mockFetchServiceMonitoringUser(),
  },
}));

vi.mock("@/components/layout/BaseLayout", () => ({
  BaseLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="base-layout">{children}</div>
  ),
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

describe("ServiceMonitoringPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state while the embed url is being fetched", () => {
    mockFetchServiceMonitoringUser.mockReturnValue(new Promise(() => {}));

    render(<ServiceMonitoringPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders iframe when user has access and embed url", async () => {
    mockFetchServiceMonitoringUser.mockResolvedValue({
      canViewServiceMonitoring: true,
      serviceMonitoringEmbedUrl:
        "https://dashboard.example.com/embed?token=abc&nonce=def&ts=123",
    });

    const { container } = render(<ServiceMonitoringPage />);

    expect(screen.getByText("Service monitoring")).toBeInTheDocument();
    await waitFor(() => {
      const iframe = container.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        "src",
        "https://dashboard.example.com/embed?token=abc&nonce=def&ts=123",
      );
    });
  });

  it("fetches a fresh embed url on page view", async () => {
    mockFetchServiceMonitoringUser.mockResolvedValue({
      canViewServiceMonitoring: true,
      serviceMonitoringEmbedUrl: "https://dashboard.example.com/embed",
    });

    render(<ServiceMonitoringPage />);

    await waitFor(() => {
      expect(mockFetchServiceMonitoringUser).toHaveBeenCalled();
    });
  });

  it("shows error when user cannot view service monitoring", async () => {
    mockFetchServiceMonitoringUser.mockResolvedValue({
      canViewServiceMonitoring: false,
      serviceMonitoringEmbedUrl: null,
    });

    render(<ServiceMonitoringPage />);

    expect(
      await screen.findByText("Unable to load dashboard. Please contact admin"),
    ).toBeInTheDocument();
  });

  it("shows error when embed url is missing", async () => {
    mockFetchServiceMonitoringUser.mockResolvedValue({
      canViewServiceMonitoring: true,
      serviceMonitoringEmbedUrl: null,
    });

    render(<ServiceMonitoringPage />);

    expect(
      await screen.findByText("Unable to load dashboard. Please contact admin"),
    ).toBeInTheDocument();
  });

  it("shows error when the query fails", async () => {
    mockFetchServiceMonitoringUser.mockRejectedValue(new Error("network"));

    render(<ServiceMonitoringPage />);

    expect(
      await screen.findByText("Failed to load dashboard. Please try again"),
    ).toBeInTheDocument();
  });
});
