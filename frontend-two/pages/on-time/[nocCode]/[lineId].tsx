import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartsSection } from "@/components/on-time/ChartsSection";
import { OnTimeServiceMap } from "@/components/on-time/OnTimeServiceMap/OnTimeServiceMap";
import {
  OnTimeStopsTable,
  STOPS_TABLE_COLUMN_KEYS,
  STOPS_TABLE_COLUMN_LABELS,
  STOPS_TABLE_ALWAYS_VISIBLE_KEYS,
} from "@/components/on-time/OnTimeStopsTable/OnTimeStopsTable";
import {
  type OnTimeDisplayMode,
  normaliseDirection,
  aggregatePerformanceTotals,
  aggregateAverageTravelTimes,
} from "@/utils/on-time/on-time-table-format";
import { formatStopPerformanceCsvFilename } from "@/utils/on-time-csv-filename";
import { DisplayOptionsModal } from "@/components/shared/DisplayOptionsModal/DisplayOptionsModal";
import {
  OnTimeFilterPanel,
  DATE_PRESET_OPTIONS,
  MATCH_TYPE_OPTIONS,
  STOP_TYPE_OPTIONS,
  calculateDateRange,
  getDatePresetFromQuery,
  getDatePresetQueryParam,
} from "@/components/on-time/OnTimeFilterPanel/OnTimeFilterPanel";
import {
  refineResultsToPerformanceFilters,
  performanceFiltersToRefineResults,
} from "@/components/shared/RefineResults/RefineResultsFilters";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { operatorsService } from "@/services/operator.service";
import { type OperatorType } from "@/src/generated/graphql";
import { headwayService } from "@/services/on-time/headway.service";
import {
  DayOfWeekData,
  PerformanceParams,
  PunctualityOverview,
  StopPerformance,
  TimeOfDayData,
  TimeSeriesData,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { DateTime } from "luxon";
import { buildDefaultParams } from "@/services/on-time/params";
import { settle } from "@/utils/settle";
import {
  DelayFrequencyType,
  FrequentServiceInfoType,
  Granularity,
  HeadwayTimeSeriesType,
  MatchType,
  PerformanceFiltersInputType,
  ServiceInfoType,
} from "@/src/generated/graphql";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid/SummaryStatsGrid";
import { OnTimePageHeader } from "@/components/on-time/OnTimePageHeader";
import { OnTimeHelpdeskRow } from "@/components/on-time/OnTimeHelpdeskRow";
import { OnTimeDisplayControls } from "@/components/on-time/OnTimeDisplayControls/OnTimeDisplayControls";

const aggregateStopsByStopId = (
  stops: StopPerformance[],
): StopPerformance[] => {
  if (stops.length === 0) return [];

  const grouped = new Map<string, StopPerformance[]>();
  for (const stop of stops) {
    const key = stop.stopId ?? "";
    const existing = grouped.get(key) ?? [];
    existing.push(stop);
    grouped.set(key, existing);
  }

  const aggregated: StopPerformance[] = [];

  for (const rows of grouped.values()) {
    const totals = aggregatePerformanceTotals(rows);
    if (!totals) continue;

    const travelTimes = aggregateAverageTravelTimes(rows);

    aggregated.push({
      ...rows[0],
      ...totals,
      direction: null,
      averageScheduled: travelTimes.averageScheduled,
      averageActual: travelTimes.averageActual,
    });
  }

  return aggregated;
};

interface ServiceLevelData {
  fromTimestamp: string;
  toTimestamp: string;
  granularity: Granularity;
  serviceInfo: ServiceInfoType | null;
  stopPerformance: StopPerformance[];
  frequentServiceInfo: FrequentServiceInfoType | null;
  headwayTimeSeries: HeadwayTimeSeriesType[];
  delayFrequency: DelayFrequencyType[];
  timeSeries: TimeSeriesData[];
  timeOfDay: TimeOfDayData[];
  dayOfWeek: DayOfWeekData[];
}

const getDateRangeFromQuery = (
  from: string | string[] | undefined,
  to: string | string[] | undefined,
) => {
  if (typeof from !== "string" || typeof to !== "string") {
    return null;
  }

  const fromDate = DateTime.fromFormat(from, "yyyy-MM-dd");
  const toDate = DateTime.fromFormat(to, "yyyy-MM-dd");
  const fromTimestamp = fromDate.toISO();
  const toTimestamp = toDate.plus({ days: 1 }).toISO();

  if (!fromDate.isValid || !toDate.isValid || !fromTimestamp || !toTimestamp) {
    return null;
  }

  return { from: fromTimestamp, to: toTimestamp };
};

const OnTimeServicePage = () => {
  useRequireAuth();
  const router = useRouter();
  const { isReady, replace } = router;
  const { config } = useConfig();
  const { loadData } = useHelpdesk();

  useEffect(() => {
    loadData("otp", "On-time performance");
  }, [loadData]);
  const nocCode =
    typeof router.query.nocCode === "string" ? router.query.nocCode : null;
  const lineId =
    typeof router.query.lineId === "string" ? router.query.lineId : null;
  const routerIsReady = router.isReady;
  const routerReplace = router.replace;

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [operatorChecked, setOperatorChecked] = useState(false);
  const [lineNotFound, setLineNotFound] = useState(false);
  const [data, setData] = useState<Partial<ServiceLevelData>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [operator, setOperator] = useState<OperatorType | null>(null);
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [selectedDisplayMode, setSelectedDisplayMode] =
    useState<OnTimeDisplayMode>("percentage");
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [visibleStopColumns, setVisibleStopColumns] = useState<string[]>(
    STOPS_TABLE_COLUMN_KEYS,
  );
  const [selectedDatePreset, setSelectedDatePreset] = useState("Last 7 days");
  const [selectedMatchType, setSelectedMatchType] = useState("evidenced");
  const [selectedStopType, setSelectedStopType] = useState("timing-points");
  const [refineResultsFilters, setRefineResultsFilters] =
    useState<PerformanceFiltersInputType>({});
  const refineResultsInitialValues =
    performanceFiltersToRefineResults(refineResultsFilters);
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(calculateDateRange("Last 7 days"));
  const [appliedQueryDateKey, setAppliedQueryDateKey] = useState<string>();

  const queryDirections = useMemo(() => {
    const direction = router.query.direction;

    if (!direction) {
      return [];
    }

    const directions = Array.isArray(direction) ? direction : [direction];
    return directions.filter((value) => value.toLowerCase() !== "all");
  }, [router.query.direction]);

  useEffect(() => {
    setSelectedDirections(queryDirections);
  }, [queryDirections]);

  const queryDateRange = useMemo(
    () => getDateRangeFromQuery(router.query.from, router.query.to),
    [router.query.from, router.query.to],
  );
  const queryDatePreset =
    typeof router.query.preset === "string"
      ? getDatePresetFromQuery(router.query.preset)
      : undefined;
  const queryDateKey = JSON.stringify({
    from: router.query.from ?? null,
    to: router.query.to ?? null,
    preset: router.query.preset ?? null,
  });
  const hasAppliedQueryDate = appliedQueryDateKey === queryDateKey;

  useEffect(() => {
    if (!isReady) return;

    if (queryDateRange) {
      setDateRange(queryDateRange);
      setSelectedDatePreset("Custom");
    } else if (queryDatePreset) {
      setDateRange(calculateDateRange(queryDatePreset));
      setSelectedDatePreset(queryDatePreset);
    }
    setAppliedQueryDateKey(queryDateKey);
  }, [isReady, queryDateKey, queryDatePreset, queryDateRange]);

  const stopPerformanceParams = useMemo<PerformanceParams | null>(() => {
    if (!nocCode || !lineId) return null;

    const defaultParams = buildDefaultParams({ nocCode, lineId });

    return {
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
  }, [
    dateRange,
    lineId,
    nocCode,
    refineResultsFilters,
    selectedMatchType,
    selectedStopType,
  ]);

  const handleDatePresetChange = (selected: string) => {
    setSelectedDatePreset(selected);
    const range = calculateDateRange(selected);
    setDateRange(range);
    const query = { ...router.query };
    delete query.from;
    delete query.to;
    const preset = getDatePresetQueryParam(selected);
    if (preset === "last7") {
      delete query.preset;
    } else {
      query.preset = preset;
    }
    void router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  const handleDateRangeChange = (
    value: { from: string; to: string } | undefined,
  ) => {
    setDateRange(value ?? null);
    if (!value) {
      return;
    }

    setSelectedDatePreset("Custom");
    const query = { ...router.query };
    delete query.preset;
    void router.replace(
      {
        pathname: router.pathname,
        query: {
          ...query,
          from: DateTime.fromISO(value.from).toFormat("yyyy-MM-dd"),
          to: DateTime.fromISO(value.to)
            .minus({ days: 1 })
            .toFormat("yyyy-MM-dd"),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const filteredStopPerformance = useMemo(() => {
    const stopPerformance = data.stopPerformance ?? [];
    if (selectedDirections.length === 0) {
      return aggregateStopsByStopId(stopPerformance);
    }

    return stopPerformance.filter((stop) => {
      if (!stop.direction) return false;
      const normalizedDirection = normaliseDirection(stop.direction);

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

    const totalDelayedDepartures = filteredStopPerformance.reduce(
      (sum, row) => sum + (row.countDelayed ?? 0),
      0,
    );

    const weightedDelayTotal = filteredStopPerformance.reduce((sum, row) => {
      if (row.averageDelay == null) return sum;
      return sum + row.averageDelay * (row.countDelayed ?? 0);
    }, 0);

    const averageDelay =
      totalDelayedDepartures > 0
        ? weightedDelayTotal / totalDelayedDepartures
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

  const summaryOverview = useMemo<PunctualityOverview>(
    () => ({
      onTime: summaryStats.onTimeCount,
      late: summaryStats.lateCount,
      early: summaryStats.earlyCount,
      completed: summaryStats.recordedStopDepartures,
      scheduled: summaryStats.totalStopDepartures,
      incomplete: String(summaryStats.incompleteCount),
      averageDelay: summaryStats.averageDelay,
      noData: Math.max(
        0,
        summaryStats.totalStopDepartures - summaryStats.recordedStopDepartures,
      ),
    }),
    [summaryStats],
  );

  useEffect(() => {
    if (
      !isReady ||
      !hasAppliedQueryDate ||
      !config?.apiUrl ||
      !nocCode ||
      !lineId ||
      !stopPerformanceParams
    )
      return;
    const load = async () => {
      setIsLoading(true);
      setLineNotFound(false);
      const operatorData = await operatorsService.fetchOperator(nocCode);
      if (!operatorData) {
        replace("/on-time/operator-not-found");
        return;
      }
      setOperator(operatorData);
      setOperatorChecked(true);

      const fromDate = DateTime.fromISO(stopPerformanceParams.fromTimestamp);
      const toDate = DateTime.fromISO(stopPerformanceParams.toTimestamp);
      const granularity =
        Math.abs(toDate.diff(fromDate, "days").days) <= 5
          ? Granularity.Hour
          : Granularity.Day;
      const performanceParams = {
        ...stopPerformanceParams,
        filters: { ...stopPerformanceParams.filters, granularity },
      };
      const headwayParams = {
        ...stopPerformanceParams,
        filters: { ...stopPerformanceParams.filters, granularity },
      };

      const [
        serviceInfo,
        stopPerformance,
        headwayTimeSeries,
        delayFrequency,
        timeSeries,
        timeOfDay,
        dayOfWeek,
      ] = await Promise.all([
        settle(onTimeService.fetchServiceInfo(lineId)),
        settle(onTimeService.fetchStopPerformanceList(performanceParams)),
        settle(headwayService.fetchTimeSeries(headwayParams)),
        settle(onTimeService.fetchOnTimeDelayFrequencyData(performanceParams)),
        settle(onTimeService.fetchOnTimeTimeSeriesData(performanceParams)),
        settle(
          onTimeService.fetchOnTimePunctualityTimeOfDayData(performanceParams),
        ),
        settle(
          onTimeService.fetchOnTimePunctualityDayOfWeekData(performanceParams),
        ),
      ]);

      const frequentServiceInfo = await settle(
        headwayService.fetchFrequentServiceInfo(stopPerformanceParams),
      );

      const serviceNotFound = !serviceInfo.data && !serviceInfo.error;
      setLineNotFound(serviceNotFound);

      setData({
        fromTimestamp: stopPerformanceParams.fromTimestamp,
        toTimestamp: stopPerformanceParams.toTimestamp,
        granularity,
        serviceInfo: serviceInfo.data,
        stopPerformance: stopPerformance.data ?? [],
        frequentServiceInfo: frequentServiceInfo.data,
        headwayTimeSeries: headwayTimeSeries.data ?? [],
        delayFrequency: delayFrequency.data ?? [],
        timeSeries: timeSeries.data ?? [],
        timeOfDay: timeOfDay.data ?? [],
        dayOfWeek: dayOfWeek.data ?? [],
      });
      setErrors({
        serviceInfo: serviceInfo.error,
        stopPerformance: stopPerformance.error,
        frequentServiceInfo: frequentServiceInfo.error,
        headwayTimeSeries: headwayTimeSeries.error,
        delayFrequency: delayFrequency.error,
        timeSeries: timeSeries.error,
        timeOfDay: timeOfDay.error,
        dayOfWeek: dayOfWeek.error,
      });
      setHasLoadedData(true);
      setIsLoading(false);
    };
    load();
  }, [
    config,
    dateRange,
    lineId,
    nocCode,
    stopPerformanceParams,
    refineResultsFilters,
    selectedMatchType,
    selectedStopType,
    isReady,
    hasAppliedQueryDate,
    replace,
  ]);

  if (!isReady || !nocCode || !lineId || !operatorChecked) {
    return (
      <BaseLayout title="On-time performance - Analyse Bus Open Data">
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  const serviceTitle = data.serviceInfo
    ? `${data.serviceInfo.serviceNumber} - ${data.serviceInfo.serviceName}`
    : lineId;

  return (
    <BaseLayout
      title={`${serviceTitle}: Analyse Bus Open Data`}
      backLink={
        <Link
          href={`/on-time/${encodeURIComponent(nocCode)}`}
          className="govuk-back-link"
        >
          All Services
        </Link>
      }
    >
      <OnTimePageHeader
        title={serviceTitle}
        headingClassName="govuk-heading-xl govuk-!-margin-bottom-2"
        subtitle={
          operator ? (
            <p className="govuk-caption-l govuk-!-margin-bottom-6">
              {operator.name} ({operator.nocCode})
            </p>
          ) : undefined
        }
      />
      {lineNotFound ? (
        <>
          <h2 className="govuk-heading-l">Not found</h2>
          <p className="govuk-body">
            Service not found, or you do not have permission to view. Go back to{" "}
            <Link
              className="govuk-link"
              href={`/on-time/${encodeURIComponent(nocCode)}`}
            >
              operator
            </Link>
            ?
          </p>
        </>
      ) : isLoading && !hasLoadedData ? (
        <p className="govuk-body govuk-!-margin-top-6">
          Loading service data...
        </p>
      ) : (
        <>
          <OnTimeFilterPanel
            isLoading={isLoading}
            refineResultsInitialValues={refineResultsInitialValues}
            onApplyRefineResults={(values) => {
              setRefineResultsFilters(
                refineResultsToPerformanceFilters(values),
              );
            }}
            onResetRefineResults={() => setRefineResultsFilters({})}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
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
          <div className="govuk-!-margin-top-6">
            <ChartsSection
              noData={
                !isLoading &&
                (data.delayFrequency?.length ?? 0) === 0 &&
                (data.timeSeries?.length ?? 0) === 0 &&
                (data.timeOfDay?.length ?? 0) === 0 &&
                (data.dayOfWeek?.length ?? 0) === 0
              }
              dataExpected={selectedMatchType === "evidenced"}
              timingPointsNotSupported={false}
              minMaxDelayNotSupported={false}
              mapContent={
                config?.mapboxToken && config?.mapboxStyle ? (
                  <OnTimeServiceMap
                    mapboxToken={config.mapboxToken}
                    mapboxStyle={config.mapboxStyle}
                    params={stopPerformanceParams}
                    timingPointsOnly={selectedStopType === "timing-points"}
                  />
                ) : (
                  <p className="govuk-body govuk-!-margin-top-4">
                    Map is unavailable
                  </p>
                )
              }
              delayFrequency={data.delayFrequency ?? []}
              timeOfDay={data.timeOfDay ?? []}
              dayOfWeek={data.dayOfWeek ?? []}
              timeSeries={data.timeSeries ?? []}
              fromTimestamp={data.fromTimestamp ?? ""}
              toTimestamp={data.toTimestamp ?? ""}
              granularity={data.granularity}
              headwayTimeSeries={data.headwayTimeSeries ?? []}
              frequentServiceInfo={data.frequentServiceInfo}
              errorHeadwayTimeSeries={errors.headwayTimeSeries}
              errors={{
                delayFrequency: errors.delayFrequency,
                timeOfDay: errors.timeOfDay,
                dayOfWeek: errors.dayOfWeek,
                timeSeries: errors.timeSeries,
              }}
            />
          </div>
          <OnTimeHelpdeskRow
            params={stopPerformanceParams}
            overview={summaryOverview}
          />
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
          <OnTimeDisplayControls
            selectedDirections={selectedDirections}
            onDirectionsChange={setSelectedDirections}
            selectedDisplayMode={selectedDisplayMode}
            onDisplayModeChange={setSelectedDisplayMode}
            onOpenDisplayOptions={() => setShowDisplayOptions(true)}
          />
          <div className="govuk-!-margin-top-6">
            <OnTimeStopsTable
              data={filteredStopPerformance}
              displayMode={selectedDisplayMode}
              csvFilename={formatStopPerformanceCsvFilename({
                lineId: lineId ?? "",
                fromTimestamp: data.fromTimestamp ?? "",
                toTimestamp: data.toTimestamp ?? "",
              })}
              visibleColumns={visibleStopColumns}
            />
            <DisplayOptionsModal
              open={showDisplayOptions}
              columnKeys={STOPS_TABLE_COLUMN_KEYS}
              visibleColumns={visibleStopColumns}
              alwaysVisibleKeys={STOPS_TABLE_ALWAYS_VISIBLE_KEYS}
              columnLabels={STOPS_TABLE_COLUMN_LABELS}
              onClose={() => setShowDisplayOptions(false)}
              onApply={setVisibleStopColumns}
            />
          </div>
        </>
      )}
    </BaseLayout>
  );
};

export default OnTimeServicePage;
