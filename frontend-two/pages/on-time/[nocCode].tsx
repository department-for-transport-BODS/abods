import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartNoDataWrapper } from "@/components/on-time/ChartNoDataWrapper";
import { ChartsSection } from "@/components/on-time/ChartsSection";
import { JsonSection } from "@/components/on-time/JsonSection";
import { OnTimeServicesTable } from "@/components/on-time/OnTimeServicesTable";
import { OnTimeFilterPanel } from "@/components/on-time/OnTimeFilterPanel";
import type { ServiceDisplayMode } from "@/components/on-time/OnTimeServicesTable";
import { RefineResultsFilterValues } from "@/components/shared/RefineResults/RefineResultsFilters";
import { SearchInput } from "@/components/shared/SearchInput";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { headwayService } from "@/services/on-time/headway.service";
import {
  DayOfWeekData,
  PunctualityOverview,
  ServicePerformance,
  TimeOfDayData,
  TimeSeriesData,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { buildDefaultParams } from "@/services/on-time/params";
import { settle } from "@/utils/settle";
import {
  FrequentServicePerformance,
  performanceService,
} from "@/services/on-time/performance.service";
import {
  DelayFrequencyType,
  HeadwayOverviewType,
  HeadwayTimeSeriesType,
  MatchType,
  PerformanceFiltersInputType,
} from "../../src/generated/graphql";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid";
import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { RadioOptions } from "@/components/shared/RadioOptions";
import { formatDateToISODateString } from "@/utils/dateFormatter";

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

const DISPLAY_MODE_OPTIONS = [
  { value: "percentage", label: "Percentage" },
  { value: "count", label: "Count" },
  { value: "time", label: "Time" },
] as const;

// TODO: Check what to do about Admin area in refine results panel and add
// TODO: Check whether the hyperlinks that sit around the summary stats grid need to be added
// TODO: Check why error message for chart using the wrapper is not displaying

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

interface OperatorOnTimeData {
  overview: { onTime?: PunctualityOverview; headway?: HeadwayOverviewType };
  delayFrequency: DelayFrequencyType[];
  timeSeries: TimeSeriesData[];
  timeOfDay: TimeOfDayData[];
  dayOfWeek: DayOfWeekData[];
  servicePerformance: FrequentServicePerformance[];
  servicePerformancePlain: ServicePerformance[];
  headwayTimeSeries: HeadwayTimeSeriesType[];
}

const OnTimeOperatorPage = () => {
  useRequireAuth();
  const router = useRouter();
  const { config } = useConfig();
  const nocCode =
    typeof router.query.nocCode === "string" ? router.query.nocCode : null;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Partial<OperatorOnTimeData>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [selectedDatePreset, setSelectedDatePreset] = useState("Last 7 days");
  const [selectedMatchType, setSelectedMatchType] = useState("evidenced");
  const [selectedStopType, setSelectedStopType] = useState("timing-points");
  const [selectedDisplayMode, setSelectedDisplayMode] =
    useState<ServiceDisplayMode>("percentage");
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

  const chartErrors = [errors.delayFrequency, errors.timeOfDay, errors.dayOfWeek];
  const hasNoChartData =
    !isLoading &&
    chartErrors.every((error) => !error) &&
    (data.delayFrequency?.length ?? 0) === 0 &&
    (data.timeOfDay?.length ?? 0) === 0 &&
    (data.dayOfWeek?.length ?? 0) === 0;
  const dataExpected = selectedMatchType === "evidenced";
  const wrapperNoData = hasNoChartData;
  const wrapperDataExpected = dataExpected;
  const wrapperTimingPointsNotSupported = false;
  const wrapperMinMaxDelayNotSupported = false;

  const handleDatePresetChange = (selected: string) => {
    setSelectedDatePreset(selected);
    const range = calculateDateRange(selected);
    setDateRange(range);
  };

  useEffect(() => {
    if (!config?.apiUrl || !nocCode) return;
    const load = async () => {
      setIsLoading(true);
      const defaultParams = buildDefaultParams({ nocCode });
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

      const [
        overview,
        delayFrequency,
        timeSeries,
        timeOfDay,
        dayOfWeek,
        servicePerformancePlain,
        servicePerformance,
        headwayTimeSeries,
      ] = await Promise.all([
        settle(performanceService.fetchOverviewStats(params)),
        settle(onTimeService.fetchOnTimeDelayFrequencyData(params)),
        settle(onTimeService.fetchOnTimeTimeSeriesData(params)),
        settle(onTimeService.fetchOnTimePunctualityTimeOfDayData(params)),
        settle(onTimeService.fetchOnTimePunctualityDayOfWeekData(params)),
        settle(onTimeService.fetchOnTimePerformanceList(params)),
        settle(performanceService.fetchServicePerformance(params)),
        settle(headwayService.fetchTimeSeries(params)),
      ]);

      setData({
        overview: overview.data ?? undefined,
        delayFrequency: delayFrequency.data ?? [],
        timeSeries: timeSeries.data ?? [],
        timeOfDay: timeOfDay.data ?? [],
        dayOfWeek: dayOfWeek.data ?? [],
        servicePerformancePlain: servicePerformancePlain.data ?? [],
        servicePerformance: servicePerformance.data ?? [],
        headwayTimeSeries: headwayTimeSeries.data ?? [],
      });
      setErrors({
        overview: overview.error,
        delayFrequency: delayFrequency.error,
        timeSeries: timeSeries.error,
        timeOfDay: timeOfDay.error,
        dayOfWeek: dayOfWeek.error,
        servicePerformancePlain: servicePerformancePlain.error,
        servicePerformance: servicePerformance.error,
        headwayTimeSeries: headwayTimeSeries.error,
      });
      setIsLoading(false);
    };
    load();
  }, [
    config,
    dateRange,
    nocCode,
    refineResultsFilters,
    selectedMatchType,
    selectedStopType,
  ]);

  const summaryStats = data.overview?.onTime;
  const filteredServices = useMemo(() => {
    const services = data.servicePerformance ?? [];
    const search = serviceSearch.trim().toLowerCase();
    const hasDirectionFilter = selectedDirections.length > 0;

    const normaliseDirection = (direction: string | null | undefined) => {
      const value = (direction ?? "").toLowerCase();
      if (value === "clockwise") return "outbound";
      if (value === "anticlockwise") return "inbound";
      return value;
    };

    if (!search && !hasDirectionFilter) return services;

    return services.filter((service) => {
      const searchFields = [
        service.lineId,
        service.lineInfo?.serviceName,
        service.lineInfo?.serviceNumber,
      ];

      const matchesSearch = searchFields.some((field) =>
        (field ?? "").toLowerCase().includes(search),
      );

      if (!matchesSearch) return false;

      if (!hasDirectionFilter) return true;

      const direction = normaliseDirection(service.direction);
      return selectedDirections.some(
        (selectedDirection) => direction === selectedDirection.toLowerCase(),
      );
    });
  }, [data.servicePerformance, selectedDirections, serviceSearch]);

  const summaryTotal =
    (summaryStats?.onTime ?? 0) +
    (summaryStats?.late ?? 0) +
    (summaryStats?.early ?? 0);

  const totalStopDepartures =
    (summaryStats?.scheduled ?? 0) > 0
      ? summaryStats?.scheduled ?? 0
      : (summaryStats?.completed ?? 0) + (summaryStats?.noData ?? 0);

  const recordedStopDepartures =
    (summaryStats?.completed ?? 0) > 0
      ? summaryStats?.completed ?? 0
      : summaryTotal;

  if (!nocCode) {
    return (
      <BaseLayout title="On-time performance - Analyse Bus Open Data">
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title={`On-time performance: ${nocCode}`}>
      <p className="govuk-body">
        <Link href="/on-time" className="govuk-link">
          &larr; All operators
        </Link>
      </p>
      <span className="govuk-caption-xl">On-time performance</span>
      <h1 className="govuk-heading-xl govuk-!-margin-bottom-0">All services</h1>
      <p className="govuk-caption-xl govuk-!-margin-bottom-0">TODO: Operator: {nocCode}</p>
      {isLoading ? (
        <p className="govuk-body govuk-!-margin-top-6">Loading on-time data...</p>
      ) : (
        <>
            <OnTimeFilterPanel
            isLoading={isLoading}
            refineResultsInitialValues={refineResultsInitialValues}
            onApplyRefineResults={(values) => {
              setRefineResultsFilters(refineResultsToPerformanceFilters(values));
            }}
            onResetRefineResults={() => setRefineResultsFilters({})}
            dateRange={dateRange}
            onDateRangeChange={(value) => setDateRange(value ?? null)}
            datePresetOptions={DATE_PRESET_OPTIONS}
            selectedDatePreset={selectedDatePreset}
            onDatePresetChange={handleDatePresetChange}
            selectedMatchType={selectedMatchType}
            onMatchTypeChange={setSelectedMatchType}
            matchTypeOptions={MATCH_TYPE_OPTIONS}
            selectedStopType={selectedStopType}
            onStopTypeChange={setSelectedStopType}
            stopTypeOptions={STOP_TYPE_OPTIONS}
            refineResultsFilters={refineResultsFilters}
            onRefineResultsFilterChange={setRefineResultsFilters}
          />
          <ChartNoDataWrapper
            noData={wrapperNoData}
            dataExpected={wrapperDataExpected}
            timingPointsNotSupported={wrapperTimingPointsNotSupported}
            minMaxDelayNotSupported={wrapperMinMaxDelayNotSupported}
          >
            <ChartsSection
              delayFrequency={data.delayFrequency ?? []}
              timeOfDay={data.timeOfDay ?? []}
              dayOfWeek={data.dayOfWeek ?? []}
              errors={{
                delayFrequency: errors.delayFrequency,
                timeOfDay: errors.timeOfDay,
                dayOfWeek: errors.dayOfWeek,
              }}
            />
          </ChartNoDataWrapper>
          <div className="govuk-!-margin-top-6">
            {errors.servicePerformance ? (
              <p className="govuk-body" style={{ color: "#d4351c" }}>
                Error loading service data: {errors.servicePerformance}
              </p>
            ) : (
              <>
                <div className="govuk-!-margin-bottom-6">
                  <SummaryStatsGrid
                    onTimeCount={summaryStats?.onTime ?? null}
                    lateCount={summaryStats?.late ?? null}
                    earlyCount={summaryStats?.early ?? null}
                    incompleteCount={summaryStats?.noData ?? null}
                    recordedStopDepartures={
                      recordedStopDepartures > 0 ? recordedStopDepartures : null
                    }
                    totalStopDepartures={
                      totalStopDepartures > 0 ? totalStopDepartures : null
                    }
                    incompleteBreakdown={summaryStats?.incomplete ?? null}
                    averageDelay={summaryStats?.averageDelay ?? null}
                  />
                </div>
                {/* TODO: Implement display options functionality */}
                <div className="on-time-service-filters govuk-body govuk-!-margin-top-6">
                  <div className="on-time-service-filters__inputs">
                    <div className="on-time-service-filters__search">
                      <SearchInput
                        id="service-search"
                        label="Search for a service"
                        testId=""
                        value={serviceSearch}
                        onChange={setServiceSearch}
                      />
                    </div>
                    <div className="on-time-service-filters__directions">
                      <MultiselectDropdown
                        label="Directions"
                        options={["Inbound", "Outbound"]}
                        selected={selectedDirections}
                        onChange={setSelectedDirections}
                        placeholderText="All directions"
                      />
                    </div>
                  </div>
                  <div className="on-time-service-filters__display-options">
                    <p className="on-time-service-display-options-button">
                      Display options
                    </p>
                    <div className="on-time-service-filters__radios">
                      <RadioOptions
                        name="on-time-display-mode"
                        legend="Show service performance values as"
                        options={DISPLAY_MODE_OPTIONS}
                        value={selectedDisplayMode}
                        onChange={setSelectedDisplayMode}
                      />
                    </div>
                  </div>
                </div>
                {/* TODO: Change data in table to only show journeys without direction unless filtered */}
                <OnTimeServicesTable
                  data={filteredServices}
                  nocCode={nocCode ?? ""}
                  displayMode={selectedDisplayMode}
                />
              </>
            )}
          </div>
          <JsonSection
            title="onTimeService.fetchOnTimeTimeSeriesData"
            data={data.timeSeries}
            error={errors.timeSeries}
          />
          <JsonSection
            title="onTimeService.fetchOnTimePerformanceList"
            data={data.servicePerformancePlain}
            error={errors.servicePerformancePlain}
          />
          <JsonSection
            title="headwayService.fetchTimeSeries"
            data={data.headwayTimeSeries}
            error={errors.headwayTimeSeries}
          />
        </>
      )}
    </BaseLayout>
  );
};

export default OnTimeOperatorPage;
