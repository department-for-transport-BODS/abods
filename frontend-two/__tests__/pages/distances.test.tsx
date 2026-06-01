import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import DistancesPage from "@/pages/distances";
import { useConfig } from "@/contexts/ConfigContext";
import { distanceService } from "@/services/distances/distance.services";
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
      <tbody>
        {rows.map((r: any) => (
          <tr key={r.key}>
            {head.map((h: any) => <td key={`${r.key}-${h.key}`}>{r[h.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

// Mock data
const mockDistanceData = [
  {
    operatorId: "FBMN",
    operatorName: "First Bus Manchester",
    nocLineAndServiceCode: "1-City Centre",
    lineName: "City Centre",
    serviceName: "City Centre",
    distance: 50000,
    avlDistance: 40000,
  },
  {
    operatorId: "FBMN",
    operatorName: "First Bus Manchester",
    nocLineAndServiceCode: "X10-Airport Express",
    lineName: "Airport Express",
    serviceName: "Airport Express",
    distance: 10000,
    avlDistance: 5000,
  },
  {
    operatorId: "ARWY",
    operatorName: "Arriva Yorkshire",
    nocLineAndServiceCode: "5-North Loop",
    lineName: "North Loop",
    serviceName: "North Loop",
    distance: 75000,
    avlDistance: 65000,
  },
  {
    operatorId: "ARWY",
    operatorName: "Arriva Yorkshire",
    nocLineAndServiceCode: "7-South Route",
    lineName: "South Route",
    serviceName: "South Route",
    distance: 60000,
    avlDistance: 50000,
  },
];

const mockAdminAreaData = [
  { adminAreaId: 1, adminName: "Greater Manchester", operatorId: "FBMN", orgId: 10, orgName: "First Group" },
  { adminAreaId: 2, adminName: "West Yorkshire", operatorId: "ARWY", orgId: 11, orgName: "Arriva UK Bus" },
];

const mockDropdownInputData = {
  operators: [
    {
      id: "FBMN",
      name: "First Bus Manchester",
      licenses: [
        {
          id: "PB0000001",
          services: [
            { id: "SVC001", name: "City Centre", line: "1" },
            { id: "SVC002", name: "Airport Express", line: "X10" },
          ],
        },
      ],
    },
    {
      id: "ARWY",
      name: "Arriva Yorkshire",
      licenses: [
        {
          id: "PB0000002",
          services: [
            { id: "SVC003", name: "North Loop", line: "5" },
            { id: "SVC004", name: "South Route", line: "7" },
          ],
        },
      ],
    },
  ],
};

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
it("Shows loading state within Generate button", async () => {
  mockFetchDistances.mockImplementation(() => new Promise(() => {}));
  mockFetchDropdownInputs.mockImplementation(() => new Promise(() => {}));
  mockFetchAdminOrg.mockImplementation(() => new Promise(() => {}));
  
  render(<DistancesPage />);
  
  const generateButton = await screen.findByRole("button", { name: "Loading..." });
  expect(generateButton).toBeDisabled();
});

it("Renders a blank table with correct headers initially", async () => {
  mockFetchDistances.mockResolvedValue([]);
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);
  
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

it("Renders a message when the table is blank", async () => {
  mockFetchDistances.mockResolvedValue([]);
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);
  
  render(<DistancesPage />);
  
  await waitFor(() => {
    expect(screen.getByText("No operator data found")).toBeInTheDocument();
  });
})

it("Defaults to no selection for all the filters", async () => {
  mockFetchDistances.mockResolvedValue([]);
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);

  render(<DistancesPage />);

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
  });

  expect(screen.getByRole("button", { name: /All areas/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /All organisations/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /All operators/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /All licenses/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /All services/i })).toBeInTheDocument();
})

it("Renders all data when generate button is pressed and no filters are applied", async () => {
  mockFetchDistances.mockResolvedValue(mockDistanceData);
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);

  render(<DistancesPage />);

  // Wait for initial loading to complete — button should show "Generate" and be enabled
  const generateButton = await screen.findByRole("button", { name: "Generate" });
  expect(generateButton).not.toBeDisabled();

  fireEvent.click(generateButton);

  // 1 header row + 1 totals row + 4 data rows = 6 rows total
  await waitFor(() => {
    expect(screen.getAllByRole("row").length).toBe(6);
  });
});

// Date Range filtering
it("Defaults the date range to last week", async () => {
  mockFetchDistances.mockResolvedValue([]);
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);

  render(<DistancesPage />);

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
  });

  const yesterday = DateTime.now().minus({ days: 1 }).toFormat("dd MMM yyyy");
  const sevenDaysAgo = DateTime.now().minus({ days: 7 }).toFormat("dd MMM yyyy");

  expect(screen.getByText(`${sevenDaysAgo} - ${yesterday}`)).toBeInTheDocument();
})

// Other filters
const allFilterOptionsTestCases = [
  ["Admin Area", /All areas/i, ["Greater Manchester", "West Yorkshire"]],
  ["Organisations", /All organisations/i, ["Arriva UK Bus", "First Group"]],
  ["Operators", /All operators/i, ["Arriva Yorkshire (ARWY)", "First Bus Manchester (FBMN)"]],
  ["Licenses", /All licenses/i, ["PB0000001", "PB0000002"]],
  ["Services", /All services/i, ["1-City Centre", "5-North Loop", "X10-Airport Express", "7-South Route"]],
] as const;

it.each(allFilterOptionsTestCases)(
  "Renders all options in the %s dropdown",
  async (_filterName, filterButtonName, expectedOptions) => {
    mockFetchDistances.mockResolvedValue([]);
    mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
    mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);

    render(<DistancesPage />);

    // Wait for the dropdown trigger button to render first
    const dropdownButton = await screen.findByRole("button", { name: filterButtonName });

    fireEvent.click(dropdownButton);
    expectedOptions.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  },
);

const crossFilterTestCases = [
  {
    name: "Admin Area selection narrows the other dropdowns",
    selectedDropdownButtonName: /All areas/i,
    selectedOption: "Greater Manchester",
    expectedByDropdown: [
      { buttonName: /All organisations/i, present: ["First Group"], absent: ["Arriva UK Bus"] },
      { buttonName: /All operators/i, present: ["First Bus Manchester (FBMN)"], absent: ["Arriva Yorkshire (ARWY)"] },
      { buttonName: /All licenses/i, present: ["PB0000001"], absent: ["PB0000002"] },
      { buttonName: /All services/i, present: ["1-City Centre", "X10-Airport Express"], absent: ["5-North Loop", "7-South Route"] },
    ],
  },
  {
    name: "Organisation selection narrows the other dropdowns",
    selectedDropdownButtonName: /All organisations/i,
    selectedOption: "Arriva UK Bus",
    expectedByDropdown: [
      { buttonName: /All areas/i, present: ["West Yorkshire"], absent: ["Greater Manchester"] },
      { buttonName: /All operators/i, present: ["Arriva Yorkshire (ARWY)"], absent: ["First Bus Manchester (FBMN)"] },
      { buttonName: /All licenses/i, present: ["PB0000002"], absent: ["PB0000001"] },
      { buttonName: /All services/i, present: ["5-North Loop", "7-South Route"], absent: ["1-City Centre", "X10-Airport Express"] },
    ],
  },
  {
    name: "License selection narrows the other dropdowns",
    selectedDropdownButtonName: /All licenses/i,
    selectedOption: "PB0000001",
    expectedByDropdown: [
      { buttonName: /All areas/i, present: ["Greater Manchester"], absent: ["West Yorkshire"] },
      { buttonName: /All organisations/i, present: ["First Group"], absent: ["Arriva UK Bus"] },
      { buttonName: /All operators/i, present: ["First Bus Manchester (FBMN)"], absent: ["Arriva Yorkshire (ARWY)"] },
      { buttonName: /All services/i, present: ["1-City Centre", "X10-Airport Express"], absent: ["5-North Loop", "7-South Route"] },
    ],
  },
  {
    name: "Service selection narrows the other dropdowns",
    selectedDropdownButtonName: /All services/i,
    selectedOption: "5-North Loop",
    expectedByDropdown: [
      { buttonName: /All areas/i, present: ["West Yorkshire"], absent: ["Greater Manchester"] },
      { buttonName: /All organisations/i, present: ["Arriva UK Bus"], absent: ["First Group"] },
      { buttonName: /All operators/i, present: ["Arriva Yorkshire (ARWY)"], absent: ["First Bus Manchester (FBMN)"] },
      { buttonName: /All licenses/i, present: ["PB0000002"], absent: ["PB0000001"] },
    ],
  },
] as const;

it.each(crossFilterTestCases)("$name", async ({ selectedDropdownButtonName, selectedOption, expectedByDropdown }) => {
  mockFetchDistances.mockResolvedValue([]);
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);

  render(<DistancesPage />);

  const selectedDropdownButton = await screen.findByRole("button", { name: selectedDropdownButtonName });
  fireEvent.click(selectedDropdownButton);
  fireEvent.click(screen.getByText(selectedOption));

  expectedByDropdown.forEach(({ buttonName, present, absent }) => {
    // Close any currently open dropdown, before checking the next dropdown
    fireEvent.mouseDown(document.body);

    const dropdownButton = screen.getByRole("button", { name: buttonName });
    fireEvent.click(dropdownButton);

    present.forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });

    absent.forEach((text) => {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });
  });
});

const filteredTableDataTestCases = [
  {
    name: "Admin Area filter updates table rows",
    filterButtonName: /All areas/i,
    selectedOption: "Greater Manchester",
    expectedRowCount: 4,
    shouldSee: ["First Bus Manchester (FBMN)", "City Centre-City Centre", "Airport Express-Airport Express"],
    shouldNotSee: ["Arriva Yorkshire (ARWY)", "North Loop-North Loop", "South Route-South Route"],
  },
  {
    name: "Organisation filter updates table rows",
    filterButtonName: /All organisations/i,
    selectedOption: "Arriva UK Bus",
    expectedRowCount: 4,
    shouldSee: ["Arriva Yorkshire (ARWY)", "North Loop-North Loop", "South Route-South Route"],
    shouldNotSee: ["First Bus Manchester (FBMN)", "City Centre-City Centre", "Airport Express-Airport Express"],
  },
  {
    name: "Operator filter updates table rows",
    filterButtonName: /All operators/i,
    selectedOption: "First Bus Manchester (FBMN)",
    expectedRowCount: 4,
    shouldSee: ["First Bus Manchester (FBMN)", "City Centre-City Centre", "Airport Express-Airport Express"],
    shouldNotSee: ["Arriva Yorkshire (ARWY)", "North Loop-North Loop", "South Route-South Route"],
  },
  {
    name: "License filter updates table rows",
    filterButtonName: /All licenses/i,
    selectedOption: "PB0000002",
    expectedRowCount: 4,
    shouldSee: ["Arriva Yorkshire (ARWY)", "North Loop-North Loop", "South Route-South Route"],
    shouldNotSee: ["First Bus Manchester (FBMN)", "City Centre-City Centre", "Airport Express-Airport Express"],
  },
  {
    name: "Service filter updates table rows",
    filterButtonName: /All services/i,
    selectedOption: "X10-Airport Express",
    expectedRowCount: 4,
    shouldSee: ["First Bus Manchester (FBMN)", "City Centre-City Centre", "Airport Express-Airport Express"],
    shouldNotSee: ["Arriva Yorkshire (ARWY)", "North Loop-North Loop", "South Route-South Route"],
  },
] as const;

it.each(filteredTableDataTestCases)("$name", async ({ filterButtonName, selectedOption, expectedRowCount, shouldSee, shouldNotSee }) => {
  mockFetchDistances.mockImplementation(async (_apiUrl, filters) => {
    const operatorByAdminAreaId: Record<string, string> = {
      "1": "FBMN",
      "2": "ARWY",
    };
    const operatorByLicenseId: Record<string, string> = {
      PB0000001: "FBMN",
      PB0000002: "ARWY",
    };
    const operatorByServiceId: Record<string, string> = {
      SVC001: "FBMN",
      SVC002: "FBMN",
      SVC003: "ARWY",
      SVC004: "ARWY",
    };

    if (filters?.adminAreaIds?.length) {
      const allowed = new Set(
        filters.adminAreaIds.map((id: string) => operatorByAdminAreaId[id]).filter(Boolean),
      );
      return mockDistanceData.filter((row) => allowed.has(row.operatorId));
    }

    if (filters?.operatorIds?.length) {
      const allowed = new Set(filters.operatorIds);
      return mockDistanceData.filter((row) => allowed.has(row.operatorId));
    }

    if (filters?.licenseIds?.length) {
      const allowed = new Set(
        filters.licenseIds.map((id: string) => operatorByLicenseId[id]).filter(Boolean),
      );
      return mockDistanceData.filter((row) => allowed.has(row.operatorId));
    }

    if (filters?.nocLineAndServiceCodes?.length) {
      const allowed = new Set(
        filters.nocLineAndServiceCodes.map((id: string) => operatorByServiceId[id]).filter(Boolean),
      );
      return mockDistanceData.filter((row) => allowed.has(row.operatorId));
    }

    return mockDistanceData;
  });
  
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);

  render(<DistancesPage />);

  const generateButton = await screen.findByRole("button", { name: "Generate" });
  fireEvent.click(generateButton);

  await waitFor(() => {
    expect(screen.getAllByRole("row").length).toBe(6);
  });

  fireEvent.click(screen.getByRole("button", { name: filterButtonName }));
  
  const optionCheckbox = screen.queryByLabelText(selectedOption);

  if (optionCheckbox) {
    fireEvent.click(optionCheckbox);
  } else {
    fireEvent.click(screen.getByText(selectedOption));
  }

  fireEvent.mouseDown(document.body);
  
  fireEvent.click(generateButton);

  await waitFor(() => {
    expect(screen.getAllByRole("row").length).toBe(expectedRowCount);
  });

  shouldSee.forEach((value) => {
    expect(screen.getAllByText(value).length).toBeGreaterThan(0);
  });

  shouldNotSee.forEach((value) => {
    expect(screen.queryAllByText(value).length).toBe(0);
  });
});

const clearAllDropdownTestCases = [
  {
    name: "Admin Area dropdown clears selection",
    filterButtonName: /All areas/i,
    optionsToSelect: ["Greater Manchester", "West Yorkshire"],
    defaultText: /All areas/i,
    displayText: /2 selected/i,
  },
  {
    name: "Organisations dropdown clears selection",
    filterButtonName: /All organisations/i,
    optionsToSelect: ["Arriva UK Bus"],
    defaultText: /All organisations/i,
    displayText: /Arriva UK Bus/i,
  },
  {
    name: "Operators dropdown clears selection",
    filterButtonName: /All operators/i,
    optionsToSelect: ["Arriva Yorkshire (ARWY)", "First Bus Manchester (FBMN)"],
    defaultText: /All operators/i,
    displayText: /2 selected/i,
  },
  {
    name: "Licenses dropdown clears selection",
    filterButtonName: /All licenses/i,
    optionsToSelect: ["PB0000001", "PB0000002"],
    defaultText: /All licenses/i,
    displayText: /2 selected/i,
  },
  {
    name: "Services dropdown clears selection",
    filterButtonName: /All services/i,
    optionsToSelect: ["1-City Centre", "5-North Loop"],
    defaultText: /All services/i,
    displayText: /2 selected/i,
  },
] as const;

it.each(clearAllDropdownTestCases)("$name", async ({ filterButtonName, optionsToSelect, defaultText, displayText }) => {
  mockFetchDistances.mockResolvedValue(mockDistanceData);
  mockFetchDropdownInputs.mockResolvedValue(mockDropdownInputData);
  mockFetchAdminOrg.mockResolvedValue(mockAdminAreaData);

  render(<DistancesPage />);

  const dropdownButton = await screen.findByRole("button", { name: filterButtonName });
  fireEvent.click(dropdownButton);

  for (const option of optionsToSelect) {
    const checkbox = screen.queryByLabelText(option);
    if (checkbox) {
      fireEvent.click(checkbox);
    } else {
      fireEvent.click(screen.getByText(option));
    }
  }
  
  // Check options have been selected (Button text should show number of selected options)
  fireEvent.mouseDown(document.body); 
  expect(screen.getByRole("button", { name: displayText })).toBeInTheDocument();

  const newDropdownButton = await screen.findByRole("button", { name: displayText });
  fireEvent.click(newDropdownButton);

  fireEvent.click(screen.getByRole("button", { name: /Clear all/i }));

  // Dropdown button should reset to default text
  fireEvent.mouseDown(document.body); 
  expect(screen.getByRole("button", { name: defaultText })).toBeInTheDocument();
});