import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartNoDataWrapper } from "@/components/on-time/ChartNoDataWrapper";
import { ChartsSection } from "@/components/on-time/ChartsSection";
import { JsonSection } from "@/components/on-time/JsonSection";
import {
  OnTimeServicesTable,
  SERVICE_TABLE_COLUMN_KEYS,
  SERVICE_TABLE_COLUMN_LABELS,
  SERVICE_TABLE_ALWAYS_VISIBLE_KEYS,
} from "@/components/on-time/OnTimeServicesTable";
import { DisplayOptionsModal } from "@/components/shared/DisplayOptionsModal";
import {
  OnTimeFilterPanel,
  DATE_PRESET_OPTIONS,
  MATCH_TYPE_OPTIONS,
  STOP_TYPE_OPTIONS,
  calculateDateRange,
} from "@/components/on-time/OnTimeFilterPanel";
import {
  type OnTimeDisplayMode,
  DISPLAY_MODE_OPTIONS,
  normaliseDirection,
  aggregatePerformanceTotals,
} from "@/utils/on-time-table-format";
import {
  refineResultsToPerformanceFilters,
  performanceFiltersToRefineResults,
} from "@/components/shared/RefineResults/RefineResultsFilters";
import { SearchInput } from "@/components/shared/SearchInput";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { operatorsService } from "@/services/operator.service";
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

const aggregateServicesByLine = (
  services: FrequentServicePerformance[],
): FrequentServicePerformance[] => {
  if (services.length === 0) return [];

  const grouped = new Map<string, FrequentServicePerformance[]>();
  for (const service of services) {
    const key = service.lineInfo?.serviceId ?? service.lineId ?? "";
    const existing = grouped.get(key) ?? [];
    existing.push(service);
    grouped.set(key, existing);
  }

  const aggregated: FrequentServicePerformance[] = [];

  for (const rows of grouped.values()) {
    const totals = aggregatePerformanceTotals(rows);
    if (!totals) continue;

    aggregated.push({
      ...rows[0],
      ...totals,
      direction: null,
      frequent: rows.some((r) => r.frequent),
    });
  }

  return aggregated;
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
    useState<OnTimeDisplayMode>("percentage");
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [visibleServiceColumns, setVisibleServiceColumns] = useState<string[]>(
    SERVICE_TABLE_COLUMN_KEYS,
  );
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

  const chartErrors = [
    errors.delayFrequency,
    errors.timeOfDay,
    errors.dayOfWeek,
  ];
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
    if (!router.isReady || !config?.apiUrl || !nocCode) return;
    const load = async () => {
      setIsLoading(true);
      const operator = await operatorsService.fetchOperator(nocCode);
      if (!operator) {
        await router.replace("/on-time/operator-not-found");
        return;
      }

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
    router.isReady,
  ]);

  const summaryStats = data.overview?.onTime;
  const hasDirectionFilter = selectedDirections.length > 0;

  const directionFilteredServices = useMemo(() => {
    const services = data.servicePerformance ?? [];
    if (!hasDirectionFilter) return services;

    return services.filter((service) => {
      const direction = normaliseDirection(service.direction);
      return selectedDirections.some(
        (selectedDirection) => direction === selectedDirection.toLowerCase(),
      );
    });
  }, [data.servicePerformance, hasDirectionFilter, selectedDirections]);

  const summaryCards = useMemo(() => {
    if (!hasDirectionFilter) {
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

      return {
        onTimeCount: summaryStats?.onTime ?? null,
        lateCount: summaryStats?.late ?? null,
        earlyCount: summaryStats?.early ?? null,
        incompleteCount: summaryStats?.noData ?? null,
        recordedStopDepartures:
          recordedStopDepartures > 0 ? recordedStopDepartures : null,
        totalStopDepartures:
          totalStopDepartures > 0 ? totalStopDepartures : null,
        incompleteBreakdown: summaryStats?.incomplete ?? null,
        averageDelay: summaryStats?.averageDelay ?? null,
      };
    }

    if (directionFilteredServices.length === 0) {
      return {
        onTimeCount: null,
        lateCount: null,
        earlyCount: null,
        incompleteCount: null,
        recordedStopDepartures: null,
        totalStopDepartures: null,
        incompleteBreakdown: null,
        averageDelay: null,
      };
    }

    let onTimeCount = 0;
    let lateCount = 0;
    let earlyCount = 0;
    let scheduledDepartures = 0;
    let recordedStopDepartures = 0;
    let countDelayed = 0;
    let weightedDelayTotal = 0;

    for (const row of directionFilteredServices) {
      onTimeCount += row.onTime ?? 0;
      lateCount += row.late ?? 0;
      earlyCount += row.early ?? 0;
      scheduledDepartures += row.scheduledDepartures ?? 0;
      recordedStopDepartures += row.actualDepartures ?? 0;
      countDelayed += row.countDelayed ?? 0;
      weightedDelayTotal += (row.averageDelay ?? 0) * (row.countDelayed ?? 0);
    }

    const incompleteCount = Math.max(
      0,
      scheduledDepartures - recordedStopDepartures,
    );

    return {
      onTimeCount,
      lateCount,
      earlyCount,
      incompleteCount,
      recordedStopDepartures,
      totalStopDepartures: scheduledDepartures,
      incompleteBreakdown: null,
      averageDelay: countDelayed > 0 ? weightedDelayTotal / countDelayed : null,
    };
  }, [directionFilteredServices, hasDirectionFilter, summaryStats]);

  const filteredServices = useMemo(() => {
    const services = directionFilteredServices;
    const search = serviceSearch.trim().toLowerCase();

    const searchFilteredServices = services.filter((service) => {
      const searchFields = [
        service.lineId,
        service.lineInfo?.serviceName,
        service.lineInfo?.serviceNumber,
      ];

      return searchFields.some((field) =>
        (field ?? "").toLowerCase().includes(search),
      );
    });

    if (!hasDirectionFilter) {
      return aggregateServicesByLine(searchFilteredServices);
    }

    return searchFilteredServices.filter((service) => {
      const direction = normaliseDirection(service.direction);
      return selectedDirections.some(
        (selectedDirection) => direction === selectedDirection.toLowerCase(),
      );
    });
  }, [
    directionFilteredServices,
    hasDirectionFilter,
    selectedDirections,
    serviceSearch,
  ]);

  if (!router.isReady || !nocCode) {
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
      <p className="govuk-caption-xl govuk-!-margin-bottom-0">
        TODO: Operator: {nocCode}
      </p>
      {isLoading ? (
        <p className="govuk-body govuk-!-margin-top-6">
          Loading on-time data...
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
                    onTimeCount={summaryCards.onTimeCount}
                    lateCount={summaryCards.lateCount}
                    earlyCount={summaryCards.earlyCount}
                    incompleteCount={summaryCards.incompleteCount}
                    recordedStopDepartures={summaryCards.recordedStopDepartures}
                    totalStopDepartures={summaryCards.totalStopDepartures}
                    incompleteBreakdown={summaryCards.incompleteBreakdown}
                    averageDelay={summaryCards.averageDelay}
                  />
                </div>
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
                <OnTimeServicesTable
                  data={filteredServices}
                  nocCode={nocCode ?? ""}
                  displayMode={selectedDisplayMode}
                  visibleColumns={visibleServiceColumns}
                />
                <DisplayOptionsModal
                  open={showDisplayOptions}
                  columnKeys={SERVICE_TABLE_COLUMN_KEYS}
                  visibleColumns={visibleServiceColumns}
                  alwaysVisibleKeys={SERVICE_TABLE_ALWAYS_VISIBLE_KEYS}
                  columnLabels={SERVICE_TABLE_COLUMN_LABELS}
                  onClose={() => setShowDisplayOptions(false)}
                  onApply={setVisibleServiceColumns}
                />
              </>
            )}
          </div>
          {/* TODO: */}
          {/* <JsonSection
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
          /> */}
        </>
      )}
    </BaseLayout>
  );
};

export default OnTimeOperatorPage;
