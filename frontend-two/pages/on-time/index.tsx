import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DateTime } from "luxon";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartNoDataWrapper } from "@/components/on-time/ChartNoDataWrapper";
import { FilterChips } from "@/components/on-time/FilterChips";
import { OnTimeOperatorTable } from "@/components/on-time/OnTimeOperatorTable";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid";
import { RefineResultsButton } from "@/components/shared/RefineResults/RefineResultsButton";
import { RefineResultsFilterValues } from "@/components/shared/RefineResults/RefineResultsFilters";
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
  PunctualityOverview,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { buildDefaultParams } from "@/services/on-time/params";
import { formatDateToISODateString } from "@/utils/dateFormatter";
import { SearchInput } from "@/components/shared/SearchInput";

const Select = dynamic(
  () =>
    import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Select),
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
  const [isLoading, setIsLoading] = useState(true);

  const [operatorPerformance, setOperatorPerformance] = useState<
    OperatorPerformance[]
  >([]);

  const [summaryStats, setSummaryStats] = useState<PunctualityOverview | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const [selectedDatePreset, setSelectedDatePreset] = useState("Last 7 days");
  const [selectedMatchType, setSelectedMatchType] = useState("evidenced");
  const [selectedStopType, setSelectedStopType] = useState("timing-points");
  const [operatorSearch, setOperatorSearch] = useState("");

  const [refineResultsFilters, setRefineResultsFilters] =
    useState<PerformanceFiltersInputType>({});

  const refineResultsInitialValues = useMemo(
    () => performanceFiltersToRefineResults(refineResultsFilters),
    [JSON.stringify(refineResultsFilters)],
  );
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(calculateDateRange("Last 7 days"));

  const filteredOperators = useMemo(() => {
    if (!operatorSearch) return operatorPerformance;

    const searchValue = operatorSearch.toLowerCase();
    return operatorPerformance.filter(
      (operator) =>
        (operator.name ?? "").toLowerCase().includes(searchValue));
  }, [operatorPerformance, operatorSearch]);

  const hasNoOperatorData =
    !isLoading && !error && operatorPerformance.length === 0;
  const dataExpected = selectedMatchType === "evidenced";
  const wrapperNoData = hasNoOperatorData;
  const wrapperDataExpected = dataExpected;
  const wrapperTimingPointsNotSupported = false;
  const wrapperMinMaxDelayNotSupported = false;

  const summaryTotal =
    (summaryStats?.onTime ?? 0) +
    (summaryStats?.late ?? 0) +
    (summaryStats?.early ?? 0);

  const formatPercentage = (value: number) => {
    if (summaryTotal <= 0) return "-";
    return `${((value / summaryTotal) * 100).toFixed(2)}%`;
  };

  const recordedStopDepartures =
    (summaryStats?.completed ?? 0) > 0
      ? summaryStats?.completed ?? 0
      : summaryTotal;

  const formattedRecordedStopDepartures = new Intl.NumberFormat("en-GB").format(
    Math.max(0, Math.round(recordedStopDepartures)),
  );

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
            ...refineResultsFilters,
            matchType:
              selectedMatchType === "evidenced"
                ? MatchType.Evidenced
                : MatchType.Estimated,
            timingPointsOnly: selectedStopType === "timing-points",
          },
        };

        const [operatorData, stats] = await Promise.all([
          onTimeService.fetchOperatorPerformanceList(params),
          onTimeService.fetchOnTimeStats(params),
        ]);

        setOperatorPerformance(operatorData);
        setSummaryStats(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setSummaryStats(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [
    config,
    refineResultsFilters,
    dateRange,
    selectedMatchType,
    selectedStopType,
  ]);

  return (
    <BaseLayout title="All services - Analyse Bus Open Data">
      <span className="govuk-caption-xl">On-time performance</span>
      <h1 className="govuk-heading-xl">All services</h1>
      <div className="controls-container">
        <div className="controls-date-selects-container">
          <DateRangeSelect
            hideLabel={true}
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
        <div className="controls-filters-container">
          <div className="refine-results-button-container">
            <RefineResultsButton
              isLoading={isLoading}
              initialValues={refineResultsInitialValues}
              onApply={(values) => {
                setRefineResultsFilters(
                  refineResultsToPerformanceFilters(values),
                );
              }}
              onReset={() => setRefineResultsFilters({})}
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
      </div>
      <div className="filter-chips-container">
        <FilterChips
          filters={refineResultsFilters}
          onFilterChange={setRefineResultsFilters}
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
            {/* TODO: Add admin area dropdown */}
            <div className="summary-content-wrapper">
              <div className="summary-stat-container">
                <p className="govuk-body-l"><b>{formattedRecordedStopDepartures}</b> departures recorded</p>
                <SummaryStatsGrid
                  onTime={formatPercentage(summaryStats?.onTime ?? 0)}
                  onTimeCount={summaryStats?.onTime ?? null}
                  lateCount={summaryStats?.late ?? null}
                  earlyCount={summaryStats?.early ?? null}
                  incompleteCount={summaryStats?.noData ?? null}
                  recordedStopDepartures={recordedStopDepartures > 0 ? recordedStopDepartures : null}
                  late={formatPercentage(summaryStats?.late ?? 0)}
                  early={formatPercentage(summaryStats?.early ?? 0)}
                  incompleteData={formatPercentage(summaryStats?.noData ?? 0)}
                  incompleteBreakdown={summaryStats?.incomplete ?? null}
                  averageDelay={summaryStats?.averageDelay ?? null}
                />
              </div>
              <div className="summary-map-container">
              {/* TODO: Add map */}
              </div>
            </div>
          </ChartNoDataWrapper>
        )}
      </div>
      <div className="operator-container">
        <h2 className="govuk-heading-m">Operators</h2>
        {isLoading ? (
          <p className="govuk-body">Loading operator data...</p>
        ) : (
          <ChartNoDataWrapper
            noData={wrapperNoData}
            dataExpected={wrapperDataExpected}
            timingPointsNotSupported={wrapperTimingPointsNotSupported}
            minMaxDelayNotSupported={wrapperMinMaxDelayNotSupported}
          >
            <SearchInput
              id="operator-search"
              label="Search for an operator"
              testId=""
              value={operatorSearch}
              onChange={setOperatorSearch}
            />
            {/* TODO: Add sparkline to table */}
            <OnTimeOperatorTable data={filteredOperators} />
          </ChartNoDataWrapper>
        )}
      </div>
    </BaseLayout>
  );
};

export default OnTimeIndexPage;