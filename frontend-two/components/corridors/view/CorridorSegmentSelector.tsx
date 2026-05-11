import { CorridorStop } from "@/types/corridors";

interface Props {
  stops: CorridorStop[];
  selectedSegmentIndex: number | null;
  onChangeSegmentIndex: (value: number | null) => void;
  isDisabled?: boolean;
}

export const CorridorSegmentSelector = ({
  stops,
  selectedSegmentIndex,
  onChangeSegmentIndex,
  isDisabled = false,
}: Props) => {
  if (stops.length < 2) return null;

  const segments = Array.from({ length: stops.length - 1 }, (_, index) => ({
    index,
    from: stops[index],
    to: stops[index + 1],
  }));

  return (
    <div className="govuk-form-group govuk-!-margin-bottom-6">
      <label
        className="govuk-label govuk-!-font-weight-bold"
        htmlFor="corridor-segment"
      >
        Segment
      </label>
      <select
        id="corridor-segment"
        className="govuk-select"
        disabled={isDisabled}
        value={selectedSegmentIndex ?? "all"}
        onChange={(event) => {
          const value = event.target.value;
          onChangeSegmentIndex(value === "all" ? null : Number(value));
        }}
      >
        <option value="all">All segments</option>
        {segments.map((segment) => (
          <option key={segment.index} value={segment.index}>
            {segment.from.stopName} {"->"} {segment.to.stopName}
          </option>
        ))}
      </select>
    </div>
  );
};
