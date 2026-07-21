import { useEffect, useMemo, useState } from "react";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartNoDataWrapper } from "@/components/on-time/ChartNoDataWrapper";
import {
  OnTimeFilterPanel,
  DATE_PRESET_OPTIONS,
  MATCH_TYPE_OPTIONS,
  STOP_TYPE_OPTIONS,
  calculateDateRange,
} from "@/components/on-time/OnTimeFilterPanel";
import { operatorsService } from "@/services/operator.service";
import { OnTimeBoundariesMap } from "@/components/on-time/OnTimeBoundariesMap";
import { OnTimeOperatorTable } from "@/components/on-time/OnTimeOperatorTable";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid";
import { MultiselectDropdown } from "@/components/shared/MultiselectDropdown";
import {
  refineResultsToPerformanceFilters,
  performanceFiltersToRefineResults,
} from "@/components/shared/RefineResults/RefineResultsFilters";
import { OnTimeHelpdeskButton } from "@/components/on-time/OnTimeHelpdesk/OnTimeHelpdeskButton";
import { useConfig } from "@/contexts/ConfigContext";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  AdminOrgListQuery,
  MatchType,
  PerformanceFiltersInputType,
  GetAdminAreasQuery,
} from "@/src/generated/graphql";
import {
  PerformanceParams,
  OperatorPerformance,
  PunctualityOverview,
  onTimeService,
} from "@/services/on-time/on-time.service";
import { buildDefaultParams } from "@/services/on-time/params";
import { SearchInput } from "@/components/shared/SearchInput";
import { distanceService } from "@/services/distances/distance.services";
import { OtpThresholdModalLink } from "@/components/on-time/otp-threshold/OtpThresholdModalLink";

type AdminOrgMap = AdminOrgListQuery["adminOrgMap"][number];
type AdminArea = NonNullable<GetAdminAreasQuery["adminAreas"]>[number];

const EMPTY_ADMIN_AREA_IDS: string[] = [];

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
  const [adminOrgData, setAdminOrgData] = useState<AdminOrgMap[]>([]);
  const [adminAreas, setAdminAreas] = useState<AdminArea[]>([]);
  const [isLoadingAdminAreas, setIsLoadingAdminAreas] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [selectedDatePreset, setSelectedDatePreset] = useState("Last 7 days");
  const [selectedMatchType, setSelectedMatchType] = useState("evidenced");
  const [selectedStopType, setSelectedStopType] = useState("timing-points");
  const [selectedAdminAreas, setSelectedAdminAreas] = useState<string[]>([]);
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

  const adminAreaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          adminOrgData
            .map((record) => record.adminName)
            .filter((name): name is string => name !== null),
        ),
      ).sort(),
    [adminOrgData],
  );

  const filteredOperators = useMemo(() => {
    if (!operatorSearch) return operatorPerformance;

    const searchValue = operatorSearch.toLowerCase();
    return operatorPerformance.filter((operator) =>
      (operator.name ?? "").toLowerCase().includes(searchValue),
    );
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

  const totalStopDepartures =
    (summaryStats?.scheduled ?? 0) > 0
      ? summaryStats?.scheduled ?? 0
      : (summaryStats?.completed ?? 0) + (summaryStats?.noData ?? 0);

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
    const loadAdminAreas = async () => {
      setIsLoadingAdminAreas(true);
      try {
        const [adminOrgMap, adminAreaShapes] = await Promise.all([
          distanceService.fetchAdminOrg(),
          operatorsService.fetchAdminAreas(),
        ]);
        setAdminOrgData(adminOrgMap);
        setAdminAreas(adminAreaShapes);
      } finally {
        setIsLoadingAdminAreas(false);
      }
    };

    loadAdminAreas();
  }, []);

  const selectedAdminAreaIds = useMemo(() => {
    if (selectedAdminAreas.length === 0) {
      return EMPTY_ADMIN_AREA_IDS;
    }

    return Array.from(
      new Set(
        adminOrgData
          .filter(
            (adminArea) =>
              adminArea.adminName !== null &&
              selectedAdminAreas.includes(adminArea.adminName),
          )
          .map((adminArea) => adminArea.adminAreaId.toString()),
      ),
    );
  }, [adminOrgData, selectedAdminAreas]);

  const operatorTableParams = useMemo<PerformanceParams>(() => {
    const defaultParams = buildDefaultParams();

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
        ...(selectedAdminAreaIds.length > 0
          ? { adminAreaIds: selectedAdminAreaIds }
          : {}),
      },
    };
  }, [
    dateRange,
    refineResultsFilters,
    selectedMatchType,
    selectedStopType,
    selectedAdminAreaIds,
  ]);

  const operatorTableParamsKey = useMemo(
    () => JSON.stringify(operatorTableParams),
    [operatorTableParams],
  );

  useEffect(() => {
    if (!config?.apiUrl) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [operatorData, stats] = await Promise.all([
          onTimeService.fetchOperatorPerformanceList(operatorTableParams),
          onTimeService.fetchOnTimeStats(operatorTableParams),
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
  }, [config?.apiUrl, operatorTableParamsKey]);

  return (
    <BaseLayout title="All services - Analyse Bus Open Data">
      <span className="govuk-caption-xl">On-time performance</span>
      <h1 className="govuk-heading-xl govuk-!-margin-bottom-0">All services</h1>
      <OnTimeFilterPanel
        isLoading={isLoading}
        refineResultsInitialValues={refineResultsInitialValues}
        onApplyRefineResults={(values) => {
          setRefineResultsFilters(refineResultsToPerformanceFilters(values));
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
      <div className="summary-container">
        <div className="summary-header-container">
          <h2 className="govuk-heading-l">Summary</h2>
          <div className="summary-admin-area-select-container">
            <MultiselectDropdown
              label=""
              options={adminAreaOptions}
              selected={selectedAdminAreas}
              onChange={setSelectedAdminAreas}
              placeholderText={isLoadingAdminAreas ? "Loading..." : "All areas"}
            />
          </div>
        </div>
        {isLoading ? (
          <p className="govuk-body">Loading on-time data...</p>
        ) : (
          <ChartNoDataWrapper
            noData={wrapperNoData}
            dataExpected={wrapperDataExpected}
            timingPointsNotSupported={wrapperTimingPointsNotSupported}
            minMaxDelayNotSupported={wrapperMinMaxDelayNotSupported}
          >
            <div className="summary-content-wrapper">
              <div className="summary-stat-container">
                <p className="govuk-body-l">
                  <b>{formattedRecordedStopDepartures}</b> departures recorded
                </p>
                <div className="helpdesk-container">
                  <OnTimeHelpdeskButton />
                  <OtpThresholdModalLink
                    params={operatorTableParams}
                    overview={summaryStats}
                  />
                </div>
                <div className="summary-stats-grid-map-container">
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
                <div className="summary-map-container">
                  {config?.mapboxToken && config?.mapboxStyle ? (
                    <OnTimeBoundariesMap
                      mapboxToken={config.mapboxToken}
                      mapboxStyle={config.mapboxStyle}
                      adminAreas={adminAreas}
                      selectedAdminAreaNames={selectedAdminAreas}
                    />
                  ) : (
                    <p className="govuk-body">Map is unavailable</p>
                  )}
                </div>
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
            <OnTimeOperatorTable
              data={filteredOperators}
              sparklineParams={operatorTableParams}
            />
          </ChartNoDataWrapper>
        )}
      </div>
    </BaseLayout>
  );
};

export default OnTimeIndexPage;
