import { render, screen, cleanup } from "@testing-library/react";
import ServiceMonitoringPage from "@/pages/service-monitoring";

const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useRequireAuth: vi.fn(),
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/layout/BaseLayout", () => ({
  BaseLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="base-layout">{children}</div>
  ),
}));

describe("ServiceMonitoringPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state while user is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(<ServiceMonitoringPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders iframe when user has access and embed url", () => {
    mockUseAuth.mockReturnValue({
      user: {
        canViewServiceMonitoring: true,
        serviceMonitoringEmbedUrl: "https://dashboard.example.com/embed",
      },
      isLoading: false,
    });

    const { container } = render(<ServiceMonitoringPage />);

    expect(screen.getByText("Service monitoring")).toBeInTheDocument();
    const iframe = container.querySelector(
      ".service-monitoring__iframe-container iframe",
    );
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      "https://dashboard.example.com/embed",
    );
  });

  it("shows error when user cannot view service monitoring", () => {
    mockUseAuth.mockReturnValue({
      user: {
        canViewServiceMonitoring: false,
        serviceMonitoringEmbedUrl: null,
      },
      isLoading: false,
    });

    render(<ServiceMonitoringPage />);

    expect(
      screen.getByText("Unable to load dashboard. Please contact admin"),
    ).toBeInTheDocument();
  });

  it("shows error when embed url is missing", () => {
    mockUseAuth.mockReturnValue({
      user: {
        canViewServiceMonitoring: true,
        serviceMonitoringEmbedUrl: null,
      },
      isLoading: false,
    });

    render(<ServiceMonitoringPage />);

    expect(
      screen.getByText("Unable to load dashboard. Please contact admin"),
    ).toBeInTheDocument();
  });
});
