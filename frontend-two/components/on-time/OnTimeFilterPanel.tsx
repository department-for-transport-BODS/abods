import dynamic from "next/dynamic";
import { DateTime } from "luxon";
import { FilterChips } from "@/components/on-time/FilterChips";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect/DateRangeSelect";
import { RefineResultsButton } from "@/components/shared/RefineResults/RefineResultsButton";
import { RefineResultsFilterValues } from "@/components/shared/RefineResults/RefineResultsFilters";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import { PerformanceFiltersInputType } from "@/src/generated/graphql";
import { formatDateToISODateString } from "@/utils/date-formatter";

export const DATE_PRESET_OPTIONS = [
  "Last 7 days",
  "Last 28 days",
  "Last month",
  "Month to date",
];

export const MATCH_TYPE_OPTIONS = [
  { value: "estimated", label: "Estimated" },
  { value: "evidenced", label: "Evidenced" },
];

export const STOP_TYPE_OPTIONS = [
  { value: "all-stops", label: "All stops" },
  { value: "timing-points", label: "Timing points" },
];

export const calculateDateRange = (
  preset: string,
): { from: string; to: string } | null => {
  const today = DateTime.local().startOf("day");
  switch (preset) {
    case "Last 7 days":
      return {
        from: formatDateToISODateString(today.minus({ days: 7 })),
        to: formatDateToISODateString(today),
      };
    case "Last 28 days":
      return {
        from: formatDateToISODateString(today.minus({ days: 28 })),
        to: formatDateToISODateString(today),
      };
    case "Last month": {
      const lastMonth = today.minus({ months: 1 });
      return {
        from: formatDateToISODateString(lastMonth.startOf("month")),
        to: formatDateToISODateString(
          lastMonth.endOf("month").plus({ days: 1 }),
        ),
      };
    }
    case "Month to date":
      return {
        from: formatDateToISODateString(today.startOf("month")),
        to: formatDateToISODateString(today.plus({ days: 1 })),
      };
    default:
      return null;
  }
};

const Select = dynamic(
  () =>
    import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Select),
  { ssr: false },
);

interface ToggleOption {
  value: string;
  label: string;
}

interface OnTimeFilterPanelProps {
  isLoading: boolean;
  refineResultsInitialValues: Partial<RefineResultsFilterValues>;
  onApplyRefineResults: (values: RefineResultsFilterValues) => void;
  onResetRefineResults: () => void;
  dateRange: { from: string; to: string } | null;
  onDateRangeChange: (value: { from: string; to: string } | undefined) => void;
  datePresetOptions: string[];
  selectedDatePreset: string;
  onDatePresetChange: (selected: string) => void;
  selectedMatchType: string;
  onMatchTypeChange: (value: string) => void;
  matchTypeOptions: ToggleOption[];
  selectedStopType: string;
  onStopTypeChange: (value: string) => void;
  stopTypeOptions: ToggleOption[];
  refineResultsFilters: PerformanceFiltersInputType;
  onRefineResultsFilterChange: (filters: PerformanceFiltersInputType) => void;
}

export const OnTimeFilterPanel = ({
  isLoading,
  refineResultsInitialValues,
  onApplyRefineResults,
  onResetRefineResults,
  dateRange,
  onDateRangeChange,
  datePresetOptions,
  selectedDatePreset,
  onDatePresetChange,
  selectedMatchType,
  onMatchTypeChange,
  matchTypeOptions,
  selectedStopType,
  onStopTypeChange,
  stopTypeOptions,
  refineResultsFilters,
  onRefineResultsFilterChange,
}: OnTimeFilterPanelProps) => {
  return (
    <>
      <div className="controls-container">
        <div className="controls-date-selects-container">
          <DateRangeSelect
            hideLabel={true}
            value={dateRange || undefined}
            onChange={onDateRangeChange}
          />
          <Select
            name="date-preset"
            label=""
            items={datePresetOptions.map((preset) => ({
              value: preset,
              text: preset,
              selected: selectedDatePreset === preset,
            }))}
            onChange={(event) => onDatePresetChange(event.target.value)}
          />
        </div>
        <div className="refine-results-button-container">
          <RefineResultsButton
            isLoading={isLoading}
            initialValues={refineResultsInitialValues}
            onApply={onApplyRefineResults}
            onReset={onResetRefineResults}
          />
        </div>
        <div className="on-time-toggle-container">
          <SegmentedToggle
            legend=""
            name="match-type-toggle"
            value={selectedMatchType}
            onChange={onMatchTypeChange}
            options={matchTypeOptions}
          />
          <SegmentedToggle
            legend=""
            name="stop-type-toggle"
            value={selectedStopType}
            onChange={onStopTypeChange}
            options={stopTypeOptions}
          />
        </div>
      </div>
      <div className="filter-chips-container">
        <FilterChips
          filters={refineResultsFilters}
          onFilterChange={onRefineResultsFilterChange}
        />
      </div>
    </>
  );
};
