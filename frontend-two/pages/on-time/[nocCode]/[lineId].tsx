import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
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
import { Box } from "@/components/shared/Box";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid";

const ExcessWaitTimeChart = dynamic(
  () => import("@/components/on-time/ExcessWaitTimeChart"),
  { ssr: false },
);

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
      const operator = await operatorsService.fetchOperator(nocCode);
      if (!operator) {
        await router.replace("/on-time/operator-not-found");
        return;
      }

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
    router.isReady,
  ]);

  if (!router.isReady || !nocCode || !lineId) {
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
      <span className="govuk-caption-xl govuk-!-margin-bottom-0">
        {nocCode}
      </span>
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
          {/* <JsonSection
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
          /> */}
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
