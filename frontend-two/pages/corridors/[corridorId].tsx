import Link from "next/link";
import { useRouter } from "next/router";
import useSWR from "swr";
import { DateTime, Duration } from "luxon";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { Stat } from "@/components/shared/Stat";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { useCorridorHideOutliers } from "@/hooks/useCorridorHideOutliers";
import { corridorsService } from "@/services/corridors/corridors.service";
import { averageSpeedLabel } from "@/services/corridors/corridors-speed-metric";
import { CorridorAnalysisPanel } from "@/components/corridors/view/CorridorAnalysisPanel";
import { CorridorSegmentSelector } from "@/components/corridors/view/CorridorSegmentSelector";
import { CorridorServicesTable } from "@/components/corridors/view/CorridorServicesTable";
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

const CorridorsViewPage = () => {
  useRequireAuth();

  const router = useRouter();
  const { config } = useConfig();
  const { hideOutliers, setJourneyTime, setTimeOfDay, setDayOfWeek } =
    useCorridorHideOutliers();

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

          <div className="govuk-grid-row govuk-!-margin-bottom-5">
            <div className="govuk-grid-column-one-quarter">
              <label className="govuk-label" htmlFor="corridor-from-date">
                From
              </label>
              <input
                id="corridor-from-date"
                type="date"
                className="govuk-input"
                value={toIsoDateInput(fromDate)}
                onChange={(event) =>
                  setQuery({
                    from:
                      DateTime.fromISO(event.target.value).toUTC().toISO() ??
                      undefined,
                  })
                }
              />
            </div>
            <div className="govuk-grid-column-one-quarter">
              <label className="govuk-label" htmlFor="corridor-to-date">
                To
              </label>
              <input
                id="corridor-to-date"
                type="date"
                className="govuk-input"
                value={toIsoDateInput(toDate)}
                onChange={(event) =>
                  setQuery({
                    to:
                      DateTime.fromISO(event.target.value).toUTC().toISO() ??
                      undefined,
                  })
                }
              />
            </div>
            <div className="govuk-grid-column-one-quarter">
              <fieldset className="govuk-fieldset">
                <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                  Show performance using data from
                </legend>
                <div className="govuk-radios govuk-radios--small">
                  <div className="govuk-radios__item">
                    <input
                      className="govuk-radios__input"
                      id="corridor-match-estimated"
                      type="radio"
                      checked={matchType === "estimated"}
                      onChange={() => setQuery({ matchType: "estimated" })}
                    />
                    <label
                      className="govuk-label govuk-radios__label"
                      htmlFor="corridor-match-estimated"
                    >
                      Estimated
                    </label>
                  </div>
                  <div className="govuk-radios__item">
                    <input
                      className="govuk-radios__input"
                      id="corridor-match-evidenced"
                      type="radio"
                      checked={matchType === "evidenced"}
                      onChange={() => setQuery({ matchType: "evidenced" })}
                    />
                    <label
                      className="govuk-label govuk-radios__label"
                      htmlFor="corridor-match-evidenced"
                    >
                      Evidenced
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="govuk-grid-column-one-quarter govuk-!-text-align-right">
              {corridor ? (
                <Link
                  href={`/corridors/edit/${corridor.id}`}
                  role="button"
                  draggable={false}
                  className="govuk-button govuk-button--secondary"
                  data-module="govuk-button"
                >
                  Edit corridor
                </Link>
              ) : null}
            </div>
          </div>

          {corridor ? (
            <CorridorSegmentSelector
              stops={corridor.stops}
              selectedSegmentIndex={selectedSegmentIndex}
              onChangeSegmentIndex={(value) =>
                setQuery({
                  segment: value === null ? undefined : String(value),
                })
              }
              isDisabled={statsLoading}
            />
          ) : null}

          {stats ? (
            <>
              <div className="govuk-grid-row govuk-!-margin-bottom-4">
                <div className="govuk-grid-column-one-half">
                  <Stat
                    id="corridor-total-transits"
                    label="Recorded transits"
                    value={stats.summaryStats.totalTransits ?? "Unavailable"}
                  />
                </div>
                <div className="govuk-grid-column-one-half">
                  <Stat
                    id="corridor-missing-transits"
                    label="Missing transits"
                    value={
                      stats.summaryStats.scheduledTransits !== null &&
                      stats.summaryStats.totalTransits !== null
                        ? stats.summaryStats.scheduledTransits -
                          stats.summaryStats.totalTransits
                        : "Unavailable"
                    }
                  />
                </div>
              </div>
              <div className="govuk-grid-row govuk-!-margin-bottom-6">
                <div className="govuk-grid-column-one-half">
                  <Stat
                    id="corridor-average-journey-time"
                    label="Average journey time"
                    value={formatTransitTime(
                      stats.summaryStats.averageTransitTime,
                    )}
                  />
                </div>
                <div className="govuk-grid-column-one-half">
                  <Stat
                    id="corridor-average-speed"
                    label="Average speed"
                    value={averageSpeedLabel(
                      stats.serviceLinks,
                      stats.summaryStats.averageTransitTime,
                    )}
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className="govuk-form-group govuk-!-margin-bottom-4">
            <fieldset className="govuk-fieldset">
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">
                Analysis
              </legend>
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
            </fieldset>
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
