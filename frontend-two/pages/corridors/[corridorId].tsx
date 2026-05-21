import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import { DateTime, Duration } from "luxon";
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
import { SegmentedToggle } from "@/components/shared/SegmentedToggle";
import { ErrorInfo } from "@/types";
import { MatchType } from "@/types/corridors";

const NOT_FOUND_HEADING = "Not found";
const NOT_FOUND_MESSAGE =
  "Corridor not found, or you do not have permission to view.";

type AnalysisMode = "time" | "speed";
type AnalysisTab = "timeline" | "timeOfDay" | "dayOfWeek" | "distribution";

const parseCorridorId = (
  value: string | string[] | undefined,
): number | null => {
  const corridorId = Array.isArray(value) ? value[0] : value;
  const parsed = Number(corridorId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const queryValue = (value: string | string[] | undefined): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ?? null;
};

const parseDate = (raw: string | null, fallback: DateTime): DateTime => {
  if (!raw) return fallback;
  const parsed = DateTime.fromISO(raw, { zone: "utc" });
  return parsed.isValid ? parsed : fallback;
};

const toIsoDateInput = (dateTime: DateTime): string =>
  dateTime.toISODate() ?? DateTime.utc().toISODate()!;

const formatTransitTime = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return "Unavailable";
  return Duration.fromObject({ seconds }).toFormat("mm:ss");
};

const parseMatchType = (value: string | null): MatchType =>
  value === "estimated" ? "estimated" : "evidenced";

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

const formatDateDisplay = (dt: DateTime): string => dt.toFormat("d MMM yyyy");

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
    fill="currentColor"
  >
    <path d="M15 2h-1V0h-2v2H8V0H6v2H5C3.9 2 3 2.9 3 4v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 16H5V7h10v11zm0-13H5V4h10v1z" />
  </svg>
);

const CorridorsViewPage = () => {
  useRequireAuth();

  const router = useRouter();
  const { config } = useConfig();
  const { loadData } = useHelpdesk();
  const { hideOutliers, setJourneyTime, setTimeOfDay, setDayOfWeek } =
    useCorridorHideOutliers();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
    config?.apiUrl && corridorId
      ? ["corridor-by-id", config.apiUrl, corridorId]
      : null,
    ([, apiUrl, id]) => corridorsService.fetchCorridorById(apiUrl, id),
  );

  const selectedStops = (() => {
    if (!corridor?.stops?.length) return [];
    if (selectedSegmentIndex === null) return corridor.stops;

    const from = corridor.stops[selectedSegmentIndex];
    const to = corridor.stops[selectedSegmentIndex + 1];
    if (!from || !to) return corridor.stops;
    return [from, to];
  })();

  const fromTimestamp =
    fromDate.toUTC().toISO() ?? defaultFrom.toUTC().toISO()!;
  const toTimestamp = toDate.toUTC().toISO() ?? defaultTo.toUTC().toISO()!;

  const { data: stats, isLoading: statsLoading } = useSWR(
    config?.apiUrl && corridorId && corridor
      ? [
          "corridor-stats",
          config.apiUrl,
          corridorId,
          fromTimestamp,
          toTimestamp,
          matchType,
          selectedStops.map((stop) => stop.naptan).join(","),
        ]
      : null,
    ([, apiUrl]) =>
      corridorsService.fetchStats(apiUrl, {
        corridorId: String(corridorId),
        fromTimestamp,
        toTimestamp,
        matchType,
        stopList: selectedStops.map((stop) => stop.naptan),
      }),
  );

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
              <div className="corridor__date-range-input-wrapper">
                <span className="corridor__date-range-text">
                  {formatDateDisplay(fromDate)} &#x2013;{" "}
                  {formatDateDisplay(toDate)}
                </span>
                <button
                  type="button"
                  className="unbuttoned corridor__date-range-calendar-btn"
                  onClick={() => setIsDatePickerOpen((v) => !v)}
                  aria-label="Open date range picker"
                  aria-expanded={isDatePickerOpen}
                >
                  <CalendarIcon />
                </button>
              </div>
              {isDatePickerOpen && (
                <div className="corridor__date-range-panel">
                  <div>
                    <label className="govuk-label" htmlFor="corridor-from-date">
                      From
                    </label>
                    <input
                      id="corridor-from-date"
                      type="date"
                      className="govuk-input govuk-input--width-10"
                      value={toIsoDateInput(fromDate)}
                      onChange={(event) => {
                        const dt = DateTime.fromISO(event.target.value);
                        if (dt.isValid) {
                          setQuery({
                            from: dt.toUTC().toISO() ?? undefined,
                            preset: "custom",
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="govuk-label" htmlFor="corridor-to-date">
                      To
                    </label>
                    <input
                      id="corridor-to-date"
                      type="date"
                      className="govuk-input govuk-input--width-10"
                      value={toIsoDateInput(toDate)}
                      onChange={(event) => {
                        const dt = DateTime.fromISO(event.target.value);
                        if (dt.isValid) {
                          setQuery({
                            to: dt.toUTC().toISO() ?? undefined,
                            preset: "custom",
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <select
              className="govuk-select"
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              aria-label="Preset date range"
            >
              <option value="last7">Last 7 days</option>
              <option value="last28">Last 28 days</option>
              <option value="lastMonth">Last month</option>
              <option value="monthToDate">Month to date</option>
              {preset === "custom" && <option value="custom">Custom</option>}
            </select>
            <SegmentedToggle
              name="match-type"
              legend="Show performance using data from"
              hideLegend
              value={matchType}
              onChange={(value) => setQuery({ matchType: value })}
              options={[
                { value: "estimated", label: "Estimated" },
                { value: "evidenced", label: "Evidenced" },
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
              isDisabled={statsLoading}
            />
          ) : null}

          <div className="corridor__summary govuk-!-margin-bottom-7">
            <Stat
              id="corridor-total-transits"
              label="Recorded transits"
              className="corridor__summary-stat"
              value={
                statsLoading
                  ? "\u2014"
                  : stats?.summaryStats.totalTransits ?? "Unavailable"
              }
              tooltip="The total number of journeys that actually passed through the corridor according to real-time information received."
            />
            <Stat
              id="corridor-missing-transits"
              label="Missing transits"
              className="corridor__summary-stat"
              value={
                statsLoading
                  ? "\u2014"
                  : stats?.summaryStats.scheduledTransits !== null &&
                      stats?.summaryStats.scheduledTransits !== undefined &&
                      stats?.summaryStats.totalTransits !== null &&
                      stats?.summaryStats.totalTransits !== undefined
                    ? stats.summaryStats.scheduledTransits -
                      stats.summaryStats.totalTransits
                    : "Unavailable"
              }
              tooltip="The number of journeys in the timetables provided that do not have real-time information recorded against them."
            />
            <Stat
              id="corridor-average-journey-time"
              label="Average journey time"
              className="corridor__summary-stat"
              value={
                statsLoading
                  ? "\u2014"
                  : formatTransitTime(stats?.summaryStats.averageTransitTime)
              }
              tooltip="The average time taken for a bus to move through the corridor according to real-time information received."
            />
            <Stat
              id="corridor-average-speed"
              label="Average speed"
              className="corridor__summary-stat"
              value={
                statsLoading
                  ? "\u2014"
                  : averageSpeedLabel(
                      stats?.serviceLinks ?? [],
                      stats?.summaryStats.averageTransitTime,
                    )
              }
              tooltip="The average speed of buses moving through the corridor according to the real-time information received."
            />
            <Stat
              id="corridor-services"
              label="Services"
              className="corridor__summary-stat"
              value={
                statsLoading
                  ? "\u2014"
                  : stats?.summaryStats.numberOfServices ?? "Unavailable"
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

          <div className="govuk-inset-text">
            Map view is being migrated separately. Corridor stats and segment
            filtering are active.
          </div>

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
