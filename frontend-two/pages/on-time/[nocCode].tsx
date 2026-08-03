import styles from "./on-time-noccode.module.scss";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartsSection } from "@/components/on-time/ChartsSection";
import {
  OnTimeServicesTable,
  SERVICE_TABLE_COLUMN_KEYS,
  SERVICE_TABLE_COLUMN_LABELS,
  SERVICE_TABLE_ALWAYS_VISIBLE_KEYS,
} from "@/components/on-time/OnTimeServicesTable/OnTimeServicesTable";
import { DisplayOptionsModal } from "@/components/shared/DisplayOptionsModal/DisplayOptionsModal";
import {
  OnTimeFilterPanel,
  DATE_PRESET_OPTIONS,
  MATCH_TYPE_OPTIONS,
  STOP_TYPE_OPTIONS,
  calculateDateRange,
} from "@/components/on-time/OnTimeFilterPanel/OnTimeFilterPanel";
import {
  type OnTimeDisplayMode,
  normaliseDirection,
  aggregatePerformanceTotals,
} from "@/utils/on-time/on-time-table-format";
import { formatServicePerformanceCsvFilename } from "@/utils/on-time-csv-filename";
import {
  refineResultsToPerformanceFilters,
  performanceFiltersToRefineResults,
} from "@/components/shared/RefineResults/RefineResultsFilters";
import { SearchInput } from "@/components/shared/SearchInput";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { useRequireAuth } from "@/hooks/useAuth";
import { operatorsService } from "@/services/operator.service";
import {
  type GetAdminAreasQuery,
  type OperatorType,
} from "@/src/generated/graphql";
import { headwayService } from "@/services/on-time/headway.service";
import {
  DayOfWeekData,
  PerformanceParams,
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
  Granularity,
  HeadwayOverviewType,
  HeadwayTimeSeriesType,
  MatchType,
  PerformanceFiltersInputType,
} from "../../src/generated/graphql";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid/SummaryStatsGrid";
import { OperatorSelector } from "@/components/shared/OperatorSelector";
import { OnTimePageHeader } from "@/components/on-time/OnTimePageHeader";
import { OnTimeHelpdeskRow } from "@/components/on-time/OnTimeHelpdeskRow";
import { OnTimeDisplayControls } from "@/components/on-time/OnTimeDisplayControls/OnTimeDisplayControls";
import { FilterChips } from "@/components/on-time/FilterChips/FilterChips";

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
  fromTimestamp: string;
  toTimestamp: string;
  granularity: Granularity;
}

const OnTimeOperatorPage = () => {
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
  const routerIsReady = router.isReady;
  const routerReplace = router.replace;

  const [isLoading, setIsLoading] = useState(true);
  const [operatorChecked, setOperatorChecked] = useState(false);
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
  const [allOperators, setAllOperators] = useState<OperatorType[]>([]);
  const [adminAreas, setAdminAreas] = useState<
    NonNullable<GetAdminAreasQuery["adminAreas"]>
  >([]);

  const selectedAdminAreaIds = useMemo(() => {
    const value = router.query.adminAreaId;

    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }, [router.query.adminAreaId]);

  const selectedAdminAreaNames = useMemo(() => {
    if (selectedAdminAreaIds.length === 0) {
      return [];
    }

    return adminAreas
      .filter((area) => selectedAdminAreaIds.includes(area.id.toString()))
      .map((area) => area.name);
  }, [adminAreas, selectedAdminAreaIds]);

  const adminAreaChipFilters = useMemo<PerformanceFiltersInputType>(
    () => ({
      adminAreaIds: selectedAdminAreaIds,
    }),
    [selectedAdminAreaIds],
  );

  const adminAreaFilterChipOptions = useMemo(
    () =>
      adminAreas.map((adminArea) => ({
        label: adminArea.name,
        value: adminArea.id.toString(),
      })),
    [adminAreas],
  );

  const handleAdminAreaChipChange = (filters: PerformanceFiltersInputType) => {
    const remainingIds = filters.adminAreaIds ?? [];

    const query = { ...router.query };

    delete query.adminAreaId;

    void router.replace(
      {
        pathname: router.pathname,
        query: {
          ...query,
          ...(remainingIds.length > 0 ? { adminAreaId: remainingIds } : {}),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const refineResultsInitialValues =
    performanceFiltersToRefineResults(refineResultsFilters);

  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(calculateDateRange("Last 7 days"));

  const servicePerformanceParams = useMemo<PerformanceParams | null>(() => {
    if (!nocCode) return null;

    const defaultParams = buildDefaultParams({ nocCode });

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
        granularity: Granularity.Day,
        ...(selectedAdminAreaIds.length > 0
          ? { adminAreaIds: selectedAdminAreaIds }
          : {}),
      },
    };
  }, [
    dateRange,
    nocCode,
    refineResultsFilters,
    selectedMatchType,
    selectedStopType,
    selectedAdminAreaIds,
  ]);

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

  const handleOperatorChange = (operatorId: string | null) => {
    if (!operatorId) return;
    router.push(`/on-time/${encodeURIComponent(operatorId)}`);
  };

  useEffect(() => {
    if (!isReady || !config?.apiUrl) return;
    const loadOperators = async () => {
      try {
        const [ops, areas] = await Promise.all([
          operatorsService.fetchOperators(),
          operatorsService.fetchAdminAreas(),
        ]);
        setAllOperators(ops);
        setAdminAreas(areas);
      } catch (error) {
        console.error("Failed to load operators", error);
      }
    };
    loadOperators();
  }, [config, isReady]);

  useEffect(() => {
    if (!isReady || !config?.apiUrl || !nocCode || !servicePerformanceParams)
      return;
    const load = async () => {
      setIsLoading(true);
      const operator = await operatorsService.fetchOperator(nocCode);
      if (!operator) {
        replace("/on-time/operator-not-found");
        return;
      }
      setOperatorChecked(true);

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
        settle(performanceService.fetchOverviewStats(servicePerformanceParams)),
        settle(
          onTimeService.fetchOnTimeDelayFrequencyData(servicePerformanceParams),
        ),
        settle(
          onTimeService.fetchOnTimeTimeSeriesData(servicePerformanceParams),
        ),
        settle(
          onTimeService.fetchOnTimePunctualityTimeOfDayData(
            servicePerformanceParams,
          ),
        ),
        settle(
          onTimeService.fetchOnTimePunctualityDayOfWeekData(
            servicePerformanceParams,
          ),
        ),
        settle(
          onTimeService.fetchOnTimePerformanceList(servicePerformanceParams),
        ),
        settle(
          performanceService.fetchServicePerformance(servicePerformanceParams),
        ),
        settle(headwayService.fetchTimeSeries(servicePerformanceParams)),
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
        fromTimestamp: servicePerformanceParams.fromTimestamp,
        toTimestamp: servicePerformanceParams.toTimestamp,
        granularity: Granularity.Day,
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
    servicePerformanceParams,
    refineResultsFilters,
    selectedMatchType,
    selectedStopType,
    isReady,
    replace,
  ]);

  const summaryStats = data.overview?.onTime;
  const hasDirectionFilter = selectedDirections.length > 0;
  const hasLoadedData = Boolean(data.fromTimestamp);

  const adminAreaOptions = useMemo(
    () =>
      adminAreas.map((adminArea) => ({
        label: adminArea.name,
        value: adminArea.id,
      })),
    [adminAreas],
  );

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

  if (!routerIsReady || !nocCode || !operatorChecked) {
    return (
      <BaseLayout title="On-time performance - Analyse Bus Open Data">
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      title="All services: Analyse Bus Open Data"
      backLink={
        <Link href="/on-time" className="govuk-back-link">
          All operators
        </Link>
      }
    >
      <OnTimePageHeader title="All services">
        <OperatorSelector
          operators={allOperators}
          selectedOperatorId={nocCode}
          onChange={handleOperatorChange}
          allowAll={false}
        />
      </OnTimePageHeader>
      {isLoading && !hasLoadedData ? (
        <p className="govuk-body govuk-!-margin-top-6">
          Loading on-time data...
        </p>
      ) : (
        <>
          <OnTimeFilterPanel
            isLoading={isLoading}
            showAdminAreaFilter={true}
            adminAreaOptions={adminAreaOptions}
            refineResultsInitialValues={refineResultsInitialValues}
            onApplyRefineResults={(values) => {
              setRefineResultsFilters(
                refineResultsToPerformanceFilters(values),
              );
            }}
            onResetRefineResults={() => setRefineResultsFilters({})}
            dateRange={dateRange}
            onDateRangeChange={(value) => {
              setDateRange(value ?? null);
              if (value) {
                setSelectedDatePreset("Custom");
              }
            }}
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
          {selectedAdminAreaNames.length > 0 && (
            <FilterChips
              filters={adminAreaChipFilters}
              adminAreaOptions={adminAreaFilterChipOptions}
              onFilterChange={handleAdminAreaChipChange}
            />
          )}
          <ChartsSection
            noData={wrapperNoData}
            dataExpected={wrapperDataExpected}
            timingPointsNotSupported={wrapperTimingPointsNotSupported}
            minMaxDelayNotSupported={wrapperMinMaxDelayNotSupported}
            delayFrequency={data.delayFrequency ?? []}
            timeOfDay={data.timeOfDay ?? []}
            dayOfWeek={data.dayOfWeek ?? []}
            timeSeries={data.timeSeries ?? []}
            fromTimestamp={data.fromTimestamp ?? ""}
            toTimestamp={data.toTimestamp ?? ""}
            granularity={data.granularity ?? Granularity.Day}
            errors={{
              delayFrequency: errors.delayFrequency,
              timeOfDay: errors.timeOfDay,
              dayOfWeek: errors.dayOfWeek,
              timeSeries: errors.timeSeries,
            }}
          />
          <div className="govuk-!-margin-top-6">
            {errors.servicePerformance ? (
              <p className="govuk-body" style={{ color: "#d4351c" }}>
                Error loading service data: {errors.servicePerformance}
              </p>
            ) : (
              <>
                <OnTimeHelpdeskRow
                  params={servicePerformanceParams}
                  overview={summaryStats}
                />
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
                <OnTimeDisplayControls
                  className={`${styles.onTimeDisplayControlsContainer} govuk-body govuk-!-margin-top-6`}
                  groupInputs
                  beforeDirections={
                    <div className={styles.searchContainer}>
                      <SearchInput
                        id="service-search"
                        label="Search for a service"
                        testId=""
                        value={serviceSearch}
                        onChange={setServiceSearch}
                        widthClassName={styles.searchContainerInput}
                      />
                    </div>
                  }
                  selectedDirections={selectedDirections}
                  onDirectionsChange={setSelectedDirections}
                  selectedDisplayMode={selectedDisplayMode}
                  onDisplayModeChange={setSelectedDisplayMode}
                  onOpenDisplayOptions={() => setShowDisplayOptions(true)}
                />
                <OnTimeServicesTable
                  data={filteredServices}
                  nocCode={nocCode ?? ""}
                  displayMode={selectedDisplayMode}
                  csvFilename={formatServicePerformanceCsvFilename({
                    nocCode: nocCode ?? "",
                    fromTimestamp: data.fromTimestamp ?? "",
                    toTimestamp: data.toTimestamp ?? "",
                  })}
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
        </>
      )}
    </BaseLayout>
  );
};

export default OnTimeOperatorPage;
