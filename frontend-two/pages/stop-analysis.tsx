import { useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { DateTime } from "luxon";
import type { FeatureCollection, Feature } from "geojson";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { ErrorInfo } from "@/types";
import {
  BoundingBox,
  DayOfWeekFlags,
  Direction,
  MatchType,
  StopAnalysisFilters,
  StopPerformanceRow,
  StopStatistics,
  StopTypeOption,
} from "@/types/stop-analysis";
import { stopAnalysisService } from "@/services/stop-analysis/stop-analysis.service";
import { StopAnalysisFilters as FiltersPanel } from "@/components/stop-analysis/StopAnalysisFilters";
import { StopAnalysisMap } from "@/components/stop-analysis/StopAnalysisMap";
import { StopAnalysisTable } from "@/components/stop-analysis/StopAnalysisTable";

const MAX_BOUND_WIDTH = 0.5;

const DEFAULT_FROM = DateTime.local().minus({ days: 7 }).startOf("day");
const DEFAULT_TO = DateTime.local().endOf("day");

function parseArrayParam(param: string | string[] | undefined): string[] {
  if (!param) return [];
  return Array.isArray(param) ? param : [param];
}

function parseStringParam(
  param: string | string[] | undefined,
): string | undefined {
  if (!param) return undefined;
  return Array.isArray(param) ? param[0] : param;
}

function parseDayOfWeekFlags(
  param: string | string[] | undefined,
): DayOfWeekFlags | undefined {
  const raw = parseStringParam(param);
  if (!raw) return undefined;
  const days = raw.split(",");
  return {
    monday: days.includes("monday"),
    tuesday: days.includes("tuesday"),
    wednesday: days.includes("wednesday"),
    thursday: days.includes("thursday"),
    friday: days.includes("friday"),
    saturday: days.includes("saturday"),
    sunday: days.includes("sunday"),
  };
}

function parseBoundingBox(
  query: Record<string, string | string[] | undefined>,
): BoundingBox | undefined {
  const minLat = parseFloat(parseStringParam(query.minLatitude) ?? "");
  const maxLat = parseFloat(parseStringParam(query.maxLatitude) ?? "");
  const minLon = parseFloat(parseStringParam(query.minLongitude) ?? "");
  const maxLon = parseFloat(parseStringParam(query.maxLongitude) ?? "");
  if ([minLat, maxLat, minLon, maxLon].some(isNaN)) return undefined;
  return {
    minLatitude: minLat,
    maxLatitude: maxLat,
    minLongitude: minLon,
    maxLongitude: maxLon,
  };
}

function getDividedValueOrUndefined(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number | undefined {
  if (numerator == null || denominator == null) return undefined;
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function processStopsToRows(
  stops: StopStatistics[],
  stopType: StopTypeOption,
  bounds: BoundingBox,
): StopPerformanceRow[] {
  const filtered = stops.filter(
    (s) =>
      (stopType !== "TimingPoints" || s.timingPoint) &&
      s.latitude >= bounds.minLatitude &&
      s.latitude <= bounds.maxLatitude &&
      s.longitude >= bounds.minLongitude &&
      s.longitude <= bounds.maxLongitude,
  );

  return filtered
    .map(
      (x): StopPerformanceRow => ({
        stopId: x.atcoCode,
        stopName: x.stopName,
        localityName: x.localityName,
        adminAreaName: x.adminAreaName,
        timingPoint: x.timingPoint,
        latitude: x.latitude,
        longitude: x.longitude,
        direction: x.direction,
        scheduledDepartures: x.scheduledDepartures,
        actualDepartures: x.completedDepartures,
        onTime: x.onTime,
        early: x.early,
        late: x.late,
        onTimeRatio: x.completedDepartures
          ? x.onTime / x.completedDepartures
          : 0,
        earlyRatio: x.completedDepartures
          ? x.early / x.completedDepartures
          : 0,
        lateRatio: x.completedDepartures
          ? x.late / x.completedDepartures
          : 0,
        completedRatio: x.scheduledDepartures
          ? x.completedDepartures / x.scheduledDepartures
          : 0,
        averageDelay: getDividedValueOrUndefined(x.averageDelay, x.countDelayed),
        averageScheduled:
          stopType === "TimingPoints"
            ? x.averageScheduledTimingPoint
            : x.averageScheduled,
        averageActual:
          stopType === "TimingPoints"
            ? x.averageActualTimingPoint
            : x.averageActual,
        onTimeInSeconds: getDividedValueOrUndefined(
          x.onTimeInSeconds,
          x.onTime,
        ),
        earlyInSeconds: getDividedValueOrUndefined(
          x.earlyInSeconds,
          x.early,
        ),
        lateInSeconds: getDividedValueOrUndefined(x.lateInSeconds, x.late),
      }),
    )
    .sort((a, b) => a.stopName.localeCompare(b.stopName));
}

function aggregateStopsForMap(
  stops: StopStatistics[],
  stopType: StopTypeOption,
  bounds: BoundingBox,
): StopStatistics[] {
  const filtered = stops.filter(
    (s) =>
      (stopType !== "TimingPoints" || s.timingPoint) &&
      s.latitude >= bounds.minLatitude &&
      s.latitude <= bounds.maxLatitude &&
      s.longitude >= bounds.minLongitude &&
      s.longitude <= bounds.maxLongitude,
  );

  // Combine timing point and non-timing point records for same ATCO code
  const aggregated = filtered.reduce(
    (acc, cur) => {
      if (!acc[cur.atcoCode]) {
        acc[cur.atcoCode] = { ...cur };
        return acc;
      }
      const existing = acc[cur.atcoCode];
      acc[cur.atcoCode] = {
        ...existing,
        timingPoint: existing.timingPoint || cur.timingPoint,
        onTime: existing.onTime + cur.onTime,
        early: existing.early + cur.early,
        late: existing.late + cur.late,
        completedDepartures:
          existing.completedDepartures + cur.completedDepartures,
        scheduledDepartures:
          existing.scheduledDepartures + cur.scheduledDepartures,
        totalDelay: existing.totalDelay + cur.totalDelay,
      };
      return acc;
    },
    {} as Record<string, StopStatistics>,
  );

  return Object.values(aggregated);
}

function computeAdminAreaGeoJSON(
  adminAreas: { id: string; name: string; shape: string }[],
  selectedIds: string[],
): FeatureCollection {
  const areas =
    selectedIds.length > 0
      ? adminAreas.filter((a) => selectedIds.includes(a.id))
      : adminAreas;

  return {
    type: "FeatureCollection",
    features: areas
      .map((area) => {
        try {
          const geometry = JSON.parse(area.shape);
          return {
            type: "Feature" as const,
            id: area.id,
            properties: { id: area.id, name: area.name },
            geometry,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Feature[],
  };
}

const StopAnalysisPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const router = useRouter();
  const boundsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read filter state from URL
  const fromTimestamp =
    parseStringParam(router.query.fromTimestamp) ?? DEFAULT_FROM.toISO()!;
  const toTimestamp =
    parseStringParam(router.query.toTimestamp) ?? DEFAULT_TO.toISO()!;
  const matchType = (parseStringParam(router.query.matchType) ??
    "evidenced") as MatchType;
  const stopType = (parseStringParam(router.query.stopType) ??
    "TimingPoints") as StopTypeOption;
  const adminAreaIds = parseArrayParam(router.query.adminAreaIds);
  const operatorIds = parseArrayParam(router.query.operatorIds);
  const lineIds = parseArrayParam(router.query.lineIds);
  const dayOfWeekFlags = parseDayOfWeekFlags(router.query.dayOfWeek);
  const startTime = parseStringParam(router.query.startTime);
  const endTime = parseStringParam(router.query.endTime);
  const directions = (
    parseArrayParam(router.query.direction).length > 0
      ? parseArrayParam(router.query.direction)
      : ["Inbound", "Outbound"]
  ) as Direction[];
  const bounds = parseBoundingBox(router.query);

  const boundingBoxTooBig = bounds
    ? bounds.maxLongitude - bounds.minLongitude >= MAX_BOUND_WIDTH
    : true;

  // Update URL params (shallow — no page reload)
  const updateQuery = useCallback(
    (updates: Record<string, string | string[] | undefined>) => {
      router.replace(
        { pathname: router.pathname, query: { ...router.query, ...updates } },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  // Fetch reference data
  const { data: operators } = useSWR(
    config?.apiUrl ? ["sa-operators", config.apiUrl] : null,
    ([, apiUrl]) => stopAnalysisService.fetchOperators(apiUrl),
  );

  const { data: adminAreas } = useSWR(
    config?.apiUrl ? ["sa-admin-areas", config.apiUrl] : null,
    ([, apiUrl]) => stopAnalysisService.fetchAdminAreas(apiUrl),
  );

  const { data: lines } = useSWR(
    config?.apiUrl && operatorIds.length > 0
      ? ["sa-lines", config.apiUrl, operatorIds.join(","), fromTimestamp]
      : null,
    ([, apiUrl]) =>
      stopAnalysisService.fetchLines(apiUrl, operatorIds, fromTimestamp, toTimestamp),
  );

  // Fetch stop analysis data (only when bounds are small enough)
  const filters: StopAnalysisFilters | null =
    bounds && !boundingBoxTooBig
      ? {
          adminAreaIds,
          boundingBox: bounds,
          fromTimestamp,
          toTimestamp,
          operatorIds,
          lineIds,
          matchType,
          dayOfWeekFlags,
          startTime,
          endTime,
        }
      : null;

  const {
    data: stopData,
    isLoading: stopsLoading,
    error: stopsError,
  } = useSWR(
    config?.apiUrl && filters
      ? ["sa-stops", config.apiUrl, JSON.stringify(filters)]
      : null,
    ([, apiUrl]) => stopAnalysisService.fetchStopAnalysis(apiUrl, filters!),
  );

  // Derive table rows and map features from raw data
  const tableRows = useMemo(
    () =>
      stopData && bounds
        ? processStopsToRows(stopData, stopType, bounds)
        : [],
    [stopData, stopType, bounds],
  );

  const mapStops = useMemo(
    () =>
      stopData && bounds
        ? aggregateStopsForMap(stopData, stopType, bounds)
        : [],
    [stopData, stopType, bounds],
  );

  const adminAreaGeoJSON = useMemo(
    () => computeAdminAreaGeoJSON(adminAreas ?? [], adminAreaIds),
    [adminAreas, adminAreaIds],
  );

  // Error state
  const errors: ErrorInfo[] =
    stopsError && !stopsLoading
      ? [
          {
            id: "load-error",
            errorMessage:
              "Unable to load stop analysis data. Please try again later.",
          },
        ]
      : [];

  // Handlers
  const handleBoundsChange = useCallback(
    (newBounds: BoundingBox) => {
      if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current);
      boundsDebounceRef.current = setTimeout(() => {
        updateQuery({
          minLatitude: String(newBounds.minLatitude),
          maxLatitude: String(newBounds.maxLatitude),
          minLongitude: String(newBounds.minLongitude),
          maxLongitude: String(newBounds.maxLongitude),
        });
      }, 500);
    },
    [updateQuery],
  );

  const handleAdminAreaClick = useCallback(
    (adminAreaId: string) => {
      if (adminAreaIds.length > 0) return;
      updateQuery({ adminAreaIds: [adminAreaId] });
    },
    [adminAreaIds, updateQuery],
  );

  const handleStopClick = useCallback((_stop: StopPerformanceRow) => {
    // TODO: zoom map to stop location
  }, []);

  return (
    <BaseLayout title="Stop analysis - Analyse Bus Open Data">
      <div className="stop-analysis-page">
        <h1 className="govuk-heading-xl">Stop Analysis</h1>

        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds-from-desktop">
            <ErrorSummary errors={errors} />
          </div>
        </div>

        <FiltersPanel
          fromTimestamp={fromTimestamp}
          toTimestamp={toTimestamp}
          adminAreaIds={adminAreaIds}
          operatorIds={operatorIds}
          lineIds={lineIds}
          matchType={matchType}
          stopType={stopType}
          dayOfWeekFlags={dayOfWeekFlags}
          startTime={startTime}
          endTime={endTime}
          adminAreas={adminAreas ?? []}
          operators={operators ?? []}
          lines={lines ?? []}
          onFromChange={(v) => updateQuery({ fromTimestamp: v })}
          onToChange={(v) => updateQuery({ toTimestamp: v })}
          onAdminAreasChange={(v) => updateQuery({ adminAreaIds: v })}
          onOperatorsChange={(v) => updateQuery({ operatorIds: v })}
          onLinesChange={(v) => updateQuery({ lineIds: v })}
          onMatchTypeChange={(v) => updateQuery({ matchType: v })}
          onStopTypeChange={(v) => updateQuery({ stopType: v })}
          onDayOfWeekChange={(flags) =>
            updateQuery({
              dayOfWeek: flags
                ? Object.entries(flags)
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(",")
                : undefined,
            })
          }
          onStartTimeChange={(v) => updateQuery({ startTime: v })}
          onEndTimeChange={(v) => updateQuery({ endTime: v })}
        />

        {config?.mapboxToken && config?.mapboxStyle && (
          <StopAnalysisMap
            mapboxToken={config.mapboxToken}
            mapboxStyle={config.mapboxStyle}
            stops={mapStops}
            adminAreaShapes={adminAreaGeoJSON}
            boundingBoxTooBig={boundingBoxTooBig}
            initialBounds={bounds}
            onBoundsChange={handleBoundsChange}
            onAdminAreaClick={handleAdminAreaClick}
          />
        )}

        {stopsLoading && <p className="govuk-body">Loading...</p>}

        <StopAnalysisTable
          data={tableRows}
          loading={stopsLoading}
          errored={!!stopsError}
          directions={directions}
          onDirectionsChange={(dirs) => updateQuery({ direction: dirs })}
          onStopNameClick={handleStopClick}
        />
      </div>
    </BaseLayout>
  );
};

export default StopAnalysisPage;
