import { fireEvent, render, screen } from "@testing-library/react";
import { OtpThresholdSlider } from "@/components/on-time/OtpThreshold/OtpThresholdSlider";

describe("OtpThresholdSlider", () => {
  it("renders the scheduled departure centre label", () => {
    render(
      <OtpThresholdSlider
        early={1}
        late={6}
        onEarlyChange={vi.fn()}
        onLateChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Scheduled departure")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("maps early and late thumbs onto the shared -20 to 20 minute axis", () => {
    const onEarlyChange = vi.fn();
    const onLateChange = vi.fn();

    render(
      <OtpThresholdSlider
        early={1}
        late={6}
        onEarlyChange={onEarlyChange}
        onLateChange={onLateChange}
      />,
    );

    const earlyThumb = screen.getByRole("slider", {
      name: "Early threshold in minutes before the scheduled departure",
    });
    const lateThumb = screen.getByRole("slider", {
      name: "Late threshold in minutes after the scheduled departure",
    });

    expect(earlyThumb).toHaveAttribute("min", "0");
    expect(earlyThumb).toHaveAttribute("max", "40");
    expect(earlyThumb).toHaveValue("19");
    expect(lateThumb).toHaveAttribute("min", "0");
    expect(lateThumb).toHaveAttribute("max", "40");
    expect(lateThumb).toHaveValue("26");

    fireEvent.change(earlyThumb, { target: { value: "15" } });
    fireEvent.change(lateThumb, { target: { value: "27" } });

    expect(onEarlyChange).toHaveBeenCalledWith(5);
    expect(onLateChange).toHaveBeenCalledWith(7);
  });
});
