import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "@/components/shared/Spinner";

describe("Spinner", () => {
  it("renders the three-pip loading animation markup", () => {
    const { container } = render(<Spinner size="x-small" />);

    expect(container.querySelector(".spinner.spinner--x-small")).toBeTruthy();
    expect(container.querySelector(".spinner__dot1")).toBeTruthy();
    expect(container.querySelector(".spinner__dot2")).toBeTruthy();
    expect(container.querySelector(".spinner__dot3")).toBeTruthy();
  });

  it("renders an accessible message with the default spinner size", () => {
    const { getByRole } = render(<Spinner size="default" message="Loading..." />);

    expect(getByRole("alert")).toHaveClass("spinner", "spinner--default");
    expect(getByRole("alert")).toHaveTextContent("Loading...");
  });
});
