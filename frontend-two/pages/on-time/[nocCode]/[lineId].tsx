import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { JsonSection } from "@/components/on-time/JsonSection";
import {
  OnTimeStopsTable,
  type StopDisplayMode,
} from "@/components/on-time/OnTimeStopsTable";
import { OnTimeFilterPanel } from "@/components/on-time/OnTimeFilterPanel";
import { RefineResultsFilterValues } from "@/components/shared/RefineResults/RefineResultsFilters";
import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { RadioOptions } from "@/components/shared/RadioOptions";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { headwayService } from "@/services/on-time/headway.service";
import {
  StopPerformance,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { DateTime } from "luxon";
import { buildDefaultParams } from "@/services/on-time/params";
import {
  NormalizedStop,
  stopPerformanceService,
} from "@/services/on-time/stop-performance.service";
import {
  ServicePattern,
  transitModelService,
} from "@/services/on-time/transit-model.service";
import { settle } from "@/utils/settle";
import {
  FrequentServiceInfoType,
  Granularity,
  HeadwayTimeSeriesType,
  MatchType,
  PerformanceFiltersInputType,
  ServiceInfoType,
} from "../../../src/generated/graphql";
import { formatDateToISODateString } from "@/utils/dateFormatter";
import { Box } from "@/components/shared/Box";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid";

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

const ExcessWaitTimeChart = dynamic(
  () => import("@/components/on-time/ExcessWaitTimeChart"),
  { ssr: false },
);

const DISPLAY_MODE_OPTIONS = [
  { value: "percentage", label: "Percentage" },
  { value: "count", label: "Count" },
  { value: "time", label: "Time" },
] as const;

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

interface ServiceLevelData {
  fromTimestamp: string;
  toTimestamp: string;
  serviceInfo: ServiceInfoType | null;
  stopPerformance: StopPerformance[];
  servicePatterns: ServicePattern[];
  mergedStops: NormalizedStop[];
  frequentServiceInfo: FrequentServiceInfoType | null;
  headwayTimeSeries: HeadwayTimeSeriesType[];
}

const OnTimeServicePage = () => {
  useRequireAuth();
  const router = useRouter();
  const { config } = useConfig();
  const nocCode =
    typeof router.query.nocCode === "string" ? router.query.nocCode : null;
  const lineId =
    typeof router.query.lineId === "string" ? router.query.lineId : null;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Partial<ServiceLevelData>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [selectedDisplayMode, setSelectedDisplayMode] =
    useState<StopDisplayMode>("percentage");
  const [selectedDatePreset, setSelectedDatePreset] = useState("Last 7 days");
  const [selectedMatchType, setSelectedMatchType] = useState("evidenced");
  const [selectedStopType, setSelectedStopType] = useState("timing-points");
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

  const handleDatePresetChange = (selected: string) => {
    setSelectedDatePreset(selected);
    const range = calculateDateRange(selected);
    setDateRange(range);
  };

  const filteredStopPerformance = useMemo(() => {
    const stopPerformance = data.stopPerformance ?? [];
    if (selectedDirections.length === 0) return stopPerformance;

    return stopPerformance.filter((stop) => {
      if (!stop.direction) return false;
      const normalizedDirection = stop.direction.toLowerCase();

      return selectedDirections.some(
        (selectedDirection) =>
          selectedDirection.toLowerCase() === normalizedDirection,
      );
    });
  }, [data.stopPerformance, selectedDirections]);

  const summaryStats = useMemo(() => {
    if (filteredStopPerformance.length === 0) {
      return {
        onTimeCount: 0,
        lateCount: 0,
        earlyCount: 0,
        incompleteCount: 0,
        recordedStopDepartures: 0,
        totalStopDepartures: 0,
        averageDelay: null as number | null,
      };
    }

    const totalStopDepartures = filteredStopPerformance.reduce(
      (sum, row) => sum + (row.scheduledDepartures ?? 0),
      0,
    );
    const recordedStopDepartures = filteredStopPerformance.reduce(
      (sum, row) => sum + (row.actualDepartures ?? 0),
      0,
    );
    const onTimeCount = filteredStopPerformance.reduce(
      (sum, row) => sum + (row.onTime ?? 0),
      0,
    );
    const lateCount = filteredStopPerformance.reduce(
      (sum, row) => sum + (row.late ?? 0),
      0,
    );
    const earlyCount = filteredStopPerformance.reduce(
      (sum, row) => sum + (row.early ?? 0),
      0,
    );
    const incompleteCount = Math.max(
      0,
      totalStopDepartures - recordedStopDepartures,
    );

    const weightedDelayTotal = filteredStopPerformance.reduce((sum, row) => {
      if (row.averageDelay == null) return sum;
      return sum + row.averageDelay * (row.actualDepartures ?? 0);
    }, 0);

    const averageDelay =
      recordedStopDepartures > 0
        ? weightedDelayTotal / recordedStopDepartures
        : null;

    return {
      onTimeCount,
      lateCount,
      earlyCount,
      incompleteCount,
      recordedStopDepartures,
      totalStopDepartures,
      averageDelay,
    };
  }, [filteredStopPerformance]);

  useEffect(() => {
    if (!config?.apiUrl || !nocCode || !lineId) return;
    const load = async () => {
      setIsLoading(true);
      const defaultParams = buildDefaultParams({ nocCode, lineId });
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

      const fromDate = DateTime.fromISO(params.fromTimestamp);
      const toDate = DateTime.fromISO(params.toTimestamp);
      const granularity =
        Math.abs(toDate.diff(fromDate, "days").days) <= 5
          ? Granularity.Hour
          : Granularity.Day;
      const headwayParams = {
        ...params,
        filters: { ...params.filters, granularity },
      };

      const [serviceInfo, stopPerformance, servicePatterns, headwayTimeSeries] =
        await Promise.all([
          settle(onTimeService.fetchServiceInfo(lineId)),
          settle(onTimeService.fetchStopPerformanceList(params)),
          settle(transitModelService.fetchServicePatternStops(nocCode, lineId)),
          settle(headwayService.fetchTimeSeries(headwayParams)),
        ]);

      const frequentServiceInfo = await settle(
        headwayService.fetchFrequentServiceInfo(params),
      );

      const mergedStops =
        stopPerformance.data && servicePatterns.data
          ? stopPerformanceService.mergeStops(
              stopPerformance.data,
              servicePatterns.data,
            )
          : [];

      setData({
        fromTimestamp: params.fromTimestamp,
        toTimestamp: params.toTimestamp,
        serviceInfo: serviceInfo.data,
        stopPerformance: stopPerformance.data ?? [],
        servicePatterns: servicePatterns.data ?? [],
        mergedStops,
        frequentServiceInfo: frequentServiceInfo.data,
        headwayTimeSeries: headwayTimeSeries.data ?? [],
      });
      setErrors({
        serviceInfo: serviceInfo.error,
        stopPerformance: stopPerformance.error,
        servicePatterns: servicePatterns.error,
        frequentServiceInfo: frequentServiceInfo.error,
        headwayTimeSeries: headwayTimeSeries.error,
      });
      setIsLoading(false);
    };
    load();
  }, [
    config,
    dateRange,
    lineId,
    nocCode,
    refineResultsFilters,
    selectedMatchType,
    selectedStopType,
  ]);

  if (!nocCode || !lineId) {
    return (
      <BaseLayout title="On-time performance - Analyse Bus Open Data">
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title={`On-time performance: ${nocCode} / ${lineId}`}>
      <p className="govuk-body">
        <Link
          href={`/on-time/${encodeURIComponent(nocCode)}`}
          className="govuk-link"
        >
          &larr; Back to {nocCode}
        </Link>
      </p>
      <span className="govuk-caption-xl">On-time performance</span>
      <h1 className="govuk-heading-xl govuk-!-margin-bottom-0">{lineId}</h1>
      <span className="govuk-caption-xl govuk-!-margin-bottom-0">{nocCode}</span>
      {isLoading ? (
        <p className="govuk-body govuk-!-margin-top-6">Loading service data...</p>
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
          <div className="summary-map-container">
            <Box minHeight="320px">
              <p className="govuk-body">TODO: Add map</p>
            </Box>
          </div>
          <div className="govuk-!-margin-top-6">
            <SummaryStatsGrid
              onTimeCount={summaryStats.onTimeCount}
              lateCount={summaryStats.lateCount}
              earlyCount={summaryStats.earlyCount}
              incompleteCount={summaryStats.incompleteCount}
              recordedStopDepartures={
                summaryStats.recordedStopDepartures > 0
                  ? summaryStats.recordedStopDepartures
                  : null
              }
              totalStopDepartures={
                summaryStats.totalStopDepartures > 0
                  ? summaryStats.totalStopDepartures
                  : null
              }
              incompleteBreakdown={null}
              averageDelay={summaryStats.averageDelay}
            />
          </div>
          <div className="on-time-service-filters govuk-!-margin-top-6">
            <div className="on-time-service-filters__directions">
              <MultiselectDropdown
                label="Directions"
                options={["Inbound", "Outbound"]}
                selected={selectedDirections}
                onChange={setSelectedDirections}
                placeholderText="All directions"
              />
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
          {/* TODO: Only show data with directions if filtered */}
          <div className="govuk-!-margin-top-6">
            <OnTimeStopsTable
              data={filteredStopPerformance}
              displayMode={selectedDisplayMode}
            />
          </div>
          <JsonSection
            title="onTimeService.fetchServiceInfo"
            data={data.serviceInfo}
            error={errors.serviceInfo}
          />
          <JsonSection
            title="onTimeService.fetchStopPerformanceList"
            data={data.stopPerformance}
            error={errors.stopPerformance}
          />
          <JsonSection
            title="transitModelService.fetchServicePatternStops"
            data={data.servicePatterns}
            error={errors.servicePatterns}
          />
          <JsonSection
            title="stopPerformanceService.mergeStops"
            description="Merges transit model stops with normalized on-time stop performance."
            data={data.mergedStops}
          />
          <JsonSection
            title="headwayService.fetchFrequentServiceInfo"
            data={data.frequentServiceInfo}
            error={errors.frequentServiceInfo}
          />
          {errors.headwayTimeSeries ? (
            <p className="govuk-error-message govuk-!-margin-top-6">
              <span className="govuk-visually-hidden">Error:</span>{" "}
              {errors.headwayTimeSeries}
            </p>
          ) : (data.frequentServiceInfo?.numHours ?? 0) > 0 ? (
            <>
              <ExcessWaitTimeChart
                data={data.headwayTimeSeries ?? []}
                fromTimestamp={data.fromTimestamp ?? ""}
                toTimestamp={data.toTimestamp ?? ""}
              />
              <p className="govuk-body govuk-!-margin-top-3">
                {data.frequentServiceInfo?.numHours} hours out of a total{" "}
                {data.frequentServiceInfo?.totalHours} service hours during the
                selected period operated on a frequent service basis. Excess
                Waiting Time is averaged over the period in which the service is
                running on a frequent basis.
              </p>
            </>
          ) : (
            <p className="govuk-!-margin-top-6 govuk-body">
              Excess waiting time is unavailable for this service in the
              selected period because no frequent service hours were found.
            </p>
          )}
        </>
      )}
    </BaseLayout>
  );
};

export default OnTimeServicePage;
