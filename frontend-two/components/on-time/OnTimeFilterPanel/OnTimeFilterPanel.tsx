import styles from "./on-time-filter-panel.module.scss";

import { DateTime } from "luxon";
import { FilterChips } from "@/components/on-time/FilterChips/FilterChips";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect/DateRangeSelect";
import { RefineResultsButton } from "@/components/shared/RefineResults/RefineResultsButton";
import {
  RefineResultsAdminAreaOption,
  RefineResultsFilterValues,
} from "@/components/shared/RefineResults/RefineResultsFilters";
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

interface ToggleOption {
  value: string;
  label: string;
}

interface OnTimeFilterPanelProps {
  isLoading: boolean;
  showAdminAreaFilter?: boolean;
  adminAreaOptions?: RefineResultsAdminAreaOption[];
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
  showAdminAreaFilter = false,
  adminAreaOptions = [],
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
  const datePresetItems =
    selectedDatePreset === "Custom" && !datePresetOptions.includes("Custom")
      ? [...datePresetOptions, "Custom"]
      : datePresetOptions;

  return (
    <>
      <div className={styles.filterRow}>
        <div className={styles.datePicker}>
          <DateRangeSelect
            hideLabel={true}
            value={dateRange || undefined}
            onChange={onDateRangeChange}
          />
          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="date-preset">
              Date preset
            </label>
            <select
              id="date-preset"
              name="date-preset"
              className="govuk-select"
              value={selectedDatePreset}
              onChange={(event) => onDatePresetChange(event.target.value)}
            >
              {datePresetItems.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.refineResultsButtonContainer}>
          <RefineResultsButton
            isLoading={isLoading}
            showAdminAreaFilter={showAdminAreaFilter}
            adminAreaOptions={adminAreaOptions}
            initialValues={refineResultsInitialValues}
            onApply={onApplyRefineResults}
            onReset={onResetRefineResults}
          />
        </div>
        <div className={styles.toggleContainer}>
          <SegmentedToggle
            legend="Match type"
            hideLegend
            name="match-type-toggle"
            value={selectedMatchType}
            onChange={onMatchTypeChange}
            options={matchTypeOptions}
            className="fullWidth"
          />
          <SegmentedToggle
            legend="Stop type"
            hideLegend
            name="stop-type-toggle"
            value={selectedStopType}
            onChange={onStopTypeChange}
            options={stopTypeOptions}
            className="fullWidth"
          />
        </div>
      </div>
      <div className={styles.filterChipsContainer}>
        <FilterChips
          filters={refineResultsFilters}
          adminAreaOptions={adminAreaOptions}
          onFilterChange={onRefineResultsFilterChange}
        />
      </div>
    </>
  );
};
