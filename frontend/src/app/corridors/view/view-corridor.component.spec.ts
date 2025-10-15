/* eslint-disable jasmine/new-line-before-expect */
import { HttpClientTestingModule } from "@angular/common/http/testing";
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { fakeAsync, tick } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Data } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import {
  byLabel,
  byText,
  byTextContent,
  createRoutingFactory,
  createSpyObject,
  SpectatorRouting,
} from "@ngneat/spectator";
import bbox from "@turf/bbox";
import { lineString } from "@turf/helpers";
import { BBox2d } from "@turf/helpers/dist/js/lib/geojson";
import { AgGridModule } from "ag-grid-angular";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime, Settings } from "luxon";
import { LuxonModule } from "luxon-angular";
import { LngLatBounds, LngLatBoundsLike, LngLatLike, Map } from "mapbox-gl";
import { MapComponent, NgxMapboxGLModule } from "ngx-mapbox-gl";
import { NgxSmartModalModule } from "ngx-smart-modal";
import { NgxTippyModule } from "ngx-tippy-wrapper";
import { of } from "rxjs";
import { Custom } from "src/app/shared/components/date-range/date-range.types";
import {
  CorridorGranularity,
  MatchType,
  RouteType,
} from "../../../generated/graphql";
import { LayoutModule } from "../../layout/layout.module";
import { GdsModule } from "../../shared/gds/gds.module";
import { SharedModule } from "../../shared/shared.module";
import { CorridorNotFoundView } from "../corridor-not-found-view.model";
import { CorridorsService } from "../corridors.service";
import { SegmentSelectorComponent } from "../segment-selector/segment-selector.component";
import { CorridorStatsViewParams } from "../types";
import { BoxPlotChartComponent } from "./box-plot-chart/box-plot-chart.component";
import { ViewCorridorComponent } from "./view-corridor.component";

const corridor = {
  id: 123,
  name: "Test corridor",
  stops: [
    {
      stopId: "ST1234",
      stopName: "Station road",
      lat: 50,
      lon: 0,
      naptan: "1234",
      intId: 1,
    },
    {
      stopId: "ST2345",
      stopName: "Something street",
      lat: 50,
      lon: 0,
      naptan: "2345",
      intId: 2,
    },
    {
      stopId: "ST3456",
      stopName: "Tyburn road",
      lat: 50,
      lon: 0,
      naptan: "3456",
      intId: 3,
    },
  ],
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "mgl-map",
  template: ``,
  providers: [
    { provide: MapComponent, useExisting: forwardRef(() => StubMapComponent) },
  ],
  standalone: false,
})
export class StubMapComponent implements OnInit {
  @Output() moveEnd = new EventEmitter<void>();
  @Input() bounds?: LngLatBounds;
  @Output() mapLoad = new EventEmitter<Map>();

  mapInstance = createSpyObject(Map, {
    fitBounds: (bounds: LngLatBoundsLike) => {
      this.bounds = LngLatBounds.convert(bounds);
      this.cdr.detectChanges();
      this.moveEnd.emit();
    },
    getSource: () => true,
  });
  move = (sw: LngLatLike, ne: LngLatLike) => {
    this.bounds = new LngLatBounds(sw, ne);
    this.moveEnd.emit();
  };
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setFeatureState = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.mapLoad.emit(this.mapInstance);
  }
}

describe("ViewCorridorComponent", () => {
  let spectator: SpectatorRouting<ViewCorridorComponent>;
  let service: CorridorsService;

  const createComponent = (data?: Data) =>
    createRoutingFactory({
      component: ViewCorridorComponent,
      data: data,
      imports: [
        SharedModule,
        LayoutModule,
        NgxTippyModule,
        LuxonModule,
        FormsModule,
        ReactiveFormsModule,
        ApolloTestingModule,
        RouterTestingModule,
        AgGridModule,
        HttpClientTestingModule,
        NgxSmartModalModule,
        GdsModule,
        NgxMapboxGLModule,
      ],
      declarations: [SegmentSelectorComponent, BoxPlotChartComponent],
      providers: [CorridorsService],
      detectChanges: true,
    });

  const createComponentWithCorridorData = createComponent({
    corridor: corridor,
  });
  const createComponentWithCorridorNotFound = createComponent({
    corridor: new CorridorNotFoundView(),
  });

  describe("view corridor", () => {
    beforeEach(() => {
      Settings.now = () => 1630494000000; // 2021-09-01T12:00:00

      spectator = createComponentWithCorridorData();
      service = spectator.inject(CorridorsService);
      spectator.detectChanges();
    });

    it("should fetch stats", async () => {
      const spy = spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {
            scheduledTransits: 100,
            averageTransitTime: 90,
            totalTransits: 90,
            numberOfServices: 5,
          },
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [],
        }),
      );

      await spectator.fixture.whenRenderingDone();

      spectator.selectOption(byLabel("Preset"), "last28");

      await spectator.fixture.whenStable();

      spectator.fixture.detectChanges();

      const expectedParams: CorridorStatsViewParams = {
        corridorId: "123",
        from: DateTime.fromISO("2021-08-04"),
        to: DateTime.fromISO("2021-09-01"),
        granularity: CorridorGranularity.Day,
        stops: [corridor.stops[0], corridor.stops[1], corridor.stops[2]],
        matchType: MatchType.Evidenced,
      };

      expect(spy).toHaveBeenCalledWith(expectedParams);

      expect(
        spectator.query(
          byTextContent("Recorded transits", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("90", { selector: ".stat__value" })),
      ).toBeVisible();

      expect(
        spectator.query(
          byTextContent("Services", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("5", { selector: ".stat__value" })),
      ).toBeVisible();

      expect(
        spectator.query(
          byTextContent("Average journey time", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("01:30", { selector: ".stat__value" })),
      ).toBeVisible();

      expect(
        spectator.query(
          byTextContent("Missing transits", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("10", { selector: ".stat__value" })),
      ).toBeVisible();
    });

    it("should fetch stats with stops selected", async () => {
      const spy = spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {
            scheduledTransits: 100,
            averageTransitTime: 90,
            totalTransits: 90,
            numberOfServices: 5,
          },
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [],
        }),
      );

      await spectator.fixture.whenRenderingDone();

      spectator.selectOption(byLabel("Preset"), "last28");
      spectator.component.selectedStops$.next([
        corridor.stops[1],
        corridor.stops[2],
      ]);

      await spectator.fixture.whenStable();

      spectator.fixture.detectChanges();

      const expectedParams: CorridorStatsViewParams = {
        corridorId: "123",
        from: DateTime.fromISO("2021-08-04"),
        to: DateTime.fromISO("2021-09-01"),
        granularity: CorridorGranularity.Day,
        stops: [corridor.stops[1], corridor.stops[2]],
        matchType: MatchType.Evidenced,
      };

      expect(spy).toHaveBeenCalledWith(expectedParams);
      expect(
        spectator.query(
          byTextContent("Recorded transits", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("90", { selector: ".stat__value" })),
      ).toBeVisible();

      expect(
        spectator.query(
          byTextContent("Services", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("5", { selector: ".stat__value" })),
      ).toBeVisible();

      expect(
        spectator.query(
          byTextContent("Average journey time", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("01:30", { selector: ".stat__value" })),
      ).toBeVisible();

      expect(
        spectator.query(
          byTextContent("Missing transits", { selector: ".stat__label" }),
        ),
      ).toBeVisible();

      expect(
        spectator.query(byTextContent("10", { selector: ".stat__value" })),
      ).toBeVisible();
    });

    it("should select day granularity for a 5 day period", async () => {
      const spy = spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {
            scheduledTransits: 100,
            averageTransitTime: 90,
            totalTransits: 90,
            numberOfServices: 5,
          },
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [],
        }),
      );

      await spectator.fixture.whenRenderingDone();

      const from = DateTime.fromISO("2021-08-25");
      const to = DateTime.fromISO("2021-08-30");
      const trendFrom = DateTime.fromISO("2021-08-20");
      const trendTo = DateTime.fromISO("2021-08-25");

      spectator.component.dateRange.setValue({
        from,
        to,
        trendFrom,
        trendTo,
        preset: Custom.Custom,
      });

      await spectator.fixture.whenStable();

      spectator.fixture.detectChanges();

      const expectedParams: Partial<CorridorStatsViewParams> = {
        from,
        to,
        granularity: CorridorGranularity.Day,
        stops: [corridor.stops[0], corridor.stops[1], corridor.stops[2]],
      };

      expect(spy).toHaveBeenCalledWith(
        jasmine.objectContaining(expectedParams),
      );
    });

    it("should display service breakdown grid", fakeAsync(() => {
      spyOn(service, "fetchCorridorById").and.returnValue(of(corridor));

      spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {},
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [
            {
              lineName: "53",
              servicePatternName: "Sheffield to Mansfield",
              noc: "SCEM",
              operatorName: "Stagecoach East Midlands",
              scheduledTransits: 25,
              recordedTransits: 24,
              totalTransitTime: 60,
            },
            {
              lineName: "77",
              servicePatternName: "Chesterfield to Worksop",
              noc: "SCEM",
              operatorName: "Stagecoach East Midlands",
              scheduledTransits: 50,
              recordedTransits: 45,
              totalTransitTime: 30,
            },
          ],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [],
        }),
      );

      spectator.setRouteParam("corridorId", "155");
      spectator.detectChanges();
      tick(100);

      spectator.selectOption(byLabel("Preset"), "last28");

      spectator.detectChanges();
      tick(100);

      const cellContent = spectator.query(
        '[role="row"][row-index="0"] [role="gridcell"][col-id="0"]',
      )?.textContent;

      void expect(cellContent).toEqual("53: Sheffield to Mansfield");
    }));

    it("should set coordinates using service link data", fakeAsync(() => {
      spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {},
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [
            {
              fromStop: "1234",
              toStop: "2345",
              distance: 360,
              routeValidity: RouteType.Valid,
              linkRoute: "[[1, 0], [2, 0], [3, 0]]",
            },
          ],
        }),
      );

      spectator.selectOption(byLabel("Preset"), "last28");
      spectator.detectChanges();
      tick(100);

      const result = spectator.component.setCoordinates(corridor.stops);

      void expect(result).toEqual([
        [1, 0],
        [2, 0],
        [3, 0],
      ]);
    }));

    it("should set coordinates if service link data unavailable", () => {
      const result = spectator.component.setCoordinates(corridor.stops);

      void expect(result).toEqual([
        [0, 50],
        [0, 50],
      ]);
    });

    it("onSelectSegment() should set map selected state", () => {
      const stubMap = new StubMapComponent({} as ChangeDetectorRef);
      spectator.component.map = stubMap as unknown as MapComponent;

      spectator.component.onSelectSegment([
        corridor.stops[0],
        corridor.stops[1],
      ]);
      spectator.detectChanges();

      expect(
        spectator.component.map.mapInstance.setFeatureState,
      ).toHaveBeenCalledWith(
        {
          source: "corridor-line",
          id: corridor.stops[0].stopId + corridor.stops[1].stopId,
        },
        { selected: true },
      );
    });

    it("onSelectSegment() should set select all to true if no segment passed", fakeAsync(() => {
      spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {},
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [],
        }),
      );

      spectator.selectOption(byLabel("Preset"), "last28");
      spectator.detectChanges();
      tick(100);

      spectator.component.onSelectSegment([]);
      spectator.detectChanges();

      void expect(spectator.component.selectAll).toEqual(true);
    }));

    it("clearMapSelectedState() should clear map selected state", () => {
      const stubMap = new StubMapComponent({} as ChangeDetectorRef);
      spectator.component.map = stubMap as unknown as MapComponent;

      spectator.component.clearMapSelectedState([
        corridor.stops[0],
        corridor.stops[1],
      ]);
      spectator.detectChanges();

      expect(
        spectator.component.map.mapInstance.removeFeatureState,
      ).toHaveBeenCalledWith(
        {
          source: "corridor-line",
          id: corridor.stops[0].stopId + corridor.stops[1].stopId,
        },
        "selected",
      );
    });

    it("clearMapSelectedState() should set select all to false if no segment passed", () => {
      spectator.component.clearMapSelectedState([]);
      spectator.detectChanges();

      void expect(spectator.component.selectAll).toEqual(false);
    });

    it("setMapHoverState() should set map hover state", () => {
      const stubMap = new StubMapComponent({} as ChangeDetectorRef);
      spectator.component.map = stubMap as unknown as MapComponent;

      spectator.component.loadingStats = false;
      spectator.component.setMapHoverState(corridor.stops[0]);
      spectator.detectChanges();

      expect(
        spectator.component.map.mapInstance.setFeatureState,
      ).toHaveBeenCalledWith(
        { source: "corridor-stops", id: corridor.stops[0].stopId },
        { hover: true },
      );
    });

    it("clearMapHoverState() should clear map hover state", () => {
      const stubMap = new StubMapComponent({} as ChangeDetectorRef);
      spectator.component.map = stubMap as unknown as MapComponent;

      spectator.component.loadingStats = false;
      spectator.component.clearMapHoverState(corridor.stops[0]);
      spectator.detectChanges();

      expect(
        spectator.component.map.mapInstance.removeFeatureState,
      ).toHaveBeenCalledWith(
        { source: "corridor-stops", id: corridor.stops[0].stopId },
        "hover",
      );
    });

    it("centreMapBounds() should set bounds value based on corridorLine bbox", fakeAsync(() => {
      spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {},
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [],
        }),
      );

      spectator.selectOption(byLabel("Preset"), "last28");
      spectator.detectChanges();
      tick(100);

      spectator.component.centreMapBounds();

      void expect(spectator.component.bounds).toEqual(
        bbox(spectator.component.corridorLine) as BBox2d,
      );
    }));

    it("centreMapBounds() should set bounds value based on currently selected segment", fakeAsync(() => {
      spyOn(service, "fetchStats").and.returnValue(
        of({
          summaryStats: {},
          transitTimeDayOfWeekStats: [],
          transitTimeHistogram: [],
          transitTimePerServiceStats: [],
          transitTimeStats: [],
          transitTimeTimeOfDayStats: [],
          serviceLinks: [],
        }),
      );

      spectator.selectOption(byLabel("Preset"), "last28");
      spectator.detectChanges();
      tick(100);

      const stubMap = new StubMapComponent({} as ChangeDetectorRef);
      spectator.component.map = stubMap as unknown as MapComponent;

      spectator.component.onSelectSegment([
        corridor.stops[0],
        corridor.stops[1],
      ]);
      spectator.detectChanges();

      spectator.component.centreMapBounds();
      spectator.detectChanges();

      void expect(spectator.component.bounds).toEqual(
        bbox(
          lineString([
            [corridor.stops[0].lon, corridor.stops[0].lat],
            [corridor.stops[1].lon, corridor.stops[1].lat],
          ]),
        ) as BBox2d,
      );
    }));
  });

  describe("corridor not found", () => {
    beforeEach(() => {
      spectator = createComponentWithCorridorNotFound();
      service = spectator.inject(CorridorsService);
      spectator.detectChanges();
    });

    it("should show error message if no corridor is found", () => {
      expect(spectator.query(byText("Not found"))).toBeVisible();
      void expect(spectator.query(".govuk-body")?.innerHTML).toContain(
        "Corridor not found, or you do not have permission to view.",
      );
    });
  });
});
