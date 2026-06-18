import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StopAnalysisFilters } from "@/components/stop-analysis/StopAnalysisFilters";
import { MatchType } from "@/src/generated/graphql";

vi.mock("@/components/shared/DateRangeSelect", () => ({
  DateRangeSelect: ({
    value,
    onChange,
  }: {
    value: { from: string; to: string };
    onChange: (dateRange: { from: string; to: string }) => void;
  }) => (
    <button
      type="button"
      data-testid="date-range-select"
      onClick={() => onChange({ from: "2026-05-01", to: "2026-05-08" })}
    >
      {value.from} - {value.to}
    </button>
  ),
}));

vi.mock("@/components/stop-analysis/MultiselectCheckbox", () => ({
  MultiselectCheckbox: ({ label }: { label: string }) => (
    <div
      data-testid={`multiselect-${label.toLowerCase().replace(/\s+/g, "-")}`}
    />
  ),
}));

vi.mock("@/components/stop-analysis/Toggles", () => ({
  MatchTypeToggle: () => <div data-testid="match-type-toggle" />,
  StopTypeToggle: () => <div data-testid="stop-type-toggle" />,
}));

describe("StopAnalysisFilters", () => {
  it("renders the shared date range control and keeps the preset selector in sync", async () => {
    const user = userEvent.setup();
    const onDateRangeChange = vi.fn();
    const onPresetChange = vi.fn();

    render(
      <StopAnalysisFilters
        fromTimestamp="2026-05-26T00:00:00.000Z"
        toTimestamp="2026-06-02T23:59:59.999Z"
        adminAreaIds={[]}
        operatorIds={[]}
        lineIds={[]}
        matchType={MatchType.Evidenced}
        stopType="TimingPoints"
        adminAreas={[]}
        operators={[]}
        lines={[]}
        mapboxToken={undefined}
        onDateRangeChange={onDateRangeChange}
        onAdminAreasChange={vi.fn()}
        onOperatorsChange={vi.fn()}
        onLinesChange={vi.fn()}
        onMatchTypeChange={vi.fn()}
        onStopTypeChange={vi.fn()}
        onLocationSelect={vi.fn()}
        onPresetChange={onPresetChange}
      />,
    );

    expect(screen.getByTestId("date-range-select")).toHaveTextContent(
      "2026-05-26T00:00:00.000Z - 2026-06-02T23:59:59.999Z",
    );
    const presetSelect = screen.getByRole("combobox", {
      name: /preset date range/i,
    });
    expect(presetSelect).toBeInTheDocument();
    expect(presetSelect).toHaveValue("custom");

    await user.selectOptions(presetSelect, "lastMonth");
    expect(onPresetChange).toHaveBeenCalledWith("lastMonth");

    await user.click(screen.getByTestId("date-range-select"));

    expect(onDateRangeChange).toHaveBeenCalledWith("2026-05-01", "2026-05-08");
  });
});
