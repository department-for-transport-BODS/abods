import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Period } from "@/utils/dateRange";
import { StopTypeOption } from "@/types/stop-analysis";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect/DateRangeSelect";
import { LocationLookupField } from "@/components/shared/LocationLookupField";
import { MatchTypeToggle, StopTypeToggle } from "./Toggles";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox";
import {
  AdminAreasType,
  LineType,
  MatchType,
  OperatorType,
} from "@/src/generated/graphql";

interface StopAnalysisFiltersProps {
  fromTimestamp: string;
  toTimestamp: string;
  adminAreaIds: string[];
  operatorIds: string[];
  lineIds: string[];
  matchType: MatchType;
  stopType: StopTypeOption;
  adminAreas: AdminAreasType[];
  operators: OperatorType[];
  lines: LineType[];
  mapboxToken?: string;
  onDateRangeChange: (from: string, to: string) => void;
  onAdminAreasChange: (values: string[]) => void;
  onOperatorsChange: (values: string[]) => void;
  onLinesChange: (values: string[]) => void;
  onMatchTypeChange: (value: MatchType) => void;
  onStopTypeChange: (value: StopTypeOption) => void;
  onLocationSelect: (location: {
    center?: [number, number];
    bbox?: [number, number, number, number];
  }) => void;
  onPresetChange: (preset: Period) => void;
}

const PRESET_OPTIONS: { value: Period; label: string }[] = [
  { value: "last7", label: "Last 7 days" },
  { value: "last28", label: "Last 28 days" },
  { value: "monthToDate", label: "Month to date" },
  { value: "lastMonth", label: "Last month" },
];

function getPresetWindow(preset: Period, today: DateTime) {
  const yesterday = today.minus({ days: 1 });

  switch (preset) {
    case "last7":
      return {
        from: today.minus({ days: 7 }),
        to: yesterday,
      };
    case "last28":
      return {
        from: today.minus({ days: 28 }),
        to: yesterday,
      };
    case "monthToDate":
      return {
        from: today.startOf("month"),
        to: yesterday,
      };
    case "lastMonth": {
      const from = today.minus({ months: 1 }).startOf("month");
      return {
        from,
        to: from.plus({ months: 1 }).minus({ days: 1 }),
      };
    }
  }
}

export const StopAnalysisFilters = ({
  fromTimestamp,
  toTimestamp,
  adminAreaIds,
  operatorIds,
  lineIds,
  matchType,
  stopType,
  adminAreas,
  operators,
  lines,
  mapboxToken,
  onDateRangeChange,
  onAdminAreasChange,
  onOperatorsChange,
  onLinesChange,
  onMatchTypeChange,
  onStopTypeChange,
  onLocationSelect,
  onPresetChange,
}: StopAnalysisFiltersProps) => {
  const [locationQuery, setLocationQuery] = useState("");

  const adminAreaOptions = useMemo(
    () =>
      adminAreas
        .map((area) => ({ label: area.name, value: area.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [adminAreas],
  );

  const operatorOptions = useMemo(
    () =>
      operators
        .filter(
          (op) =>
            adminAreaIds.length === 0 ||
            op.adminAreaIds.some((a) => adminAreaIds.includes(a)),
        )
        .map((op) => ({
          label: `${op.name} (${op.operatorId})`,
          value: op.operatorId,
        })),
    [operators, adminAreaIds],
  );

  const lineOptions = useMemo(
    () =>
      lines
        .filter(
          (line) =>
            adminAreaIds.length === 0 ||
            line.adminAreaIds.some((a) => adminAreaIds.includes(a.toString())),
        )
        .map((line) => ({
          label: `${line.number}: ${line.name}`,
          value: line.id,
        })),
    [lines, adminAreaIds],
  );

  const activePreset = useMemo<Period | "custom">(() => {
    const currentFrom = DateTime.fromISO(fromTimestamp);
    const currentToInclusive = DateTime.fromISO(toTimestamp).minus({ days: 1 });
    if (!currentFrom.isValid || !currentToInclusive.isValid) {
      return "custom";
    }

    const now = DateTime.local();
    for (const option of PRESET_OPTIONS) {
      const window = getPresetWindow(option.value, now);
      if (
        currentFrom.hasSame(window.from, "day") &&
        currentToInclusive.hasSame(window.to, "day")
      ) {
        return option.value;
      }
    }

    return "custom";
  }, [fromTimestamp, toTimestamp]);

  const handlePresetChange = (preset: Period) => {
    onPresetChange(preset);
  };

  return (
    <div className="stop-analysis-filters">
      <div className="filters stop-analysis-filters__grid govuk-!-margin-bottom-2">
        <div className="stop-analysis-filters__item stop-analysis-filters__item--date">
          <label className="govuk-label">Date Range</label>
          <div className="stop-analysis-filters__date-range">
            <DateRangeSelect
              value={{ from: fromTimestamp, to: toTimestamp }}
              onChange={({ from, to }) => onDateRangeChange(from, to)}
              hideLabel
            />
            <select
              className="govuk-select stop-analysis-filters__preset-select"
              value={activePreset}
              onChange={(event) =>
                handlePresetChange(event.target.value as Period)
              }
              aria-label="Preset date range"
            >
              {PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {activePreset === "custom" && (
                <option value="custom">Custom</option>
              )}
            </select>
          </div>
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--admin">
          <MultiselectCheckbox
            id="sa-admin-areas"
            label="Admin Areas"
            options={adminAreaOptions}
            selectedValues={adminAreaIds}
            onChange={onAdminAreasChange}
            showAllLabel="All Areas"
            placeholder="Admin Areas"
          />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--toggles stop-analysis-filters__toggles">
          <MatchTypeToggle matchType={matchType} onChange={onMatchTypeChange} />
          <StopTypeToggle stopType={stopType} onChange={onStopTypeChange} />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--location">
          <LocationLookupField
            id="sa-location-search"
            label="Location name or postcode"
            value={locationQuery}
            onValueChange={setLocationQuery}
            onSelect={(location) => {
              onLocationSelect({
                center: location.center,
                bbox: location.bbox,
              });
            }}
            mapboxToken={mapboxToken}
            disabled={!mapboxToken}
          />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--operators">
          <MultiselectCheckbox
            id="sa-operators"
            label="Operators"
            options={operatorOptions}
            selectedValues={operatorIds}
            onChange={onOperatorsChange}
            showAllLabel="All Operators"
            placeholder="Operators"
          />
        </div>

        <div className="stop-analysis-filters__item stop-analysis-filters__item--services">
          <MultiselectCheckbox
            id="sa-services"
            label="Services"
            options={lineOptions}
            selectedValues={lineIds}
            onChange={onLinesChange}
            showAllLabel="All Services"
            placeholder="Services"
            disabled={operatorIds.length === 0}
          />
        </div>
      </div>
    </div>
  );
};
