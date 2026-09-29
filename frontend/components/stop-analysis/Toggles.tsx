import { StopTypeOption } from "@/types/stop-analysis";
import { MatchType } from "@/src/generated/graphql";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";

interface MatchTypeToggleProps {
  matchType: MatchType;
  onChange: (matchType: MatchType) => void;
}

export const MatchTypeToggle = ({
  matchType,
  onChange,
}: MatchTypeToggleProps) => (
  <SegmentedToggle
    legend="Show performance using data from"
    hideLegend
    name="match-type"
    value={matchType}
    onChange={onChange}
    options={[
      { value: MatchType.Estimated, label: "Estimated" },
      { value: MatchType.Evidenced, label: "Evidenced" },
    ]}
  />
);

interface StopTypeToggleProps {
  stopType: StopTypeOption;
  onChange: (stopType: StopTypeOption) => void;
}

export const StopTypeToggle = ({ stopType, onChange }: StopTypeToggleProps) => (
  <SegmentedToggle
    legend="Filter by stop type"
    hideLegend
    name="sa-stop-type"
    value={stopType}
    onChange={onChange}
    options={[
      { value: "AllStops", label: "All stops" },
      { value: "TimingPoints", label: "Timing points" },
    ]}
  />
);
