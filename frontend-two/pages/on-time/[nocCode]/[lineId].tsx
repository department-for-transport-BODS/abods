import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartNoDataWrapper } from "@/components/on-time/ChartNoDataWrapper";
import { ChartsSection } from "@/components/on-time/ChartsSection";
import {
  OnTimeStopsTable,
  STOPS_TABLE_COLUMN_KEYS,
  STOPS_TABLE_COLUMN_LABELS,
  STOPS_TABLE_ALWAYS_VISIBLE_KEYS,
} from "@/components/on-time/OnTimeStopsTable";
import {
  type OnTimeDisplayMode,
  DISPLAY_MODE_OPTIONS,
  normaliseDirection,
  aggregatePerformanceTotals,
} from "@/utils/on-time-table-format";
import { OnTimeServiceMap } from "@/components/on-time/OnTimeServiceMap";
import { DisplayOptionsModal } from "@/components/shared/DisplayOptionsModal";
import {
  OnTimeFilterPanel,
  DATE_PRESET_OPTIONS,
  MATCH_TYPE_OPTIONS,
  STOP_TYPE_OPTIONS,
  calculateDateRange,
} from "@/components/on-time/OnTimeFilterPanel";
import {
  refineResultsToPerformanceFilters,
  performanceFiltersToRefineResults,
} from "@/components/shared/RefineResults/RefineResultsFilters";
import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import { RadioOptions } from "@/components/shared/RadioOptions";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { operatorsService } from "@/services/operator.service";
import { type OperatorType } from "@/src/generated/graphql";
import { headwayService } from "@/services/on-time/headway.service";
import {
  DayOfWeekData,
  StopPerformance,
  TimeOfDayData,
  TimeSeriesData,
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
  DelayFrequencyType,
  FrequentServiceInfoType,
  Granularity,
  HeadwayTimeSeriesType,
  MatchType,
  PerformanceFiltersInputType,
  ServiceInfoType,
} from "@/src/generated/graphql";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid";

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

    let averageScheduledTotal = 0;
    let hasAverageScheduled = false;
    let averageActualTotal = 0;
    let hasAverageActual = false;

    for (const row of rows) {
      if (row.averageScheduled != null) {
        averageScheduledTotal += row.averageScheduled;
        hasAverageScheduled = true;
      }
      if (row.averageActual != null) {
        averageActualTotal += row.averageActual;
        hasAverageActual = true;
      }
    }

    aggregated.push({
      ...rows[0],
      ...totals,
      direction: null,
      averageScheduled: hasAverageScheduled
        ? averageScheduledTotal / rows.length
        : null,
      averageActual: hasAverageActual ? averageActualTotal / rows.length : null,
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
  servicePatterns: ServicePattern[];
  mergedStops: NormalizedStop[];
  frequentServiceInfo: FrequentServiceInfoType | null;
  headwayTimeSeries: HeadwayTimeSeriesType[];
  delayFrequency: DelayFrequencyType[];
  timeSeries: TimeSeriesData[];
  timeOfDay: TimeOfDayData[];
  dayOfWeek: DayOfWeekData[];
}

const OnTimeServicePage = () => {
  useRequireAuth();
  const router = useRouter();
  const { config } = useConfig() ?? { mapboxToken: "", mapboxStyle: "" };
  const nocCode =
    typeof router.query.nocCode === "string" ? router.query.nocCode : null;
  const lineId =
    typeof router.query.lineId === "string" ? router.query.lineId : null;

  const [isLoading, setIsLoading] = useState(true);
  const [operatorChecked, setOperatorChecked] = useState(false);
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

  useEffect(() => {
    if (!router.isReady || !config?.apiUrl || !nocCode || !lineId) return;
    const load = async () => {
      setIsLoading(true);
      const operatorData = await operatorsService.fetchOperator(nocCode);
      if (!operatorData) {
        router.replace("/on-time/operator-not-found");
        return;
      }
      setOperator(operatorData);
      setOperatorChecked(true);

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
      const performanceParams = {
        ...params,
        filters: { ...params.filters, granularity },
      };
      const headwayParams = {
        ...params,
        filters: { ...params.filters, granularity },
      };

      const [
        serviceInfo,
        stopPerformance,
        servicePatterns,
        headwayTimeSeries,
        delayFrequency,
        timeSeries,
        timeOfDay,
        dayOfWeek,
      ] = await Promise.all([
        settle(onTimeService.fetchServiceInfo(lineId)),
        settle(onTimeService.fetchStopPerformanceList(performanceParams)),
        settle(transitModelService.fetchServicePatternStops(nocCode, lineId)),
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
        granularity,
        serviceInfo: serviceInfo.data,
        stopPerformance: stopPerformance.data ?? [],
        servicePatterns: servicePatterns.data ?? [],
        mergedStops,
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
        servicePatterns: servicePatterns.error,
        frequentServiceInfo: frequentServiceInfo.error,
        headwayTimeSeries: headwayTimeSeries.error,
        delayFrequency: delayFrequency.error,
        timeSeries: timeSeries.error,
        timeOfDay: timeOfDay.error,
        dayOfWeek: dayOfWeek.error,
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
    router.isReady,
  ]);

  if (!router.isReady || !nocCode || !lineId || !operatorChecked) {
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
      <h1 className="govuk-heading-xl govuk-!-margin-bottom-2">
        {data.serviceInfo
          ? `${data.serviceInfo.serviceNumber} - ${data.serviceInfo.serviceName}`
          : lineId}
      </h1>
      {operator && (
        <p className="govuk-caption-l govuk-!-margin-bottom-6">
          {operator.name} ({operator.nocCode})
        </p>
      )}
      {isLoading ? (
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
          <div className="govuk-!-margin-top-6">
            <h2 className="govuk-heading-m">Route</h2>
            {config && (
              <OnTimeServiceMap
                mapboxToken={config.mapboxToken}
                mapboxStyle={config.mapboxStyle}
                loading={isLoading}
                stops={data.mergedStops ?? []}
                servicePatterns={data.servicePatterns ?? []}
              />
            )}
          </div>
          <div className="govuk-!-margin-top-6">
            <ChartNoDataWrapper
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
            >
              <ChartsSection
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
            </ChartNoDataWrapper>
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
                <button
                  type="button"
                  className="govuk-link"
                  onClick={() => setShowDisplayOptions(true)}
                >
                  Display options
                </button>
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
          <div className="govuk-!-margin-top-6">
            <OnTimeStopsTable
              data={filteredStopPerformance}
              displayMode={selectedDisplayMode}
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
