import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StopAnalysisTable } from "@/components/stop-analysis/StopAnalysisTable";
import { type Direction, type StopPerformanceRow } from "@/types/stop-analysis";

vi.mock("@/components/shared/MultiselectCheckbox/MultiselectCheckbox", () => ({
  MultiselectCheckbox: ({
    selectedValues = [],
    onChange,
    options = [],
  }: {
    selectedValues?: string[];
    onChange: (values: string[]) => void;
    options?: Array<{ label: string; value: string }>;
  }) => (
    <div data-testid="direction-filters">
      <span data-testid="selected-values">{selectedValues.join(",")}</span>
      <button type="button" onClick={() => onChange(["Inbound", "Outbound"])}>
        Select both
      </button>
      <button type="button" onClick={() => onChange([])}>
        Clear all
      </button>
      <button
        type="button"
        onClick={() => onChange(options.map((option) => option.value))}
      >
        Show all
      </button>
    </div>
  ),
}));

vi.mock("@/components/table/SortableTable", () => ({
  SortableTable: ({
    head,
    rows,
  }: {
    head: Array<{ key: string; label: string }>;
    rows: Array<Record<string, React.ReactNode>>;
  }) => (
    <div data-testid="sortable-table">
      <div data-testid="table-head">
        {head.map((column) => (
          <span key={column.key}>{column.label}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={String(row.key)} data-testid="table-row">
          <div data-testid="stop-id">{row.stopId}</div>
          <div data-testid="stop-name">{row.stopName}</div>
          <div data-testid="direction">{row.direction}</div>
          <div data-testid="metric-onTime">{row.onTime}</div>
          <div data-testid="metric-early">{row.early}</div>
          <div data-testid="metric-late">{row.late}</div>
        </div>
      ))}
    </div>
  ),
}));

const baseRow: StopPerformanceRow = {
  stopId: "12345",
  stopName: "High Street",
  localityName: "Leeds",
  adminAreaName: "West Yorkshire",
  timingPoint: true,
  latitude: 53.8,
  longitude: -1.5,
  direction: "Inbound",
  scheduledDepartures: 100,
  actualDepartures: 80,
  onTime: 60,
  early: 20,
  late: 20,
  onTimeRatio: 0.75,
  earlyRatio: 0.25,
  lateRatio: 0.25,
  completedRatio: 0.8,
  averageDelay: 120,
  averageScheduled: 90,
  averageActual: 100,
  onTimeInSeconds: 180,
  earlyInSeconds: 60,
  lateInSeconds: 45,
};

describe("StopAnalysisTable", () => {
  it("switches metric formatting between percentage, count, and time", async () => {
    const user = userEvent.setup();

    render(
      <StopAnalysisTable
        data={[baseRow]}
        errored={false}
        directions={["Inbound", "Outbound"]}
        onDirectionsChange={vi.fn()}
        onStopNameClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Percentage" })).toBeChecked();
    expect(screen.getByTestId("metric-onTime")).toHaveTextContent("75.0%");
    expect(screen.getByTestId("metric-early")).toHaveTextContent("25.0%");
    expect(screen.getByTestId("metric-late")).toHaveTextContent("25.0%");

    await user.click(screen.getByRole("radio", { name: "Count" }));
    expect(screen.getByRole("radio", { name: "Count" })).toBeChecked();
    expect(screen.getByTestId("metric-onTime")).toHaveTextContent("60");
    expect(screen.getByTestId("metric-early")).toHaveTextContent("20");
    expect(screen.getByTestId("metric-late")).toHaveTextContent("20");

    await user.click(screen.getByRole("radio", { name: "Time" }));
    expect(screen.getByRole("radio", { name: "Time" })).toBeChecked();
    expect(screen.getByTestId("metric-onTime")).toHaveTextContent("3:00");
    expect(screen.getByTestId("metric-early")).toHaveTextContent("1:00");
    expect(screen.getByTestId("metric-late")).toHaveTextContent("0:45");
  });

  it("opens the display options modal and hides selected columns", async () => {
    const user = userEvent.setup();

    render(
      <StopAnalysisTable
        data={[baseRow]}
        errored={false}
        directions={["Inbound", "Outbound"]}
        onDirectionsChange={vi.fn()}
        onStopNameClick={vi.fn()}
      />,
    );

    expect(screen.getByTestId("table-head")).toHaveTextContent("Scheduled");
    expect(screen.getByTestId("table-head")).toHaveTextContent("Recorded");
    expect(screen.getByTestId("table-head")).toHaveTextContent("Name");
    expect(screen.getByTestId("table-head")).toHaveTextContent("Direction");
    expect(screen.getByTestId("table-head")).toHaveTextContent(
      "Av. Scheduled Travel Time",
    );

    await user.click(screen.getByRole("button", { name: "Display options" }));

    const dialog = screen.getByRole("dialog", { name: "Display options" });
    expect(
      within(dialog).getByRole("checkbox", { name: "NAPTAN" }),
    ).toBeDisabled();

    await user.click(within(dialog).getByRole("checkbox", { name: "Name" }));
    await user.click(within(dialog).getByRole("button", { name: "Show all" }));
    expect(
      within(dialog).getByRole("checkbox", { name: "Name" }),
    ).toBeChecked();

    await user.click(within(dialog).getByRole("checkbox", { name: "Name" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.getByTestId("table-head")).toHaveTextContent("Name");

    await user.click(screen.getByRole("button", { name: "Display options" }));
    const updatedDialog = screen.getByRole("dialog", {
      name: "Display options",
    });
    await user.click(
      within(updatedDialog).getByRole("checkbox", { name: "Name" }),
    );
    await user.click(
      within(updatedDialog).getByRole("button", { name: "Update" }),
    );

    expect(screen.getByTestId("table-head")).not.toHaveTextContent("Name");
    expect(screen.getByTestId("table-head")).toHaveTextContent("Recorded");
  });

  it("renders a totals row with simplified labels when enabled", () => {
    render(
      <StopAnalysisTable
        data={[baseRow]}
        errored={false}
        directions={["Inbound", "Outbound"]}
        onDirectionsChange={vi.fn()}
        onStopNameClick={vi.fn()}
        showTotals
      />,
    );

    const rows = screen.getAllByTestId("table-row");
    expect(rows[0]).toHaveTextContent("-");
    expect(within(rows[0]).getByTestId("stop-id")).toHaveTextContent("-");
    expect(within(rows[0]).getByTestId("stop-name")).toHaveTextContent("-");
    expect(within(rows[0]).getByTestId("direction")).toHaveTextContent("-");
  });

  it("allows clearing all directions and shows no rows", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [directions, setDirections] = useState<Direction[]>(["Inbound"]);

      return (
        <StopAnalysisTable
          data={[baseRow]}
          errored={false}
          directions={directions}
          onDirectionsChange={setDirections}
          onStopNameClick={vi.fn()}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByTestId("direction-filters")).toHaveTextContent(
      "Inbound",
    );

    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getByTestId("selected-values")).toHaveTextContent("");
    expect(screen.queryAllByTestId("table-row")).toHaveLength(0);
  });

  it("restores both directions from the show-all action", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [directions, setDirections] = useState<Direction[]>([]);

      return (
        <StopAnalysisTable
          data={[baseRow]}
          errored={false}
          directions={directions}
          onDirectionsChange={setDirections}
          onStopNameClick={vi.fn()}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByTestId("selected-values")).toHaveTextContent("");

    await user.click(screen.getByRole("button", { name: "Show all" }));

    expect(screen.getByTestId("selected-values")).toHaveTextContent(
      "Inbound,Outbound",
    );
    expect(screen.getAllByTestId("table-row")).toHaveLength(1);
  });
});
