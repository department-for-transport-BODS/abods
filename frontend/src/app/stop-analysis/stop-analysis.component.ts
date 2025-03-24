import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Feature, FeatureCollection, Point, Polygon } from "geojson";
import {
  CirclePaint,
  EventData,
  GeoJSONSource,
  LngLat,
  LngLatBounds,
  LngLatBoundsLike,
  Map,
  MapboxGeoJSONFeature,
  MapMouseEvent,
  SymbolLayout,
} from "mapbox-gl";
import { ConfigService } from "../config/config.service";
import { asBbox, BRITISH_ISLES_BBOX } from "../shared/geo";
import {
  BoundingBoxInputType,
  MatchType,
  OperatorListGQL,
  OperatorType,
  PerformanceFiltersInputType,
  StopAnalysisGQL,
  StopAnalysisQueryVariables,
  StopStatistics,
} from "../../generated/graphql";
import { combineLatest, firstValueFrom, Subject, takeUntil } from "rxjs";
import { debounceTime, filter, map, mergeMap, tap } from "rxjs/operators";
import { DateTime } from "luxon";
import { StopPerformance } from "../on-time/on-time.service";
import { Preset } from "../shared/components/date-range/date-range.types";
import { DateRangeService } from "../shared/services/date-range.service";
import { GeocodingFeature } from "../shared/mapbox/geocoding.types";
import { FiltersComponent } from "../on-time/filters/filters.component";
import { PanelService } from "../shared/components/panel/panel.service";
import { MultiselectCheckboxOption } from "../shared/gds/multiselect-checkbox/multiselect-checkbox.component";
import {
  AdminArea,
  AdminAreaService,
  computeAdminAreaBoundaries,
} from "../on-time/admin-area/admin-area.service";
import {
  ActivatedRoute,
  NavigationExtras,
  ParamMap,
  Router,
} from "@angular/router";
import { getDefaultDayOfWeekFlags } from "../shared/components/day-of-week-select/day-of-week-utils";
import { BBox2d } from "@turf/helpers/dist/js/lib/geojson";
import { featureCollection } from "@turf/helpers";
import pointOnFeature from "@turf/point-on-feature";
import bboxClip from "@turf/bbox-clip";

@Component({
  selector: "app-stop-analysis",
  templateUrl: "./stop-analysis.component.html",
  styleUrls: ["./stop-analysis.component.scss"],
})
export class StopAnalysisComponent implements OnInit, OnDestroy {
  stopPoints: FeatureCollection<Point, StopStatistics> = {
    type: "FeatureCollection",
    features: [],
  };

  isLoading = false;
  errored = false;

  matchType: MatchType = MatchType.Evidenced;
  stopType = "timing-points";
  operatorIds: string[] = [];
  serviceIds: string[] = [];
  to: DateTime;
  from: DateTime;
  private apiFiltersChanged = new Subject();

  map: Map | undefined = undefined;
  mapboxStyle = this.config.mapboxStyle;
  initialBounds = BRITISH_ISLES_BBOX;
  private boundsChanged = new Subject();
  private lastBounds: BoundingBoxInputType | undefined = undefined;
  private destroy$ = new Subject<void>();

  clusterProperties = {
    early: ["+", ["get", "early"]],
    onTime: ["+", ["get", "onTime"]],
    late: ["+", ["get", "late"]],
    completedDepartures: ["+", ["get", "completedDepartures"]],
    scheduledDepartures: ["+", ["get", "scheduledDepartures"]],
  };
  redThreshold = 0.6;
  greenThreshold = 0.8;
  boundWidth = 1;
  boundingBoxTooBig = true;
  pointColours: CirclePaint["circle-color"] = [
    "case",
    ["==", ["get", "completedDepartures"], 0],
    "#b1b4b6",
    [
      "step",
      ["/", ["get", "onTime"], ["get", "completedDepartures"]],
      "#d4351c",
      this.redThreshold,
      "#ffdd00",
      this.greenThreshold,
      "#28a197",
    ],
  ];
  timingPointIcons: SymbolLayout["icon-image"] = [
    "case",
    ["==", ["get", "completedDepartures"], 0],
    "timing-no-data-map",
    [
      "step",
      ["/", ["get", "onTime"], ["get", "completedDepartures"]],
      "otp-timing-map-red",
      this.redThreshold,
      "otp-timing-map-yellow",
      this.greenThreshold,
      "otp-timing-map-turquoise",
    ],
  ];
  zoomLevel = 0;
  visibleBounds: BoundingBoxInputType = {
    maxLatitude: this.initialBounds[3],
    minLatitude: this.initialBounds[1],
    maxLongitude: this.initialBounds[2],
    minLongitude: this.initialBounds[0],
  };
  private rawStopData: StopStatistics[] = [];
  filteredStopData: StopPerformance[] = [];
  selectedStop: StopStatistics | undefined;
  selectedCluster:
    | Record<keyof typeof this.clusterProperties | "point_count", number>
    | undefined = undefined;
  selectedClusterCoordinates: [number, number] = [0, 0];
  center: LngLat | undefined;
  maxBoundWidth = 0.8;
  adminAreaIds: string[] | null = [];

  refinedFilters: PerformanceFiltersInputType = {};

  visibleAdminAreas: FeatureCollection<Polygon, AdminArea> = featureCollection(
    [],
  );
  hoveredAdminArea?: Feature<Polygon, AdminArea>;
  labelPosition?: Feature<Point>;

  allAdminAreas: AdminArea[] = [];
  adminAreas$ = this.adminAreaService.fetchAdminAreas().pipe(
    takeUntil(this.destroy$),
    tap((areas) => {
      this.allAdminAreas = areas;
      this.updateVisibleAdminAreas();
    }),
    map((areas) =>
      areas
        .map(
          (area) =>
            ({
              label: area.name,
              value: area.id,
            }) as MultiselectCheckboxOption,
        )
        .sort((a: MultiselectCheckboxOption, b: MultiselectCheckboxOption) =>
          a.label.localeCompare(b.label),
        ),
    ),
  );

  allOperators: OperatorType[] = [];
  operators = this.operatorListQuery.fetch({}).pipe(
    takeUntil(this.destroy$),
    tap((result) => (this.allOperators = result.data.operators)),
  );
  operators$ = combineLatest([this.operators, this.apiFiltersChanged]).pipe(
    takeUntil(this.destroy$),
    map(([result]) =>
      result.data.operators
        .filter(
          (o) =>
            !this.adminAreaIds ||
            this.adminAreaIds.length === 0 ||
            o.adminAreaIds.some((a) => this.adminAreaIds?.includes(a)),
        )
        .map(
          (o): MultiselectCheckboxOption => ({
            label: `${o.name} (${o.operatorId})`,
            value: o.operatorId,
          }),
        ),
    ),
  );

  constructor(
    private config: ConfigService,
    private query: StopAnalysisGQL,
    private operatorListQuery: OperatorListGQL,
    private cdr: ChangeDetectorRef,
    dateRangeService: DateRangeService,
    private panelService: PanelService,
    private adminAreaService: AdminAreaService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    const { from, to } = dateRangeService.calculatePresetPeriod(
      Preset.Last7,
      DateTime.local(),
    );
    this.from = from;
    this.to = to;
  }

  ngOnInit(): void {
    this.setFilterPanelComponent();
    const boundsChanged = this.boundsChanged.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        if (!this.map) return undefined;
        this.center = this.map.getCenter();
        this.zoomLevel = this.map.getZoom();
      }),
      map(() => {
        if (!this.map) return undefined;

        const bounds = this.map.getBounds();
        this.boundWidth = bounds.getEast() - bounds.getWest();
        this.boundingBoxTooBig = this.boundWidth >= this.maxBoundWidth;
        if (this.boundingBoxTooBig) return undefined;
        return this.getNewBounds(bounds);
      }),
      tap((bounds) => {
        if (!bounds) return;

        this.visibleBounds = bounds;
        this.updateQueryParams(this.visibleBounds);

        if (!this.lastBounds) return;
        if (!this.withinBounds(bounds, this.lastBounds)) return;

        // Update map points whenever the user moves the map, if we have the data already
        this.processStopData(bounds);
      }),
      filter((bounds) => {
        if (!bounds) return false;
        return !this.lastBounds || !this.withinBounds(bounds, this.lastBounds);
      }),
    );

    const filtersChanged = this.apiFiltersChanged.pipe(
      tap(() => this.updateQueryParams(undefined)),
    );

    combineLatest([boundsChanged, filtersChanged])
      .pipe(
        // Don't fetch too quickly if there's a lot of map movement happening
        debounceTime(500),
        // Don't run requests concurrently, and only run the latest when completed again
        mergeMap(([bounds]) => {
          const query: StopAnalysisQueryVariables = {
            boundingBox: bounds!,
            adminAreaIds: this.adminAreaIds ?? [],
            fromTimestamp: this.from.toISO(),
            toTimestamp: this.to.toISO(),
            operatorIds: this.operatorIds,
            lineIds: this.serviceIds,
            matchType: this.matchType,
            dayOfWeekFlags: this.refinedFilters.dayOfWeekFlags,
            startTime: this.refinedFilters.startTime,
            endTime: this.refinedFilters.endTime,
          };
          this.isLoading = true;
          return this.query
            .fetch(query)
            .pipe(map((response) => [query, response] as const));
        }, 1),
      )
      .subscribe(([query, response]) => {
        this.lastBounds = query.boundingBox;
        this.rawStopData = response.data.stopAnalysis;
        this.processStopData(this.visibleBounds);
        this.isLoading = false;
      });

    firstValueFrom(this.route.queryParamMap)
      .then((params) => this.parseParams(params))
      .catch(console.log);
    this.onFilterChanged();
  }

  private updateQueryParams = (bounds: BoundingBoxInputType | undefined) => {
    const nav: NavigationExtras = {
      queryParams: {
        dayOfWeek: this.refinedFilters.dayOfWeekFlags
          ? Object.entries(this.refinedFilters.dayOfWeekFlags)
              .filter(([_s, v]) => v)
              .map(([s, _v]) => s)
              .join()
          : undefined,
        stopType: this.stopType,
        adminAreaIds: this.adminAreaIds ?? [],
        fromTimestamp: this.from.toISO(),
        toTimestamp: this.to.toISO(),
        operatorIds: this.operatorIds,
        lineIds: this.serviceIds,
        matchType: this.matchType,
        startTime: this.refinedFilters.startTime,
        endTime: this.refinedFilters.endTime,
      },
      queryParamsHandling: "merge",
    };
    if (bounds) {
      nav.queryParams = {
        ...nav.queryParams,
        minLatitude: bounds.minLatitude,
        minLongitude: bounds.minLongitude,
        maxLatitude: bounds.maxLatitude,
        maxLongitude: bounds.maxLongitude,
      };
    }
    this.router.navigate([], nav).catch(console.log);
  };

  private parseParams(params: ParamMap) {
    const from = params.get("fromTimestamp");
    const to = params.get("toTimestamp");
    const matchType = params.get("matchType");
    const startTime = params.get("startTime");
    const endTime = params.get("endTime");
    const adminAreaIds = params.getAll("adminAreaIds");
    const serviceIds = params.getAll("lineIds");
    const operatorIds = params.getAll("operatorIds");
    const minLongitude = params.get("minLongitude");
    const minLatitude = params.get("minLatitude");
    const maxLongitude = params.get("maxLongitude");
    const maxLatitude = params.get("maxLatitude");
    const dayOfWeek = params.get("dayOfWeek");
    const stopType = params.get("stopType");
    if (from) this.from = DateTime.fromISO(from);
    // The setter in the nested component is not triggered normally, but the setTimeout fixes it.
    // It must need to do another round of change detection or something like that
    if (to) setTimeout(() => (this.to = DateTime.fromISO(to)), 0);
    if (stopType) this.stopType = stopType;
    if (matchType) this.matchType = matchType as MatchType;
    if (startTime) this.refinedFilters.startTime = startTime;
    if (endTime) this.refinedFilters.endTime = endTime;
    if (adminAreaIds) this.adminAreaIds = adminAreaIds;
    if (serviceIds) this.serviceIds = serviceIds;
    if (operatorIds) this.operatorIds = operatorIds;
    if (dayOfWeek) {
      const flags = getDefaultDayOfWeekFlags();
      const days = dayOfWeek.split(",") ?? [];
      for (const day of Object.keys(flags)) {
        flags[day as keyof typeof flags] = days.includes(day);
      }
      this.refinedFilters.dayOfWeekFlags = flags;
    }
    if (minLongitude && minLatitude && maxLatitude && maxLongitude) {
      this.visibleBounds = {
        minLongitude: Number(minLongitude),
        minLatitude: Number(minLatitude),
        maxLongitude: Number(maxLongitude),
        maxLatitude: Number(maxLatitude),
      };
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyFilterPanel();
  }

  onMapLoad(map: Map): void {
    this.map = map;
    this.onMapMoveEnd();

    // For some reason this doesn't work passing a method to the map layer props
    map.on("mouseenter", "clusters", (e) => {
      map.getCanvas().style.cursor = "pointer";
      if (!e.features || e.features.length <= 0 || !e.features[0].properties)
        return;

      const feature = e.features[0];
      if (feature.geometry.type !== "Point") return;

      this.selectedStop = undefined;
      this.selectedCluster = feature.properties as Record<
        keyof typeof this.clusterProperties | "point_count",
        number
      >;
      this.selectedClusterCoordinates =
        feature.geometry.coordinates.slice() as [number, number];

      this.cdr.detectChanges();
    });

    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
      this.selectedCluster = undefined;
      this.cdr.detectChanges();
    });

    map.on("mouseenter", ["timing-stops", "other-stops"], (e) => {
      if (!e.features || e.features.length <= 0 || !e.features[0].properties)
        return;
      this.selectedStop = e.features[0].properties as StopStatistics;
      this.selectedCluster = undefined;
      this.cdr.detectChanges();
    });

    map.on("mouseleave", ["timing-stops", "other-stops"], () => {
      this.selectedStop = undefined;
      this.selectedCluster = undefined;
      this.cdr.detectChanges();
    });
    this.showBoundingBox(map, [
      this.visibleBounds.minLongitude,
      this.visibleBounds.minLatitude,
      this.visibleBounds.maxLongitude,
      this.visibleBounds.maxLatitude,
    ]);
  }

  onMapMoveEnd() {
    if (!this.map) return;
    this.boundsChanged.next(undefined);
  }

  onMapStyleChanged(style: string) {
    this.mapboxStyle = style;
  }

  onClusterClick(e: MapMouseEvent): void {
    if (!this.map) return;
    const features = this.map.queryRenderedFeatures(e.point, {
      layers: ["clusters"],
    });
    if (features.length === 0) return;
    const feature = features[0].geometry;
    if (feature.type !== "Point" || !features[0].properties) return;
    const clusterId = features[0].properties.cluster_id as number;
    const coordinates = feature.coordinates as [number, number];
    (this.map.getSource("stops") as GeoJSONSource).getClusterExpansionZoom(
      clusterId,
      (err, zoom) => {
        if (err || !this.map) return;
        this.map.easeTo({
          center: coordinates,
          zoom: zoom,
        });
      },
    );
  }

  onBoundaryHover(
    event: MapMouseEvent & { features?: MapboxGeoJSONFeature[] } & EventData,
  ) {
    if (!this.map) return;
    if (this.adminAreaIds && this.adminAreaIds.length === 1) return;
    const adminArea = event.features?.[0] as Feature;
    if (this.hoveredAdminArea && this.hoveredAdminArea?.id !== adminArea?.id) {
      this.onClearBoundaryHover();
    }
    this.hoveredAdminArea = adminArea as Feature<Polygon, AdminArea>;
    this.map.setFeatureState(
      { source: "boundaries", id: this.hoveredAdminArea?.id },
      { hover: true },
    );
    this.recalculateLabelPosition();
  }

  onClearBoundaryHover() {
    if (!this.map) return;
    this.map.removeFeatureState(
      { source: "boundaries", id: this.hoveredAdminArea?.id },
      "hover",
    );
    this.hoveredAdminArea = undefined;
    this.labelPosition = undefined;
  }

  onAdminAreaClick(
    event: MapMouseEvent & { features?: MapboxGeoJSONFeature[] } & EventData,
  ) {
    if (this.adminAreaIds && this.adminAreaIds.length > 0) return;
    const adminArea = event.features?.[0] as Feature;
    this.onAdminAreasChanged([(adminArea.properties as AdminArea).id]);
  }

  recalculateLabelPosition() {
    if (!this.map) return;
    if (this.hoveredAdminArea) {
      const viewBounds = this.map.getBounds();
      this.labelPosition = pointOnFeature(
        bboxClip(this.hoveredAdminArea, asBbox(viewBounds)),
      );
    }
  }

  onTableStopNameClicked($event: StopPerformance) {
    this.zoomToPoint([
      $event.stopInfo.stopLocation.longitude,
      $event.stopInfo.stopLocation.latitude,
    ]);
  }

  onFilterChanged() {
    this.apiFiltersChanged.next(undefined);
  }

  onDatePickerChanged($event: { from: DateTime; to: DateTime }) {
    this.from = $event.from;
    this.to = $event.to;
    this.onFilterChanged();
  }

  updateVisibleAdminAreas() {
    let areaIdsToShow = this.adminAreaIds ?? [];
    if (areaIdsToShow.length === 0) {
      areaIdsToShow = [
        ...new Set(
          this.allOperators
            .filter((n) => this.operatorIds.includes(n.operatorId))
            .map((n) => n.adminAreaIds)
            .flat(),
        ),
      ];
    }

    const selectedAreas = this.allAdminAreas.filter(
      (n) => areaIdsToShow.length === 0 || areaIdsToShow.includes(n.id),
    );
    this.visibleAdminAreas = computeAdminAreaBoundaries(selectedAreas);
  }

  showFilterArea() {
    this.updateVisibleAdminAreas();
    if (this.map) {
      this.showBoundingBox(this.map, this.visibleAdminAreas.bbox as BBox2d);
    }
  }

  onAdminAreasChanged($event: string[]) {
    this.adminAreaIds = $event;
    this.showFilterArea();
    this.onFilterChanged();
  }

  onOperatorsChanged($event: string[]) {
    this.operatorIds = $event;
    this.showFilterArea();
    this.onFilterChanged();
  }

  onServicesChanged($event: string[]) {
    this.serviceIds = $event;
    this.onFilterChanged();
  }

  onLocationSearchSelection(location?: GeocodingFeature) {
    if (!this.map) return;
    if (!location) return;
    this.showBoundingBox(this.map, location.bbox);
  }

  private showBoundingBox = (map: Map, bbox: LngLatBoundsLike) => {
    map.fitBounds(bbox, { maxDuration: 500 });
  };

  onStopTypeChanged() {
    this.updateQueryParams(undefined);
    this.processStopData(this.visibleBounds);
  }

  zoomToPoint(center: [number, number]) {
    if (!this.map) return;
    const zoom = this.map.getZoom() + 1;
    this.map.easeTo({ center, zoom });
  }

  processStopData(bounds: BoundingBoxInputType): void {
    const filtered = this.rawStopData.filter(
      (n) =>
        (this.stopType !== "timing-points" || n.timingPoint) &&
        n.latitude >= bounds.minLatitude &&
        n.latitude <= bounds.maxLatitude &&
        n.longitude >= bounds.minLongitude &&
        n.longitude <= bounds.maxLongitude,
    );
    this.filteredStopData = filtered
      .map(
        (x): StopPerformance => ({
          stopId: x.atcoCode,
          stopInfo: {
            stopId: x.atcoCode,
            stopName: x.stopName,
            stopLocality: {
              localityName: x.localityName,
              localityAreaName: x.adminAreaName,
            },
            stopLocation: {
              latitude: x.latitude,
              longitude: x.longitude,
            },
            sourceId: x.atcoCode,
          },
          timingPoint: x.timingPoint,
          scheduledDepartures: x.scheduledDepartures,
          late: x.late,
          actualDepartures: x.completedDepartures,
          early: x.early,
          onTime: x.onTime,
          averageDelay: x.totalDelay / x.completedDepartures || 0,
          total: x.completedDepartures,
          onTimeRatio: x.onTime / x.completedDepartures || 0,
          earlyRatio: x.early / x.completedDepartures || 0,
          lateRatio: x.late / x.completedDepartures || 0,
          completedRatio: x.completedDepartures / x.scheduledDepartures || 0,
        }),
      )
      .sort((a, b) => a.stopInfo.stopName.localeCompare(b.stopInfo.stopName));

    this.stopPoints = {
      type: "FeatureCollection",
      features: Object.values(
        // Combine points where the stop is used as a timing point and a non timing point
        filtered.reduce(
          (acc, cur) => {
            if (!acc[cur.atcoCode]) {
              acc[cur.atcoCode] = cur;
              return acc;
            }
            acc[cur.atcoCode] = {
              stopName: cur.stopName,
              atcoCode: cur.atcoCode,
              latitude: cur.latitude,
              longitude: cur.longitude,
              localityName: cur.localityName,
              adminAreaName: cur.adminAreaName,
              timingPoint: cur.timingPoint || acc[cur.atcoCode].timingPoint,
              totalDelay: cur.totalDelay || acc[cur.atcoCode].totalDelay,
              onTime: cur.onTime || acc[cur.atcoCode].onTime,
              completedDepartures:
                cur.completedDepartures ||
                acc[cur.atcoCode].completedDepartures,
              scheduledDepartures:
                cur.scheduledDepartures ||
                acc[cur.atcoCode].scheduledDepartures,
              late: cur.late || acc[cur.atcoCode].late,
              early: cur.early || acc[cur.atcoCode].early,
            };
            return acc;
          },
          {} as Record<string, StopStatistics>,
        ),
      ).map((point) => ({
        type: "Feature",
        properties: point,
        geometry: {
          type: "Point",
          coordinates: [point.longitude, point.latitude],
        },
      })),
    };
  }

  getNewBounds(bounds: LngLatBounds): BoundingBoxInputType {
    return {
      maxLatitude: bounds.getNorth(),
      minLatitude: bounds.getSouth(),
      maxLongitude: bounds.getEast(),
      minLongitude: bounds.getWest(),
    };
  }

  withinBounds(
    newBounds: BoundingBoxInputType,
    bounds: BoundingBoxInputType,
  ): boolean {
    return (
      newBounds.minLongitude >= bounds.minLongitude &&
      newBounds.minLatitude >= bounds.minLatitude &&
      newBounds.maxLongitude <= bounds.maxLongitude &&
      newBounds.maxLatitude <= bounds.maxLatitude
    );
  }

  onFiltersChanged($event: PerformanceFiltersInputType) {
    // We can't replace the refinedFilters object as the dynamic filter component below has static inputs
    this.refinedFilters.startTime = $event.startTime;
    this.refinedFilters.endTime = $event.endTime;
    this.refinedFilters.dayOfWeekFlags = $event.dayOfWeekFlags;
    this.onFilterChanged();
  }

  onMoreFiltersClick() {
    this.panelService.toggle();
  }

  setFilterPanelComponent() {
    this.panelService.setComponent({
      component: FiltersComponent,
      inputs: [
        {
          name: "filters",
          value: this.refinedFilters,
        },
        {
          name: "showDelay",
          value: false,
        },
        {
          name: "showAdminAreas",
          value: false,
        },
      ],
      outputs: [
        {
          name: "filtersChange",
          outputEvent: ($event: PerformanceFiltersInputType) =>
            this.onFiltersChanged($event),
        },
        {
          name: "closeFilters",
          outputEvent: () => this.panelService.close(),
        },
      ],
    });
  }

  destroyFilterPanel() {
    this.panelService.destroy();
  }
}
