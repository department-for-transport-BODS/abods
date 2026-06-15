import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import { DateTime } from "luxon";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { Stat } from "@/components/shared/Stat";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import { useCorridorHideOutliers } from "@/hooks/useCorridorHideOutliers";
import { corridorsService } from "@/services/corridors/corridors.service";
import { averageSpeedLabel } from "@/services/corridors/corridors-speed-utils";
import { CorridorAnalysisPanel } from "@/components/corridors/view/CorridorAnalysisPanel";
import { CorridorSegmentSelector } from "@/components/corridors/view/CorridorSegmentSelector";
import { CorridorServicesTable } from "@/components/corridors/view/CorridorServicesTable";
import { CorridorViewMap } from "@/components/corridors/view/CorridorViewMap";
import { DateRangeSelect } from "@/components/shared/DateRangeSelect";
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import { ErrorInfo } from "@/types";
import { parseCorridorId, parseMatchType, queryValue } from "@/utils/query";
import { formatTransitTime, parseDate } from "@/utils/date";
import { CorridorGranularity, MatchType } from "../../src/generated/graphql";

const NOT_FOUND_HEADING = "Not found";
const NOT_FOUND_MESSAGE =
  "Corridor not found, or you do not have permission to view.";

type AnalysisMode = "time" | "speed";
type AnalysisTab = "timeline" | "timeOfDay" | "dayOfWeek" | "distribution";

const LoadingDots = () => (
  <span role="status" aria-live="polite">
    <span className="govuk-visually-hidden">Loading...</span>
    <span className="ranking-table__loading-dots" aria-hidden="true">
      <span className="ranking-table__loading-dot" />
      <span className="ranking-table__loading-dot" />
      <span className="ranking-table__loading-dot" />
    </span>
  </span>
);

const PRESET_DATE_RANGES: Record<
  string,
  (today: DateTime) => { from: DateTime; to: DateTime }
> = {
  last7: (t) => ({ from: t.minus({ days: 7 }), to: t }),
  last28: (t) => ({ from: t.minus({ days: 28 }), to: t }),
  lastMonth: (t) => ({
    from: t.minus({ months: 1 }).startOf("month"),
    to: t.minus({ months: 1 }).endOf("month").startOf("day"),
  }),
  monthToDate: (t) => ({ from: t.startOf("month"), to: t }),
};

const CorridorsViewPage = () => {
  useRequireAuth();

  const router = useRouter();
  const { config } = useConfig();
  const { loadData } = useHelpdesk();
  const { hideOutliers, setJourneyTime, setTimeOfDay, setDayOfWeek } =
    useCorridorHideOutliers();

  useEffect(() => {
    loadData("corridors", "Corridors");
  }, [loadData]);

  const corridorId = parseCorridorId(router.query.corridorId);

  const defaultTo = DateTime.utc().startOf("day");
  const defaultFrom = defaultTo.minus({ days: 7 });

  const fromDate = parseDate(queryValue(router.query.from), defaultFrom);
  const toDate = parseDate(queryValue(router.query.to), defaultTo);
  const matchType = parseMatchType(queryValue(router.query.matchType));
  const mode: AnalysisMode =
    queryValue(router.query.mode) === "speed" ? "speed" : "time";
  const tab: AnalysisTab =
    queryValue(router.query.tab) === "timeOfDay" ||
    queryValue(router.query.tab) === "dayOfWeek" ||
    queryValue(router.query.tab) === "distribution"
      ? (queryValue(router.query.tab) as AnalysisTab)
      : "timeline";

  const preset = queryValue(router.query.preset) ?? "last7";

  const selectedSegment = queryValue(router.query.segment);
  const selectedSegmentIndex =
    selectedSegment && Number.isInteger(Number(selectedSegment))
      ? Number(selectedSegment)
      : null;

  const { data: corridor, isLoading: corridorLoading } = useSWR(
    corridorId ? ["corridor-by-id", corridorId] : null,
    ([, id]) => corridorsService.fetchCorridorById(id),
  );

  const selectedStops = (() => {
    if (!corridor?.stops?.length) return [];
    if (selectedSegmentIndex === null) return corridor.stops;

    const from = corridor.stops[selectedSegmentIndex];
    const to = corridor.stops[selectedSegmentIndex + 1];
    if (!from || !to) return corridor.stops;
    return [from, to];
  })();

  const granularityFromRange = (
    from: DateTime,
    to: DateTime,
  ): CorridorGranularity => {
    return Math.abs(to.diff(from, "days").days) < 5
      ? CorridorGranularity.Hour
      : CorridorGranularity.Day;
  };

  const from = fromDate.toUTC() ?? defaultFrom.toUTC()!;
  const to = toDate.toUTC() ?? defaultTo.toUTC()!;
  const granularity = granularityFromRange(fromDate, toDate);

  const { data: stats, isLoading: statsLoading } = useSWR(
    corridorId && corridor
      ? [
          "corridor-stats",
          corridorId,
          from,
          to,
          granularity,
          matchType,
          selectedStops.map((stop) => stop.naptan).join(","),
        ]
      : null,
    ([,]) =>
      corridorsService.fetchStats({
        corridorId: String(corridorId),
        from,
        to,
        granularity,
        matchType,
        stops: selectedStops,
      }),
  );

  const isStatsLoading = corridorLoading || statsLoading;

  const showNotFound =
    !corridorLoading && (corridorId === null || corridor === null);

  const errors: ErrorInfo[] =
    !statsLoading && corridor && !stats
      ? [
          {
            id: "corridor-stats-error",
            errorMessage:
              "We have not found any journey time data for the date period selected.",
          },
        ]
      : [];

  const handlePresetChange = (newPreset: string) => {
    const today = DateTime.utc().startOf("day");
    const rangeBuilder = PRESET_DATE_RANGES[newPreset];
    if (rangeBuilder) {
      const range = rangeBuilder(today);
      setQuery({
        preset: newPreset,
        from: range.from.toUTC().toISO() ?? undefined,
        to: range.to.toUTC().toISO() ?? undefined,
      });
    }
  };

  const setQuery = (updates: Record<string, string | undefined>) => {
    router
      .replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            ...updates,
          },
        },
        undefined,
        { shallow: true },
      )
      .catch(() => {
        /* noop */
      });
  };

  const handleDateRangeChange = (from: string, to: string) => {
    const fromDate = DateTime.fromISO(from).startOf("day");
    const toDate = DateTime.fromISO(to).endOf("day");

    setQuery({
      from: fromDate.toUTC().toISO() ?? undefined,
      to: toDate.toUTC().toISO() ?? undefined,
      preset: "custom",
    });
  };

  return (
    <BaseLayout title="Corridor - Analyse Bus Open Data">
      <Link href="/corridors" className="govuk-back-link">
        All corridors
      </Link>

      {showNotFound ? (
        <>
          <span className="govuk-caption-xl">Corridors</span>
          <h1 className="govuk-heading-xl">{NOT_FOUND_HEADING}</h1>
          <p className="govuk-body">
            {NOT_FOUND_MESSAGE} Go back to{" "}
            <Link href="/corridors">All corridors</Link>?
          </p>
        </>
      ) : (
        <>
          <span className="govuk-caption-xl">Corridors</span>
          <h1 className="govuk-heading-xl">
            {corridorLoading ? "Loading..." : corridor?.name ?? "Corridor"}
          </h1>

          <div className="govuk-grid-row">
            <div className="govuk-grid-column-two-thirds-from-desktop">
              <ErrorSummary errors={errors} />
            </div>
          </div>

          <div className="corridor__date-wrapper govuk-!-margin-bottom-5">
            <div className="corridor__date-range-picker">
              <div className="stop-analysis-filters__date-range">
                <DateRangeSelect
                  value={{ from: fromDate.toISO()!, to: toDate.toISO()! }}
                  onChange={({ from, to }) => handleDateRangeChange(from, to)}
                  hideLabel
                />
                <select
                  className="govuk-select stop-analysis-filters__preset-select"
                  value={preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  aria-label="Preset date range"
                >
                  <option value="last7">Last 7 days</option>
                  <option value="last28">Last 28 days</option>
                  <option value="lastMonth">Last month</option>
                  <option value="monthToDate">Month to date</option>
                  {preset === "custom" && (
                    <option value="custom">Custom</option>
                  )}
                </select>
              </div>
            </div>
            <SegmentedToggle
              name="match-type"
              legend="Show performance using data from"
              hideLegend
              value={matchType}
              onChange={(value) => setQuery({ matchType: value })}
              options={[
                { value: MatchType.Estimated, label: "Estimated" },
                { value: MatchType.Evidenced, label: "Evidenced" },
              ]}
            />
            {corridor ? (
              <Link
                href={`/corridors/edit/${corridor.id}`}
                role="button"
                draggable={false}
                className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
                data-module="govuk-button"
              >
                Edit corridor
              </Link>
            ) : null}
          </div>

          {corridor ? (
            <CorridorSegmentSelector
              stops={corridor.stops}
              serviceLinks={stats?.serviceLinks}
              selectedSegmentIndex={selectedSegmentIndex}
              onChangeSegmentIndex={(value) =>
                setQuery({
                  segment: value === null ? undefined : String(value),
                })
              }
              isDisabled={isStatsLoading}
            />
          ) : null}

          <div className="corridor__summary govuk-!-margin-bottom-7">
            <Stat
              id="corridor-total-transits"
              label="Recorded transits"
              className="corridor__summary-stat"
              value={
                isStatsLoading ? (
                  <LoadingDots />
                ) : (
                  stats?.summaryStats.totalTransits ?? "Unavailable"
                )
              }
              tooltip="The total number of journeys that actually passed through the corridor according to real-time information received."
            />
            <Stat
              id="corridor-missing-transits"
              label="Missing transits"
              className="corridor__summary-stat"
              value={
                isStatsLoading ? (
                  <LoadingDots />
                ) : stats?.summaryStats.scheduledTransits !== null &&
                  stats?.summaryStats.scheduledTransits !== undefined &&
                  stats?.summaryStats.totalTransits !== null &&
                  stats?.summaryStats.totalTransits !== undefined ? (
                  stats.summaryStats.scheduledTransits -
                  stats.summaryStats.totalTransits
                ) : (
                  "Unavailable"
                )
              }
              tooltip="The number of journeys in the timetables provided that do not have real-time information recorded against them."
            />
            <Stat
              id="corridor-average-journey-time"
              label="Average journey time"
              className="corridor__summary-stat"
              value={
                isStatsLoading ? (
                  <LoadingDots />
                ) : (
                  formatTransitTime(stats?.summaryStats.averageTransitTime)
                )
              }
              tooltip="The average time taken for a bus to move through the corridor according to real-time information received."
            />
            <Stat
              id="corridor-average-speed"
              label="Average speed"
              className="corridor__summary-stat"
              value={
                isStatsLoading ? (
                  <LoadingDots />
                ) : (
                  averageSpeedLabel(
                    stats?.serviceLinks ?? [],
                    stats?.summaryStats.averageTransitTime,
                  )
                )
              }
              tooltip="The average speed of buses moving through the corridor according to the real-time information received."
            />
            <Stat
              id="corridor-services"
              label="Services"
              className="corridor__summary-stat"
              value={
                isStatsLoading ? (
                  <LoadingDots />
                ) : (
                  stats?.summaryStats.numberOfServices ?? "Unavailable"
                )
              }
              tooltip="The total number of different services that pass through this corridor."
            />
          </div>

          <div className="corridor__analysis-selector govuk-!-margin-bottom-4">
            <h2 className="govuk-heading-m govuk-!-margin-top-0 govuk-!-margin-bottom-0">
              Analysis
            </h2>
            <div className="govuk-radios govuk-radios--inline govuk-radios--small">
              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="corridor-mode-time"
                  type="radio"
                  checked={mode === "time"}
                  onChange={() => setQuery({ mode: "time" })}
                />
                <label
                  className="govuk-label govuk-radios__label"
                  htmlFor="corridor-mode-time"
                >
                  Journey time
                </label>
              </div>
              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="corridor-mode-speed"
                  type="radio"
                  checked={mode === "speed"}
                  onChange={() => setQuery({ mode: "speed" })}
                />
                <label
                  className="govuk-label govuk-radios__label"
                  htmlFor="corridor-mode-speed"
                >
                  Speed
                </label>
              </div>
            </div>
          </div>

          {corridor && config ? (
            <CorridorViewMap
              stops={corridor.stops}
              serviceLinks={stats?.serviceLinks ?? []}
              selectedSegmentIndex={selectedSegmentIndex}
              mapboxToken={config.mapboxToken}
              mapboxStyle={config.mapboxStyle}
              mapboxSatelliteStyle={config.mapboxSatelliteStyle}
            />
          ) : null}

          {stats ? (
            <CorridorAnalysisPanel
              stats={stats}
              tab={tab}
              onChangeTab={(value) => setQuery({ tab: value })}
              hideOutliers={hideOutliers}
              onChangeHideOutliers={{
                setJourneyTime,
                setTimeOfDay,
                setDayOfWeek,
              }}
            />
          ) : null}

          <h2 className="govuk-heading-m">Services</h2>
          <CorridorServicesTable
            services={stats?.transitTimePerServiceStats ?? []}
            serviceLinks={stats?.serviceLinks ?? []}
            isLoading={statsLoading}
          />
        </>
      )}
    </BaseLayout>
  );
};

export default CorridorsViewPage;
