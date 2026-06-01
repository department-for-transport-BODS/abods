import { render, screen, waitFor, cleanup } from "@testing-library/react";
import OnTimeIndexPage from "@/pages/on-time";

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

vi.mock("@/services/on-time/on-time.service", () => ({
  onTimeService: {
    fetchOperatorPerformanceList: vi.fn(),
  },
}));

import { useConfig } from "@/contexts/ConfigContext";
import { onTimeService } from "@/services/on-time/on-time.service";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchOperatorPerformanceList = vi.mocked(
  onTimeService.fetchOperatorPerformanceList,
);

describe("OnTimeIndexPage", () => {
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
    mockFetchOperatorPerformanceList.mockImplementation(
      () => new Promise(() => {}),
    );

    render(<OnTimeIndexPage />);

    expect(screen.getByText("Loading on-time data...")).toBeInTheDocument();
  });

  it("renders fetched json section and operator links", async () => {
    mockFetchOperatorPerformanceList.mockResolvedValue([
      {
        name: "Demo Operator",
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
      },
    ]);

    render(<OnTimeIndexPage />);

    await waitFor(() => {
      expect(
        screen.getByText("onTimeOperatorPerformanceList"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: "Demo Operator (ABCD)" }),
    ).toHaveAttribute("href", "/on-time/ABCD");
  });
});
