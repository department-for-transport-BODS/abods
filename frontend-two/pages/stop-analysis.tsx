import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { DateTime } from "luxon";
import type { FeatureCollection, Feature } from "geojson";
import bbox from "@turf/bbox";
import flip from "@turf/flip";
import { feature } from "@turf/helpers";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { useRequireAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { usePanel } from "@/contexts/PanelContext";
import { ErrorInfo } from "@/types";
import RefineIcon from "@/assets/icons/refine.svg";
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
import {
  StopAnalysisFilters as FiltersPanel,
  RefineFilters,
} from "@/components/stop-analysis/StopAnalysisFilters";
import { StopAnalysisMap } from "@/components/stop-analysis/StopAnalysisMap";
import { StopAnalysisTable } from "@/components/stop-analysis/StopAnalysisTable";
import { MatchType as GqlMatchType } from "../src/generated/graphql";
import { Period } from "@/utils/dateRange";

const MAX_BOUND_WIDTH = 0.5;

const DEFAULT_TO = DateTime.local()
  .startOf("day")
  .minus({ days: 1 })
  .endOf("day");
const DEFAULT_FROM = DateTime.local().startOf("day").minus({ days: 7 });

function getPresetWindow(preset: Period, today: DateTime) {
  const yesterday = today.minus({ days: 1 });

  switch (preset) {
    case "last7":
      return { from: today.minus({ days: 7 }), to: yesterday };
    case "last28":
      return { from: today.minus({ days: 28 }), to: yesterday };
    case "monthToDate":
      return { from: today.startOf("month"), to: yesterday };
    case "lastMonth": {
      const from = today.minus({ months: 1 }).startOf("month");
      return { from, to: from.plus({ months: 1 }).minus({ days: 1 }) };
    }
  }
}

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

function withinBounds(newBounds: BoundingBox, bounds: BoundingBox): boolean {
  return (
    newBounds.minLongitude >= bounds.minLongitude &&
    newBounds.minLatitude >= bounds.minLatitude &&
    newBounds.maxLongitude <= bounds.maxLongitude &&
    newBounds.maxLatitude <= bounds.maxLatitude
  );
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
        direction: x.direction ?? null,
        scheduledDepartures: x.scheduledDepartures,
        actualDepartures: x.completedDepartures,
        onTime: x.onTime,
        early: x.early,
        late: x.late,
        onTimeRatio: x.completedDepartures
          ? x.onTime / x.completedDepartures
          : 0,
        earlyRatio: x.completedDepartures ? x.early / x.completedDepartures : 0,
        lateRatio: x.completedDepartures ? x.late / x.completedDepartures : 0,
        completedRatio: x.scheduledDepartures
          ? x.completedDepartures / x.scheduledDepartures
          : 0,
        averageDelay: getDividedValueOrUndefined(
          x.averageDelay,
          x.countDelayed,
        ),
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
        earlyInSeconds: getDividedValueOrUndefined(x.earlyInSeconds, x.early),
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
          const flipped = flip(
            feature(JSON.parse(area.shape), {
              id: area.id,
              name: area.name,
            }),
            { mutate: true },
          );
          return {
            type: "Feature" as const,
            id: area.id,
            properties: { id: area.id, name: area.name },
            geometry: flipped.geometry,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Feature[],
  };
}

export { computeAdminAreaGeoJSON };

const StopAnalysisPage = () => {
  useRequireAuth();
  const { config } = useConfig();
  const router = useRouter();
  const { setContent, toggle, destroy } = usePanel();
  const boundsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedBoundsRef = useRef<BoundingBox>();
  const lastFetchedFilterSignatureRef = useRef<string>("");
  const [cachedStopData, setCachedStopData] = useState<StopStatistics[]>([]);
  const [locationSelectionRequest, setLocationSelectionRequest] = useState(0);
  const [locationSelection, setLocationSelection] = useState<{
    center?: [number, number];
    bbox?: [number, number, number, number];
  }>();
  const [focusedStop, setFocusedStop] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Read filter state from URL
  const fromTimestamp =
    parseStringParam(router.query.fromTimestamp) ?? DEFAULT_FROM.toISO()!;
  const toTimestamp =
    parseStringParam(router.query.toTimestamp) ?? DEFAULT_TO.toISO()!;
  const matchType = (parseStringParam(router.query.matchType) ??
    GqlMatchType.Evidenced) as MatchType;
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
  const { data: operators } = useSWR("sa-operators", () =>
    stopAnalysisService.fetchOperators(),
  );

  const { data: adminAreas } = useSWR("sa-admin-areas", () =>
    stopAnalysisService.fetchAdminAreas(),
  );

  const { data: lines } = useSWR(
    operatorIds.length > 0
      ? ["sa-lines", operatorIds.join(","), fromTimestamp]
      : null,
    () =>
      stopAnalysisService.fetchLines(operatorIds, fromTimestamp, toTimestamp),
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

  const stopFilterSignature = useMemo(
    () =>
      JSON.stringify({
        adminAreaIds,
        fromTimestamp,
        toTimestamp,
        operatorIds,
        lineIds,
        matchType,
        dayOfWeekFlags,
        startTime,
        endTime,
      }),
    [
      adminAreaIds,
      dayOfWeekFlags,
      endTime,
      fromTimestamp,
      lineIds,
      matchType,
      operatorIds,
      startTime,
      toTimestamp,
    ],
  );

  const shouldFetchStops =
    !!filters &&
    !(
      lastFetchedBoundsRef.current &&
      withinBounds(filters.boundingBox, lastFetchedBoundsRef.current) &&
      stopFilterSignature === lastFetchedFilterSignatureRef.current
    );

  const {
    data: stopData,
    isLoading: stopsLoading,
    error: stopsError,
  } = useSWR(
    filters && shouldFetchStops ? ["sa-stops", JSON.stringify(filters)] : null,
    async () => {
      const result = await stopAnalysisService.fetchStopAnalysis(filters!);
      lastFetchedBoundsRef.current = filters!.boundingBox;
      lastFetchedFilterSignatureRef.current = stopFilterSignature;
      setCachedStopData(result);
      return result;
    },
  );

  const effectiveStopData = filters ? stopData ?? cachedStopData : [];

  // Derive table rows and map features from raw data
  const tableRows = useMemo(
    () =>
      effectiveStopData && bounds
        ? processStopsToRows(effectiveStopData, stopType, bounds)
        : [],
    [effectiveStopData, stopType, bounds],
  );

  const mapStops = useMemo(
    () =>
      effectiveStopData && bounds
        ? aggregateStopsForMap(effectiveStopData, stopType, bounds)
        : [],
    [effectiveStopData, stopType, bounds],
  );

  const visibleAdminAreaIds = useMemo(() => {
    if (adminAreaIds.length > 0) return adminAreaIds;
    if (operatorIds.length === 0) return [];

    return [
      ...new Set(
        (operators ?? [])
          .filter((operator) => operatorIds.includes(operator.operatorId))
          .flatMap((operator) => operator.adminAreaIds),
      ),
    ];
  }, [adminAreaIds, operatorIds, operators]);

  const adminAreaGeoJSON = useMemo(
    () => computeAdminAreaGeoJSON(adminAreas ?? [], visibleAdminAreaIds),
    [adminAreas, visibleAdminAreaIds],
  );

  const selectedAdminAreaBounds = useMemo(() => {
    if (adminAreaGeoJSON.features.length === 0) return null;

    const [minLongitude, minLatitude, maxLongitude, maxLatitude] =
      bbox(adminAreaGeoJSON);

    return {
      minLongitude,
      minLatitude,
      maxLongitude,
      maxLatitude,
    };
  }, [adminAreaGeoJSON]);

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

  const handleAdminAreasChange = useCallback(
    (values: string[]) => {
      updateQuery({ adminAreaIds: values });
    },
    [updateQuery],
  );

  const handleOperatorsChange = useCallback(
    (values: string[]) => {
      updateQuery({ operatorIds: values });
    },
    [updateQuery],
  );

  const handleStopClick = useCallback((stop: StopPerformanceRow) => {
    setFocusedStop({ latitude: stop.latitude, longitude: stop.longitude });
  }, []);

  const handleLocationSelect = useCallback(
    (location: {
      center?: [number, number];
      bbox?: [number, number, number, number];
    }) => {
      setLocationSelection(location);
      setLocationSelectionRequest((prev) => prev + 1);
    },
    [],
  );

  const activeChips: string[] = [];
  if (startTime) activeChips.push(`From ${startTime}`);
  if (endTime) activeChips.push(`Until ${endTime}`);
  if (dayOfWeekFlags) {
    const days = Object.entries(dayOfWeekFlags)
      .filter(([, v]) => v)
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
    if (days.length > 0 && days.length < 7) {
      activeChips.push(days.join(", "));
    }
  }

  useEffect(() => {
    setContent(
      <RefineFilters
        dayOfWeekFlags={dayOfWeekFlags}
        startTime={startTime}
        endTime={endTime}
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
        onResetDefaults={() =>
          updateQuery({
            dayOfWeek: undefined,
            startTime: "00:00",
            endTime: "23:59",
          })
        }
        onClose={toggle}
      />,
    );
  }, [dayOfWeekFlags, startTime, endTime, setContent, toggle, updateQuery]);

  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  return (
    <BaseLayout title="Stop analysis - Analyse Bus Open Data">
      <div className="stop-analysis-page">
        <div className="stop-analysis-page__header">
          <h1 className="govuk-heading-xl">Stop Analysis</h1>
          <div className="stop-analysis-page__extra-filter">
            <button
              type="button"
              className="govuk-link button-link stop-analysis-filters__refine-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
              aria-controls="panel"
              onClick={toggle}
            >
              <RefineIcon
                aria-hidden="true"
                focusable="false"
                style={{ display: "block", flexShrink: 0 }}
              />
              <span>Refine results</span>
            </button>
            {activeChips.length > 0 && (
              <div className="stop-analysis-filters__chips">
                {activeChips.map((chip) => (
                  <span key={chip} className="stop-analysis-filters__chip">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

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
          mapboxToken={config?.mapboxToken}
          adminAreas={adminAreas ?? []}
          operators={operators ?? []}
          lines={lines ?? []}
          onDateRangeChange={(from, to) =>
            updateQuery({ fromTimestamp: from, toTimestamp: to })
          }
          onPresetChange={(preset: Period) => {
            const range = getPresetWindow(
              preset,
              DateTime.local().startOf("day"),
            );
            updateQuery({
              fromTimestamp: range.from.startOf("day").toISO()!,
              toTimestamp: range.to.endOf("day").toISO()!,
            });
          }}
          onAdminAreasChange={handleAdminAreasChange}
          onOperatorsChange={handleOperatorsChange}
          onLinesChange={(v) => updateQuery({ lineIds: v })}
          onMatchTypeChange={(v) => updateQuery({ matchType: v })}
          onStopTypeChange={(v) => updateQuery({ stopType: v })}
          onLocationSelect={handleLocationSelect}
        />

        {config?.mapboxToken && config?.mapboxStyle && (
          <StopAnalysisMap
            mapboxToken={config.mapboxToken}
            mapboxStyle={config.mapboxStyle}
            mapboxSatelliteStyle={config.mapboxSatelliteStyle}
            stops={mapStops}
            adminAreaShapes={adminAreaGeoJSON}
            boundingBoxTooBig={boundingBoxTooBig}
            initialBounds={bounds}
            focusStop={focusedStop}
            selectedAdminAreaBounds={selectedAdminAreaBounds}
            locationSelection={locationSelection}
            locationSelectionRequest={locationSelectionRequest}
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
          showTotals
          onDirectionsChange={(dirs) => updateQuery({ direction: dirs })}
          onStopNameClick={handleStopClick}
        />
      </div>
    </BaseLayout>
  );
};

export default StopAnalysisPage;
