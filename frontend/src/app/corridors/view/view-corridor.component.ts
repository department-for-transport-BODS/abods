import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { DateTime, Duration } from "luxon";
import { DateRangeService } from "../../shared/services/date-range.service";
import { ActivatedRoute, Router } from "@angular/router";
import {
  catchError,
  map,
  startWith,
  switchMap,
  tap,
  takeUntil,
} from "rxjs/operators";
import { CorridorGranularity, MatchType } from "../../../generated/graphql";
import {
  FromTo,
  Preset,
} from "../../shared/components/date-range/date-range.types";
import { combineLatest, of, Subject } from "rxjs";
import { CorridorsService } from "../corridors.service";
import { AgGridEvent, ColDef, GridOptions } from "ag-grid-community";
import { EnglandAndWalesBoundingBox, position } from "../../shared/geo";
import { featureCollection, lineString, point } from "@turf/helpers";
import bbox from "@turf/bbox";
import { FeatureCollection, LineString, Point, Position } from "geojson";
import { BBox2d } from "@turf/helpers/dist/js/lib/geojson";
import { MapComponent } from "ngx-mapbox-gl";
import { MapboxGeoJSONFeature } from "mapbox-gl";
import { pairwise } from "../../shared/array-operators";
import { SelectableTextCellRendererComponent } from "../../shared/components/ag-grid/selectable-text-cell/selectable-text-cell.component";
import { AgGridDirective } from "../../shared/components/ag-grid/ag-grid.directive";
import { AgGridDomService } from "../../shared/components/ag-grid/ag-grid-dom.service";
import {
  CorridorsSpeedMetricService,
  SpeedStats,
} from "../corridors-speed-metric.service";
import { chartColors } from "../../shared/components/amcharts/chart.service";
import { ConfigService } from "../../config/config.service";
import { CorridorNotFoundView } from "../corridor-not-found-view.model";
import { HideOutliersService } from "./hide-outliers.service";
import {
  Corridor,
  CorridorStats,
  CorridorStatsViewParams,
  CorridorStop,
} from "../types";

@Component({
  templateUrl: "view-corridor.component.html",
  styleUrls: ["./view-corridor.component.scss"],
  standalone: false,
})
export class ViewCorridorComponent implements OnInit, OnDestroy {
  CorridorGranularity = CorridorGranularity;
  granularity = CorridorGranularity.Day;
  dateRange = new FormControl(
    this.dateRangeService.calculatePresetPeriod(Preset.Last7, DateTime.local()),
    {
      nonNullable: true,
    },
  );
  errorView?: CorridorNotFoundView;
  corridor?: Corridor;
  stats?: CorridorStats;
  loadingStats?: boolean;
  params?: CorridorStatsViewParams;
  selectedStops$ = new Subject<CorridorStop[]>();
  onDestroy$ = new Subject<void>();
  moveCounter = 0;
  matchType = new Subject<MatchType>();

  speedStats?: SpeedStats;
  mode: "time" | "speed" = "time";

  get isTime(): boolean {
    return this.mode === "time";
  }

  bounds = EnglandAndWalesBoundingBox;
  corridorLine?: FeatureCollection<LineString, { segmentId: string }>;
  corridorStops?: FeatureCollection<Point, CorridorStop>;
  popupStop?: CorridorStop;
  selectAll = true;

  set hideOutliersJourneyTime(value: boolean) {
    this.hideOutliersService.hideOutliersJourneyTime = value;
  }
  get hideOutliersJourneyTime(): boolean {
    return this.hideOutliersService.hideOutliersJourneyTime;
  }

  set hideOutliersTimeOfDay(value: boolean) {
    this.hideOutliersService.hideOutliersTimeOfDay = value;
  }
  get hideOutliersTimeOfDay(): boolean {
    return this.hideOutliersService.hideOutliersTimeOfDay;
  }

  set hideOutliersDayOfWeek(value: boolean) {
    this.hideOutliersService.hideOutliersDayOfWeek = value;
  }
  get hideOutliersDayOfWeek(): boolean {
    return this.hideOutliersService.hideOutliersDayOfWeek;
  }

  chartColors = chartColors;

  gridOptions: GridOptions = {
    rowSelection: "single",
    suppressDragLeaveHidesColumns: true,
    suppressCellFocus: false,
    onFirstDataRendered: this.gridHeaderHeightSetter.bind(this),
  };

  columnDefs: ColDef[] = [
    {
      headerName: "Service",
      valueGetter: ({ data }) => `${data.lineName}: ${data.servicePatternName}`,
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: { noWrap: true, textOverflow: "ellipsis" },
      comparator: (a, b) => a?.localeCompare(b, undefined, { numeric: true }),
      flex: 1,
      sort: "asc",
    },
    {
      field: "noc",
      headerName: "NOC",
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: { noWrap: true, textOverflow: "visible" },
      maxWidth: 90,
    },
    {
      field: "operatorName",
      headerName: "Operator",
      cellRenderer: SelectableTextCellRendererComponent,
      cellRendererParams: { noWrap: true, textOverflow: "visible" },
      minWidth: 170,
      maxWidth: 470,
      wrapText: false,
    },
    {
      field: "scheduledTransits",
      headerName: "Scheduled transits",
      type: "numericColumn",
      maxWidth: 160,
    },
    {
      field: "recordedTransits",
      headerName: "Recorded transits",
      type: "numericColumn",
      maxWidth: 160,
    },
    {
      headerName: "Average journey time",
      type: "numericColumn",
      valueGetter: ({ data }) =>
        data.recordedTransits > 0
          ? data.totalTransitTime / data.recordedTransits
          : 0,
      valueFormatter: ({ value }) =>
        Duration.fromObject({ seconds: value }).toFormat("mm:ss"),
      maxWidth: 160,
    },
    {
      headerName: "Average speed",
      type: "numericColumn",
      valueGetter: ({ data }) =>
        this.corridorsSpeedmetricService.calculateAvergeSpeedInMph(
          this.corridorsSpeedmetricService.getTotalDistance(),
          data.recordedTransits > 0
            ? data.totalTransitTime / data.recordedTransits
            : 0,
        ),
      valueFormatter: ({ value }) => (value ?? 0) + "mph",
      maxWidth: 160,
    },
  ];

  defaultColumnDef: ColDef = {
    sortable: true,
    unSortIcon: true,
    sortingOrder: ["asc", "desc"],
  };

  @ViewChild(MapComponent) map?: MapComponent;
  @ViewChild(AgGridDirective) agGrid?: AgGridDirective = undefined;

  constructor(
    private dateRangeService: DateRangeService,
    private corridorsService: CorridorsService,
    private route: ActivatedRoute,
    private agGridDomService: AgGridDomService,
    private corridorsSpeedmetricService: CorridorsSpeedMetricService,
    private config: ConfigService,
    private hideOutliersService: HideOutliersService,
    private router: Router,
  ) {}

  private selectedSegment: [CorridorStop, CorridorStop] | undefined;
  private init = false;

  private _mapboxStyle: string = this.config.mapboxStyle;
  set mapboxStyle(style: string) {
    this._mapboxStyle = style;
  }
  get mapboxStyle(): string {
    return this._mapboxStyle;
  }

  get averageTransitTime(): Duration {
    return Duration.fromObject({
      seconds: this.stats?.summaryStats?.averageTransitTime ?? undefined,
    });
  }

  get missingTransits(): number | undefined {
    const summary = this.stats?.summaryStats;
    const scheduledTransits = summary?.scheduledTransits ?? null;
    const totalTransits = summary?.totalTransits ?? null;
    return scheduledTransits !== null && totalTransits !== null
      ? scheduledTransits - totalTransits
      : undefined;
  }

  ngOnDestroy(): void {
    this.selectedStops$.complete();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  ngOnInit() {
    const view: CorridorNotFoundView | Corridor =
      this.route.snapshot.data.corridor;
    if (view instanceof CorridorNotFoundView) {
      this.errorView = view;
    } else {
      this.corridor = view;
    }

    if (this.corridor) {
      combineLatest([
        this.dateRange.valueChanges.pipe(
          startWith(this.dateRange.value as FromTo),
        ),
        this.selectedStops$.pipe(startWith([])),
        this.matchType,
      ])
        .pipe(
          map(([{ from, to }, stops, toggle]) =>
            this.granularParams(
              from,
              to,
              this.corridor?.id?.toString() ?? "",
              stops.length ? stops : this.corridor?.stops ?? [],
              toggle,
            ),
          ),
          tap(() => (this.loadingStats = true)),
          switchMap((params) =>
            this.corridorsService.fetchStats(params).pipe(
              map((stats) => ({ stats, params })),
              catchError(() => of({ stats: undefined, params: undefined })),
              tap(() => (this.loadingStats = false)),
            ),
          ),
          takeUntil(this.onDestroy$),
        )
        .subscribe(({ stats, params }) => {
          this.stats = stats;
          this.params = params;
          this.speedStats = this.corridorsSpeedmetricService.generateSpeedStats(
            this.stats,
            params,
          );
          this.corridorLine = featureCollection(
            pairwise(this.corridor!.stops).map((segment) => {
              const line = this.setCoordinates(segment);
              return lineString(line, {
                segmentId: segment[0].stopId + segment[1].stopId,
                dashedLine: line.length <= 2,
              });
            }),
          );
          this.corridorStops = featureCollection(
            this.corridor!.stops.map((stop) => point(position(stop), stop)),
          );
          if (!this.init) {
            this.setMapBoundsToCorridor();
            this.init = true;
          }
        });

      this.matchType.next(MatchType.Evidenced);
    }
  }

  matchTypeToggleChange(matchTypeValue: MatchType) {
    this.matchType.next(matchTypeValue);
  }

  setCoordinates(segment: CorridorStop[]): Position[] {
    const serviceLink = this.stats?.serviceLinks.find(
      (serviceLink) =>
        serviceLink.fromStop === segment[0].naptan &&
        serviceLink.toStop === segment[1].naptan,
    );
    if (serviceLink?.linkRoute) {
      return JSON.parse(serviceLink.linkRoute);
    } else {
      return [position(segment[0]), position(segment[1])];
    }
  }

  granularParams(
    from: DateTime,
    to: DateTime,
    corridorId: string,
    stops: CorridorStop[],
    matchType: MatchType,
  ): CorridorStatsViewParams {
    this.granularity =
      Math.abs(to.diff(from, "days").days) < 5
        ? CorridorGranularity.Hour
        : CorridorGranularity.Day;
    return {
      corridorId,
      from,
      to,
      granularity: this.granularity,
      stops,
      matchType,
    };
  }

  onSelectSegment(segment: [CorridorStop, CorridorStop] | []) {
    if (!segment?.length) {
      this.selectAll = true;
      this.setMapBoundsToCorridor();
      return;
    }
    this.selectedSegment = segment;
    this.setMapSelectedState(segment);
    this.setMapBoundsToSegment(segment);
  }

  setMapSelectedState(segment: [CorridorStop, CorridorStop]) {
    if (this.map?.mapInstance.getSource("corridor-line")) {
      this.map?.mapInstance.setFeatureState(
        { source: "corridor-line", id: segment[0].stopId + segment[1].stopId },
        { selected: true },
      );
    }
  }

  clearMapSelectedState(segment: [CorridorStop, CorridorStop] | []) {
    if (!segment?.length) {
      this.selectAll = false;
      return;
    }
    this.selectedSegment = undefined;
    this.map?.mapInstance.removeFeatureState(
      { source: "corridor-line", id: segment[0].stopId + segment[1].stopId },
      "selected",
    );
  }

  setMapHoverState(stop?: CorridorStop) {
    if (!stop || this.loadingStats) {
      return;
    }
    this.map?.mapInstance.setFeatureState(
      { source: "corridor-stops", id: stop.stopId },
      { hover: true },
    );
  }

  clearMapHoverState(stop?: CorridorStop) {
    if (!stop || this.loadingStats) {
      return;
    }
    this.map?.mapInstance.removeFeatureState(
      { source: "corridor-stops", id: stop.stopId },
      "hover",
    );
  }

  mapEventStop({
    features,
  }: {
    features?: MapboxGeoJSONFeature[];
  }): CorridorStop | undefined {
    return features?.[0].properties as CorridorStop;
  }

  gridHeaderHeightSetter() {
    const padding = 20;
    this.agGrid?.gridApi?.setHeaderHeight(
      this.agGridDomService.headerHeight() + padding,
    );
  }

  onGridReady(params: AgGridEvent<any>) {
    params.api.sizeColumnsToFit();
    params.api.setDomLayout("autoHeight");
  }

  centreMapBounds() {
    if (this.selectedSegment) {
      this.setMapBoundsToSegment(this.selectedSegment);
      this.moveCounter = 0;
    } else if (this.corridorLine) {
      this.bounds = bbox(this.corridorLine) as BBox2d;
      this.moveCounter = 0;
    }
  }

  onStyleLoad() {
    if (this.selectedSegment) {
      // Mapbox clears the selected segement feature state when we change styles
      // So we need to re-apply sselected segement feature state once style has loaded
      this.setMapSelectedState(this.selectedSegment);
    }
  }

  setMapBoundsToCorridor() {
    this.moveCounter = 0;
    this.bounds = bbox(this.corridorLine) as BBox2d;
  }

  setMapBoundsToSegment(segment: [CorridorStop, CorridorStop]) {
    this.moveCounter = 0;
    this.bounds = bbox(
      lineString([
        [segment[0].lon, segment[0].lat],
        [segment[1].lon, segment[1].lat],
      ]),
    ) as BBox2d;
  }
}
