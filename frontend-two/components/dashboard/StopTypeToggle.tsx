import { StopTypeOption } from "@/types/dashboard";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";

interface StopTypeToggleProps {
  stopType: StopTypeOption;
  onChange: (stopType: StopTypeOption) => void;
}

export const StopTypeToggle = ({ stopType, onChange }: StopTypeToggleProps) => (
  <SegmentedToggle
    legend="Show performance using data from"
    hideLegend
    name="stop-type"
    value={stopType}
    onChange={onChange}
    options={[
      { value: "AllStops", label: "All stops" },
      { value: "TimingPoints", label: "Timing points" },
    ]}
  />
);
