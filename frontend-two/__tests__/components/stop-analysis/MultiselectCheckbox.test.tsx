import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox/MultiselectCheckbox";

describe("MultiselectCheckbox", () => {
  const options = [
    { label: "Bath & North East Somerset", value: "1" },
    { label: "Bedford", value: "2" },
    { label: "Blackburn with Darwen", value: "3" },
  ];

  it("shows all options again when nothing is selected", async () => {
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
    expect(
      within(dropdown).queryByRole("checkbox", {
        name: "Bath & North East Somerset",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(dropdown).queryByRole("checkbox", {
        name: "Blackburn with Darwen",
      }),
    ).not.toBeInTheDocument();
  });

  it("emits an empty selection from the header action", async () => {
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
    await user.type(
      screen.getByRole("textbox", { name: "Admin Areas" }),
      "zzz",
    );
    await user.click(screen.getByRole("button", { name: "Show all" }));

    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.getByRole("textbox", { name: "Admin Areas" })).toHaveValue(
      "zzz",
    );
    expect(
      within(screen.getByRole("listbox")).queryAllByRole("checkbox"),
    ).toHaveLength(0);
  });

  it("clears the search text after selecting an option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MultiselectCheckbox
        id="admin-areas"
        label="Admin Areas"
        options={options}
        selectedValues={[]}
        onChange={onChange}
        showAllLabel="All Areas"
        placeholder="Admin Areas"
      />,
    );

    const trigger = screen.getByRole("textbox", { name: "Admin Areas" });
    await user.click(trigger);
    await user.type(trigger, "Bed");

    await user.click(screen.getByRole("checkbox", { name: "Bedford" }));

    expect(trigger).toHaveValue("Bed");
    expect(onChange).toHaveBeenCalledWith(["2"]);
  });

  it("shows selected summary while allowing typing when open", async () => {
    const user = userEvent.setup();

    render(
      <MultiselectCheckbox
        id="admin-areas"
        label="Admin Areas"
        options={options}
        selectedValues={["1", "2"]}
        onChange={vi.fn()}
        showAllLabel="All Areas"
        placeholder="Admin Areas"
      />,
    );

    const trigger = screen.getByRole("textbox", { name: "Admin Areas" });
    await user.click(trigger);

    expect(trigger).toHaveValue("");
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    await user.type(trigger, "hello");

    expect(trigger).toHaveValue("hello");
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("shows a no items found message when no options match", async () => {
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

    const trigger = screen.getByRole("textbox", { name: "Admin Areas" });
    await user.click(trigger);
    await user.type(trigger, "zzz");

    expect(screen.getByText("No items found")).toBeInTheDocument();
    const dropdown = screen.getByRole("listbox");
    expect(within(dropdown).queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("omits the show-all header when showAllLabel is not provided", async () => {
    const user = userEvent.setup();

    render(
      <MultiselectCheckbox
        id="admin-areas"
        label="Admin Areas"
        options={options}
        selectedValues={[]}
        onChange={vi.fn()}
        placeholder="Admin Areas"
      />,
    );

    await user.click(screen.getByRole("textbox", { name: "Admin Areas" }));

    const dropdown = screen.getByRole("listbox");
    expect(within(dropdown).queryByText("All Admin Areas")).not.toBeInTheDocument();
    expect(
      within(dropdown).queryByRole("button", { name: "Show all" }),
    ).not.toBeInTheDocument();
  });
});
