import { entries as getEntries } from "lodash-es";
import { PerformanceFiltersInputType } from "@/src/generated/graphql";

interface FilterChipsProps {
  filters: PerformanceFiltersInputType;
  onFilterChange: (filters: PerformanceFiltersInputType) => void;
}

const dayOfWeekValueMap = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thur",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
} as const;

const weekends = "Sat, Sun";
const weekdays = "Mon, Tue, Wed, Thur, Fri";
const DEFAULT_START_TIME = "00:00";
const DEFAULT_END_TIME = "23:59";

const getDayOfWeekValues = (filters: PerformanceFiltersInputType): string => {
  const value = getEntries(filters.dayOfWeekFlags ?? {})
    .filter(([, enabled]) => enabled)
    .map(([day]) => dayOfWeekValueMap[day as keyof typeof dayOfWeekValueMap])
    .join(", ");

  if (value === weekdays) {
    return "Weekdays";
  }

  if (value === weekends) {
    return "Weekends";
  }

  return value;
};

const FilterChip = ({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) => {
  return (
    <div className="filter-chip">
      <span className="filter-chip__label">{label}:</span>
      <span className="filter-chip__value">{value}</span>
      <button
        type="button"
        className="filter-chip__remove"
        aria-label={`Remove ${label} filter`}
        onClick={onClear}
      >
        ×
      </button>
    </div>
  );
};

export const FilterChips = ({ filters, onFilterChange }: FilterChipsProps) => {
  const isDayOfWeek = Boolean(filters.dayOfWeekFlags);
  const isTimeRange = Boolean(filters.startTime) || Boolean(filters.endTime);
  const isMinDelay = Boolean(filters.minDelay);
  const isMaxDelay = Boolean(filters.maxDelay);

  if (!isDayOfWeek && !isTimeRange && !isMinDelay && !isMaxDelay) {
    return null;
  }

  const updateFilters = (nextFilters: PerformanceFiltersInputType) => {
    onFilterChange(nextFilters);
  };

  const clearDayOfWeekFilter = () => {
    const { dayOfWeekFlags: _, ...rest } = filters;
    updateFilters(rest);
  };

  const clearTimeRangeFilter = () => {
    const { startTime: _, endTime: __, ...rest } = filters;
    updateFilters(rest);
  };

  const clearMinDelayFilter = () => {
    const { minDelay: _, ...rest } = filters;
    updateFilters(rest);
  };

  const clearMaxDelayFilter = () => {
    const { maxDelay: _, ...rest } = filters;
    updateFilters(rest);
  };

  const timeRange = `${filters.startTime ?? DEFAULT_START_TIME} - ${filters.endTime ?? DEFAULT_END_TIME}`;
  const minDelay = filters.minDelay ? `${filters.minDelay * -1} minutes` : "";
  const maxDelay = filters.maxDelay ? `${filters.maxDelay} minutes` : "";

  return (
    <ul className="filter-chips" aria-label="Active filters">
      {isDayOfWeek && (
        <li className="filter-chips__item">
          <FilterChip
            label="Day of the week"
            value={getDayOfWeekValues(filters)}
            onClear={clearDayOfWeekFilter}
          />
        </li>
      )}

      {isTimeRange && (
        <li className="filter-chips__item">
          <FilterChip
            label="Time range"
            value={timeRange}
            onClear={clearTimeRangeFilter}
          />
        </li>
      )}

      {isMinDelay && (
        <li className="filter-chips__item">
          <FilterChip
            label="Maximum early"
            value={minDelay}
            onClear={clearMinDelayFilter}
          />
        </li>
      )}

      {isMaxDelay && (
        <li className="filter-chips__item">
          <FilterChip
            label="Maximum late"
            value={maxDelay}
            onClear={clearMaxDelayFilter}
          />
        </li>
      )}
    </ul>
  );
};
