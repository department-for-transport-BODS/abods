import { render, screen, waitFor, cleanup } from "@testing-library/react";
import DistancesPage from "@/pages/distances";

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

vi.mock("@/services/distances/distance.services", () => ({
  distanceService: {
    fetchDistances: vi.fn(),
    fetchDropdownInputs: vi.fn(),
    fetchAdminOrg: vi.fn(),
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/distances",
    asPath: "/distances",
    replace: vi.fn(),
  }),
}));

vi.mock("kainossoftwareltd-govuk-react-kainos", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  SortableTable: ({ head, rows }: any) => (
    <table>
      <thead><tr>{head.map((h: any) => <th key={h.key}>{h.label}</th>)}</tr></thead>
      <tbody>{rows.map((r: any) => <tr key={r.key}></tr>)}</tbody>
    </table>
  ),
}));

import { useConfig } from "@/contexts/ConfigContext";
import { distanceService } from "@/services/distances/distance.services";

const mockUseConfig = vi.mocked(useConfig);
const mockFetchDistances = vi.mocked(distanceService.fetchDistances);
const mockFetchDropdownInputs = vi.mocked(distanceService.fetchDropdownInputs);
const mockFetchAdminOrg = vi.mocked(distanceService.fetchAdminOrg);

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
it("Shows loading state within Generate button initially", () => {
  mockFetchDistances.mockImplementation(() => new Promise(() => {}));
  mockFetchDropdownInputs.mockImplementation(() => new Promise(() => {}));
  mockFetchAdminOrg.mockImplementation(() => new Promise(() => {}));
  render(<DistancesPage />);
  expect(screen.getByRole("button", { name: "Loading..." })).toBeInTheDocument();
});

// TODO: NOW Check which tests are async and which are not
it("Renders a blank table with headers", async () => {
  mockFetchDistances.mockResolvedValue([]);
  mockFetchDropdownInputs.mockResolvedValue({ operators: [] });
  mockFetchAdminOrg.mockResolvedValue([]);
  render(<DistancesPage />);

  await waitFor(() => {
    // Check for table headers (update header texts as per actual component)
    expect(screen.getByRole("columnheader", { name: /Operator/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Service Code/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Service$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Distance excluding dead runs \(km\)/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Distance of journeys with AVL \(km\)/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Distance of journeys with AVL \(%\)/i })).toBeInTheDocument();
  });

  const rows = screen.getAllByRole("row");
  // Check for one row - the header row
  expect(rows.length).toBe(1); 
});

it("Renders a message when the table is blank",() => {})

it("Renders data when generate button is pressed", () => {});

it("Sorts data if the corresponding column header is clicked on", () => {});

it("Defaults to no selection for all the filters",() => {})

// Date Range filtering
it("Defaults the date range to last week",() => {})

it("Filters the data based on the Date Range filter", () => {});

// Admin Area filtering
it ("Filters the dropdown options based on the Admin Area filter", () => {});

it ("Filters the data based on the Admin Area filter", () => {});

it ("Clears the filter selections", () => {});

// Organisation filtering

// Operator filtering

// Licenses filtering

// Services  filtering

// TODO:NOW Review this function
// it("Shows error when fetch fails", async () => {
//   mockFetchDistances.mockRejectedValue(new Error("Failed to fetch"));
//   render(<DistancesPage />);
//   await waitFor(() => {
//     expect(
//       screen.getByText(/Unable to load distances error/i)
//     ).toBeInTheDocument();
//   });
// });