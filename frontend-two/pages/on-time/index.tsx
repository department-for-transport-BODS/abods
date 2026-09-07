import styles from "./on-time.module.scss";
import helpdeskStyles from "../../components/on-time/OnTimeHelpdesk/on-time-helpdesk-panel.module.scss";

import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ChartNoDataWrapper } from "@/components/on-time/ChartNoDataWrapper/ChartNoDataWrapper";
import {
  OnTimeFilterPanel,
  DATE_PRESET_OPTIONS,
  MATCH_TYPE_OPTIONS,
  STOP_TYPE_OPTIONS,
  calculateDateRange,
  getDatePresetFromQuery,
  getDatePresetQueryParam,
} from "@/components/on-time/OnTimeFilterPanel/OnTimeFilterPanel";
import { operatorsService } from "@/services/operator.service";
import { OnTimeBoundariesMap } from "@/components/on-time/OnTimeBoundariesMap";
import { OnTimeOperatorTable } from "@/components/on-time/OnTimeOperatorTable/OnTimeOperatorTable";
import { SummaryStatsGrid } from "@/components/on-time/SummaryStatsGrid/SummaryStatsGrid";
import { MultiselectCheckbox } from "@/components/shared/MultiselectCheckbox/MultiselectCheckbox";
import {
  refineResultsToPerformanceFilters,
  performanceFiltersToRefineResults,
} from "@/components/shared/RefineResults/RefineResultsFilters";
import { OnTimeHelpdeskButton } from "@/components/on-time/OnTimeHelpdesk/OnTimeHelpdeskButton";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
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
import { OtpThresholdModalLink } from "@/components/on-time/OtpThreshold/OtpThresholdModalLink";

type AdminOrgMap = AdminOrgListQuery["adminOrgMap"][number];
type AdminArea = NonNullable<GetAdminAreasQuery["adminAreas"]>[number];

const EMPTY_ADMIN_AREA_IDS: string[] = [];

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

const OnTimeIndexPage = () => {
  useRequireAuth();

  const router = useRouter();
  const { config } = useConfig();
  const { loadData } = useHelpdesk();

  useEffect(() => {
    loadData("otp", "On-time performance");
  }, [loadData]);

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

  const refineResultsInitialValues =
    performanceFiltersToRefineResults(refineResultsFilters);

  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(calculateDateRange("Last 7 days"));
  const [appliedQueryDateKey, setAppliedQueryDateKey] = useState<string>();

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
    if (!router.isReady) return;

    if (queryDateRange) {
      setDateRange(queryDateRange);
      setSelectedDatePreset("Custom");
    } else if (queryDatePreset) {
      setDateRange(calculateDateRange(queryDatePreset));
      setSelectedDatePreset(queryDatePreset);
    }
    setAppliedQueryDateKey(queryDateKey);
  }, [router.isReady, queryDateKey, queryDatePreset, queryDateRange]);

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

  const updateAdminAreaQueryParams = (adminAreaIds: string[]) => {
    const query = { ...router.query };

    delete query.adminAreaId;

    void router.replace(
      {
        pathname: router.pathname,
        query: {
          ...query,
          ...(adminAreaIds.length > 0 ? { adminAreaId: adminAreaIds } : {}),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const handleAdminAreaChange = (adminAreaNames: string[]) => {
    setSelectedAdminAreas(adminAreaNames);

    const adminAreaIds = Array.from(
      new Set(
        adminOrgData
          .filter(
            (adminArea) =>
              adminArea.adminName !== null &&
              adminAreaNames.includes(adminArea.adminName),
          )
          .map((adminArea) => adminArea.adminAreaId.toString()),
      ),
    );

    updateAdminAreaQueryParams(adminAreaIds);
  };

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

  useEffect(() => {
    if (!router.isReady || !hasAppliedQueryDate || !config?.apiUrl) return;

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
  }, [
    router.isReady,
    hasAppliedQueryDate,
    config?.apiUrl,
    operatorTableParams,
  ]);

  return (
    <BaseLayout title="All services: Analyse Bus Open Data">
      <span className="govuk-caption-xl">On-time performance</span>
      <h1 className="govuk-heading-xl">All services</h1>

      <OnTimeFilterPanel
        isLoading={isLoading}
        refineResultsInitialValues={refineResultsInitialValues}
        onApplyRefineResults={(values) => {
          setRefineResultsFilters(refineResultsToPerformanceFilters(values));
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

      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className="govuk-heading-l">Summary</h2>

          <div className={styles.adminAreaSelect}>
            <MultiselectCheckbox
              id="on-time-summary-area"
              label={"Area"}
              showAllLabel="Area"
              labelClassName="govuk-visually-hidden"
              options={adminAreaOptions.map((area) => ({
                label: area,
                value: area,
              }))}
              selectedValues={selectedAdminAreas}
              onChange={handleAdminAreaChange}
              placeholder={isLoadingAdminAreas ? "Loading..." : "All areas"}
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
            <div className={styles.content}>
              <div className={styles.summaryStat}>
                <p className="govuk-body-l">
                  <b>{formattedRecordedStopDepartures}</b> departures recorded
                </p>

                <div className={helpdeskStyles.container}>
                  <OnTimeHelpdeskButton />
                  <OtpThresholdModalLink
                    params={operatorTableParams}
                    overview={summaryStats}
                  />
                </div>

                <SummaryStatsGrid
                  compact
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

              <div className={styles.summaryMap}>
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
          </ChartNoDataWrapper>
        )}
      </div>

      <div className={styles.operator}>
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
              selectedAdminAreaIds={selectedAdminAreaIds}
              selectedDatePreset={selectedDatePreset}
            />
          </ChartNoDataWrapper>
        )}
      </div>
    </BaseLayout>
  );
};

export default OnTimeIndexPage;
