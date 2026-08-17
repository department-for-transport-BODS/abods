import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/shared/Modal";

const ModalHarness = () => {
  const [open, setOpen] = useState(true);

  return (
    <Modal
      open={open}
      title="Display options"
      closeLabel="Close display options"
      onClose={() => setOpen(false)}
    >
      <p>Modal content</p>
    </Modal>
  );
};

describe("Modal", () => {
  afterEach(() => {
    document.body.classList.remove("modal-open");
  });

  it("renders a branded header and dialog content", () => {
    render(<ModalHarness />);

    expect(
      screen.getByRole("dialog", { name: "Display options" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Display options")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("renders dialog content and closes when dismissed", async () => {
    const user = userEvent.setup();

    render(<ModalHarness />);

    expect(
      screen.getByRole("dialog", { name: "Display options" }),
    ).toBeInTheDocument();
    expect(document.body).toHaveClass("modal-open");

    await user.click(
      screen.getByRole("button", { name: "Close display options" }),
    );

    expect(
      screen.queryByRole("dialog", { name: "Display options" }),
    ).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass("modal-open");
  });
});
