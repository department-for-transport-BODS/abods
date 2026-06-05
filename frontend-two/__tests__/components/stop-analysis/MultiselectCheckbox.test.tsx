import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiselectCheckbox } from "@/components/stop-analysis/MultiselectCheckbox";

describe("MultiselectCheckbox", () => {
  const options = [
    { label: "Bath & North East Somerset", value: "1" },
    { label: "Bedford", value: "2" },
    { label: "Blackburn with Darwen", value: "3" },
  ];

  it("shows the legacy-style header and disabled clear action when nothing is selected", async () => {
    const user = userEvent.setup();

    render(
      <MultiselectCheckbox
        id="admin-areas"
        label="Admin Areas"
        options={options}
        selectedValues={[]}
        onChange={vi.fn()}
        showAllLabel="All Areas"
        placeholder="Admin Areas"
      />,
    );

    expect(screen.getByRole("textbox", { name: "Admin Areas" })).toHaveValue(
      "Admin Areas",
    );

    await user.click(screen.getByRole("textbox", { name: "Admin Areas" }));
    await user.type(
      screen.getByRole("textbox", { name: "Admin Areas" }),
      "Bed",
    );

    const dropdown = screen.getByRole("listbox");
    expect(within(dropdown).getByText("All Areas")).toBeInTheDocument();
    expect(
      within(dropdown).getByRole("button", { name: "Show all" }),
    ).toBeDisabled();
    expect(
      within(dropdown).getByRole("checkbox", { name: "Bedford" }),
    ).toBeInTheDocument();
    expect(within(dropdown).getByText("Bedford")).toBeInTheDocument();
  });

  it("clears the selection from the header action", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MultiselectCheckbox
        id="admin-areas"
        label="Admin Areas"
        options={options}
        selectedValues={["2"]}
        onChange={onChange}
        showAllLabel="All Areas"
        placeholder="Admin Areas"
      />,
    );

    expect(screen.getByRole("textbox", { name: "Admin Areas" })).toHaveValue(
      "Bedford",
    );

    await user.click(screen.getByRole("textbox", { name: "Admin Areas" }));
    await user.click(screen.getByRole("button", { name: "Show all" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
