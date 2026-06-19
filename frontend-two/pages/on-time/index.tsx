import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DateTime, Duration } from "luxon";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartNoDataWrapper } from "@/components/on-time/ChartNoDataWrapper";
import { FilterChips } from "@/components/on-time/FilterChips";
import { JsonSection } from "@/components/on-time/JsonSection";
import { RefineResultsPanel } from "@/components/on-time/RefineResults/RefineResultsPanel";
import { RefineResultsFilterValues } from "@/components/on-time/RefineResults/RefineResultsFilters";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  MatchType,
  PerformanceFiltersInputType,
} from "@/src/generated/graphql";
import {
  OperatorPerformance,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { buildDefaultParams } from "@/services/on-time/params";
import { formatDateToISODateString } from "@/utils/dateFormatter";

const Select = dynamic(
  () =>
    import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Select),
  { ssr: false },
);

const Table = dynamic(
  () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Table),
  { ssr: false },
);

const DATE_PRESET_OPTIONS = [
  "Last 7 days",
  "Last 28 days",
  "Last month",
  "Month to date",
];

const MATCH_TYPE_OPTIONS = [
  { value: "estimated", label: "Estimated" },
  { value: "evidenced", label: "Evidenced" },
];

const STOP_TYPE_OPTIONS = [
  { value: "all-stops", label: "All stops" },
  { value: "timing-points", label: "Timing points" },
];

const refineResultsToPerformanceFilters = (
  values: RefineResultsFilterValues,
): PerformanceFiltersInputType => {
  const hasCustomDaySelection = Object.values(values.dayOfWeekFlags).some(
    (enabled) => !enabled,
  );

  return {
    ...(hasCustomDaySelection
      ? {
          dayOfWeekFlags: {
            monday: values.dayOfWeekFlags.Mon,
            tuesday: values.dayOfWeekFlags.Tue,
            wednesday: values.dayOfWeekFlags.Wed,
            thursday: values.dayOfWeekFlags.Thu,
            friday: values.dayOfWeekFlags.Fri,
            saturday: values.dayOfWeekFlags.Sat,
            sunday: values.dayOfWeekFlags.Sun,
          },
        }
      : {}),
    ...(values.startTime !== "00:00" ? { startTime: values.startTime } : {}),
    ...(values.endTime !== "23:59" ? { endTime: values.endTime } : {}),
    ...(values.minDelayStr !== "none"
      ? { minDelay: -1 * Number(values.minDelayStr) }
      : {}),
    ...(values.maxDelayStr !== "none"
      ? { maxDelay: Number(values.maxDelayStr) }
      : {}),
  };
};

const performanceFiltersToRefineResults = (
  filters: PerformanceFiltersInputType,
): Partial<RefineResultsFilterValues> => {
  return {
    ...(filters.dayOfWeekFlags
      ? {
          dayOfWeekFlags: {
            Mon: Boolean(filters.dayOfWeekFlags.monday),
            Tue: Boolean(filters.dayOfWeekFlags.tuesday),
            Wed: Boolean(filters.dayOfWeekFlags.wednesday),
            Thu: Boolean(filters.dayOfWeekFlags.thursday),
            Fri: Boolean(filters.dayOfWeekFlags.friday),
            Sat: Boolean(filters.dayOfWeekFlags.saturday),
            Sun: Boolean(filters.dayOfWeekFlags.sunday),
          },
        }
      : {}),
    ...(filters.startTime ? { startTime: filters.startTime } : {}),
    ...(filters.endTime ? { endTime: filters.endTime } : {}),
    ...(typeof filters.minDelay === "number"
      ? {
          minDelayStr: String(
            Math.abs(filters.minDelay),
          ) as RefineResultsFilterValues["minDelayStr"],
        }
      : {}),
    ...(typeof filters.maxDelay === "number"
      ? {
          maxDelayStr: String(
            filters.maxDelay,
          ) as RefineResultsFilterValues["maxDelayStr"],
        }
      : {}),
  };
};

const calculateDateRange = (
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

const OnTimeIndexPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const [showRefineResults, setShowRefineResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorPerformance, setOperatorPerformance] = useState<
    OperatorPerformance[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDatePreset, setSelectedDatePreset] = useState("Last 7 days");
  const [selectedMatchType, setSelectedMatchType] = useState("evidenced");
  const [selectedStopType, setSelectedStopType] = useState("timing-points");
  const [activeFilters, setActiveFilters] =
    useState<PerformanceFiltersInputType>({});
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(calculateDateRange("Last 7 days"));
  const hasNoOperatorData =
    !isLoading && !error && operatorPerformance.length === 0;
  const dataExpected = selectedMatchType === "evidenced";
  const wrapperNoData = hasNoOperatorData;
  const wrapperDataExpected = dataExpected;
  const wrapperTimingPointsNotSupported = false;
  const wrapperMinMaxDelayNotSupported = false;

  const handleDatePresetChange = (selected: string) => {
    setSelectedDatePreset(selected);
    const range = calculateDateRange(selected);
    setDateRange(range);
  };

  useEffect(() => {
    if (!config?.apiUrl) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const defaultParams = buildDefaultParams();

        const params = {
          ...defaultParams,
          ...(dateRange
            ? {
                fromTimestamp: dateRange.from,
                toTimestamp: dateRange.to,
              }
            : {}),
          filters: {
            ...defaultParams.filters,
            ...activeFilters,
            matchType:
              selectedMatchType === "evidenced"
                ? MatchType.Evidenced
                : MatchType.Estimated,
            timingPointsOnly: selectedStopType === "timing-points",
          },
        };

        const data = await onTimeService.fetchOperatorPerformanceList(params);
        setOperatorPerformance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [config, activeFilters, dateRange, selectedMatchType, selectedStopType]);

  return (
    <BaseLayout title="All services - Analyse Bus Open Data">
      <span className="govuk-caption-xl">On-time performance</span>
      <h1 className="govuk-heading-xl">All services</h1>
      {/* <p className="govuk-body">
        Skeleton page for the on-time performance migration. Data shown is
        fetched from the same GraphQL operations used by the existing Angular
        app and displayed as JSON for verification.
      </p> */}

      <div className="controls-container">
        <div className="controls-date-selects-container">
          <DateRangeSelect
            label=""
            value={dateRange || undefined}
            onChange={setDateRange}
          />
          <Select
            name="date-preset"
            label=""
            items={DATE_PRESET_OPTIONS.map((preset) => ({
              value: preset,
              text: preset,
              selected: selectedDatePreset === preset,
            }))}
            onChange={(event) => handleDatePresetChange(event.target.value)}
          />
        </div>
        <div className="refine-results-button-container">
          <button
            type="button"
            className="on-time-refine-results-button govuk-link"
            onClick={() => setShowRefineResults(true)}
          >
            <svg
              className="on-time-refine-results-button__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.7439 5H20.5C21.3284 5 22 5.67157 22 6.5C22 7.32843 21.3284 8 20.5 8H13.7439C13.1262 9.74779 11.4593 11 9.5 11C7.54067 11 5.87381 9.74779 5.25606 8H3.5C2.67157 8 2 7.32843 2 6.5C2 5.67157 2.67157 5 3.5 5H5.25606C5.87381 3.25221 7.54067 2 9.5 2C11.4593 2 13.1262 3.25221 13.7439 5ZM7 6.5C7 7.88071 8.11929 9 9.5 9C10.8807 9 12 7.88071 12 6.5C12 5.11929 10.8807 4 9.5 4C8.11929 4 7 5.11929 7 6.5Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.7439 16H20.5C21.3284 16 22 16.6716 22 17.5C22 18.3284 21.3284 19 20.5 19H18.7439C18.1262 20.7478 16.4593 22 14.5 22C12.5407 22 10.8738 20.7478 10.2561 19H3.5C2.67157 19 2 18.3284 2 17.5C2 16.6716 2.67157 16 3.5 16H10.2561C10.8738 14.2522 12.5407 13 14.5 13C16.4593 13 18.1262 14.2522 18.7439 16ZM12 17.5C12 18.8807 13.1193 20 14.5 20C15.8807 20 17 18.8807 17 17.5C17 16.1193 15.8807 15 14.5 15C13.1193 15 12 16.1193 12 17.5Z"
                fill="currentColor"
              />
            </svg>
            <a href="#" className="govuk-link--no-visited-state">
              Refine results
            </a>
          </button>
          <RefineResultsPanel
            isOpen={showRefineResults}
            isLoading={isLoading}
            initialValues={performanceFiltersToRefineResults(activeFilters)}
            onApply={(values) => {
              setActiveFilters(refineResultsToPerformanceFilters(values));
              setShowRefineResults(false);
            }}
            onReset={() => setActiveFilters({})}
            onCancel={() => setShowRefineResults(false)}
          />
        </div>
        <div className="on-time-toggle-container">
          <SegmentedToggle
            legend=""
            name="match-type-toggle"
            value={selectedMatchType}
            onChange={setSelectedMatchType}
            options={MATCH_TYPE_OPTIONS}
          />
          <SegmentedToggle
            legend=""
            name="stop-type-toggle"
            value={selectedStopType}
            onChange={setSelectedStopType}
            options={STOP_TYPE_OPTIONS}
          />
        </div>
      </div>
      <div className="filter-chips-container">
        <FilterChips
          filters={activeFilters}
          onFilterChange={setActiveFilters}
        />
      </div>
      <div className="summary-container">
        <h2 className="govuk-heading-l">Summary</h2>
        {isLoading ? (
          <p className="govuk-body">Loading on-time data...</p>
        ) : (
          <ChartNoDataWrapper
            noData={wrapperNoData}
            dataExpected={wrapperDataExpected}
            timingPointsNotSupported={wrapperTimingPointsNotSupported}
            minMaxDelayNotSupported={wrapperMinMaxDelayNotSupported}
          >
            <JsonSection
              title="onTimeOperatorPerformanceList"
              description="Operator-level on-time performance, last 7 days."
              data={operatorPerformance}
              error={error}
            />
          </ChartNoDataWrapper>
        )}
      </div>
      <div className="operator-container">
        <h2 className="govuk-heading-m">Operators</h2>
        <p className="govuk-body">
          Unformatted table used for validation purposes
        </p>
        <p className="govuk-body">
          Total operators fetched: <strong>{operatorPerformance.length}</strong>
        </p>
        {isLoading ? (
          <p className="govuk-body">Loading operator data...</p>
        ) : (
          <ChartNoDataWrapper
            noData={wrapperNoData}
            dataExpected={wrapperDataExpected}
            timingPointsNotSupported={wrapperTimingPointsNotSupported}
            minMaxDelayNotSupported={wrapperMinMaxDelayNotSupported}
          >
            <Table
              head={[
                { content: "NOC" },
                { content: "Operator" },
                {
                  content: "Av. delay",
                  classes: "govuk-table__header--numeric",
                },
                {
                  content: "On-time %",
                  classes: "govuk-table__header--numeric",
                },
                { content: "Late %", classes: "govuk-table__header--numeric" },
                { content: "Early %", classes: "govuk-table__header--numeric" },
              ]}
              rows={operatorPerformance
                .filter((op): op is OperatorPerformance & { nocCode: string } =>
                  Boolean(op.nocCode),
                )
                .map((op) => {
                  const delay = op.averageDelay;
                  const formattedDelay =
                    delay == null
                      ? "-"
                      : (Math.round(delay) >= 0 ? "+" : "-") +
                        Duration.fromObject({
                          seconds: Math.abs(Math.round(delay)),
                        }).toFormat("mm:ss");
                  return [
                    { content: op.nocCode },
                    {
                      content: (
                        <Link
                          href={`/on-time/${encodeURIComponent(op.nocCode)}`}
                          className="govuk-link"
                        >
                          {op.name}
                        </Link>
                      ),
                    },
                    {
                      content: formattedDelay,
                      classes: "govuk-table__cell--numeric",
                    },
                    {
                      content:
                        op.onTimeRatio != null
                          ? `${(op.onTimeRatio * 100).toFixed(1)}%`
                          : "-",
                      classes: "govuk-table__cell--numeric",
                    },
                    {
                      content:
                        op.lateRatio != null
                          ? `${(op.lateRatio * 100).toFixed(1)}%`
                          : "-",
                      classes: "govuk-table__cell--numeric",
                    },
                    {
                      content:
                        op.earlyRatio != null
                          ? `${(op.earlyRatio * 100).toFixed(1)}%`
                          : "-",
                      classes: "govuk-table__cell--numeric",
                    },
                  ];
                })}
            />
          </ChartNoDataWrapper>
        )}
      </div>
    </BaseLayout>
  );
};

export default OnTimeIndexPage;
