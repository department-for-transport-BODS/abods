import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryStatWithTooltip } from "@/components/shared/SummaryStat/SummaryStatWithTooltip";

describe("SummaryStatWithTooltip", () => {
  it("renders unavailable for missing summary values", () => {
    render(<SummaryStatWithTooltip title="Average delay" value="-" />);

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });

  it("renders tooltip-backed values as a button trigger", () => {
    render(
      <SummaryStatWithTooltip
        title="On-time"
        value="92.00%"
        tooltip="On-time stop departures"
      />,
    );

    expect(
      screen.getByRole("button", { name: "92.00%" }),
    ).toBeInTheDocument();
  });
});
