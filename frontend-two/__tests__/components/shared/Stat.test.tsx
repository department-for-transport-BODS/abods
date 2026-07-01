import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stat } from "@/components/shared/SummaryStat/Stat";

describe("Stat", () => {
  it("renders tooltip-backed values with the default dotted underline affordance", () => {
    render(
      <Stat
        id="vehicle-count"
        label="Vehicle count"
        tooltip="Vehicle count details"
        value={123}
      />,
    );

    expect(screen.getByRole("button", { name: "123" })).toBeInTheDocument();
    expect(screen.getByText("123")).toHaveClass("stat__value");
    expect(screen.getByText("123")).toHaveClass("stat__value--tooltip");
  });

  it("renders loading values without the dotted border class", () => {
    render(
      <Stat
        id="vehicle-count"
        label="Vehicle count"
        loading
        value="Loading..."
      />,
    );

    expect(screen.getByText("Loading...")).toHaveClass("stat__value--loading");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
