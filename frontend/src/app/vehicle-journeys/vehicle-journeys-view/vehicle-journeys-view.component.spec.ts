import { provideHttpClient } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import {
  byTextContent,
  createRoutingFactory,
  SpectatorRouting,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { MockComponent } from "ng-mocks";
import { of, throwError } from "rxjs";
import {
  AvlPoint,
  Journey,
  JourneyGQL,
  Stop,
  StopTypeOption,
} from "../../../generated/graphql";
import { LayoutModule } from "../../layout/layout.module";
import { SharedModule } from "../../shared/shared.module";
import { toUrlDateFormat } from "../../shared/url-helper";
import { VehicleJourneysSearchService } from "../vehicle-journeys-search/vehicle-journeys-search.service";
import { JourneyInfoComponent } from "./journey-info/journey-info.component";
import { JourneyMapComponent } from "./journey-map/journey-map.component";
import { JourneyNavComponent } from "./journey-nav/journey-nav.component";
import { OtpStatsComponent } from "./otp-stats/otp-stats.component";
import { StopHoverEvent } from "./stop-list/stop-item/stop-item.component";
import { StopListComponent } from "./stop-list/stop-list.component";
import { VehicleJourneysViewComponent } from "./vehicle-journeys-view.component";

describe("VehicleJourneysViewComponent", () => {
  let spectator: SpectatorRouting<VehicleJourneysViewComponent>;
  let viewService: VehicleJourneysSearchService;
  let journeyGQL: jasmine.SpyObj<JourneyGQL>;

  const startTime = "2022-08-18T11:22:00.000+01:00";

  const mockJourney: Journey = {
    groupId: "gp1",
    startTime: startTime,
    serviceName: "Bristol to Bath",
    serviceNumber: "5",
    operatorName: "Test Operator",
    operatorNoc: "OP123",
    directionRef: "inbound",
    isCancelled: false,
    vehicleJourneyId: 1,
  };

  const mockPrevJourney: Journey = {
    groupId: "gp1",
    startTime: "2022-08-18T11:07:00.000+01:00",
    serviceName: "Bristol to Bath",
    serviceNumber: "5",
    operatorName: "Test Operator",
    operatorNoc: "OP123",
    directionRef: "inbound",
    isCancelled: false,
    vehicleJourneyId: 0,
  };

  const mockNextJourney: Journey = {
    groupId: "gp2",
    startTime: "2022-08-18T11:37:00.000+01:00",
    serviceName: "Bristol to Bath",
    serviceNumber: "5",
    operatorName: "Test Operator",
    operatorNoc: "OP123",
    directionRef: "inbound",
    isCancelled: false,
    vehicleJourneyId: 2,
  };

  const mockStops: Stop[] = [
    {
      stopId: 1,
      stopName: "Stop 1",
      isTimingPoint: true,
      otp: null,
      scheduledDepartureUtc: startTime,
      actualDepartureUtc: startTime,
      estimatedDepartureUtc: null,
      setDown: true,
      incompleteReason: 0,
      latitude: 0,
      longitude: 0,
      directionRef: "inbound",
      stopIndex: 0,
    },
    {
      stopId: 2,
      stopName: "Stop 2",
      isTimingPoint: false,
      otp: null,
      scheduledDepartureUtc: startTime,
      actualDepartureUtc: null,
      estimatedDepartureUtc: null,
      setDown: true,
      incompleteReason: 0,
      latitude: 0,
      longitude: 0,
      directionRef: "inbound",
      stopIndex: 1,
    },
  ];

  const mockAvls: AvlPoint[] = [
    {
      recordedAtTimeUtc: startTime,
      latitude: 0,
      longitude: 0,
      vehicleRef: "ABC-123",
      directionRef: "inbound",
    },
  ];

  const mockJourneys: Journey[] = [
    mockPrevJourney,
    mockJourney,
    mockNextJourney,
  ];

  const createComponent = createRoutingFactory({
    component: VehicleJourneysViewComponent,
    imports: [
      SharedModule,
      LayoutModule,
      ApolloTestingModule,
      RouterModule.forRoot([]),
    ],
    providers: [provideHttpClient()],
    declarations: [
      MockComponent(StopListComponent),
      MockComponent(JourneyInfoComponent),
      MockComponent(JourneyNavComponent),
      MockComponent(JourneyMapComponent),
      MockComponent(OtpStatsComponent),
    ],
    mocks: [JourneyGQL],
    //mocks: [VehicleJourneysSearchService],
    stubsEnabled: false,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    viewService = spectator.inject(VehicleJourneysSearchService);
    journeyGQL = spectator.inject(JourneyGQL);
    spyOn(viewService, "fetchDayJourneys").and.returnValue(of(mockJourneys));
    spyOn(viewService, "getServicePatternDistanceGeom").and.returnValue(
      of({
        distance: 123,
        geom: [
          [0, 0],
          [1, 1],
        ],
      }),
    );
    spyOn(console, "log").and.callFake(() => {
      // Intentionally suppress console.log output during tests
    });

    journeyGQL.fetch.and.returnValue(
      of({
        data: {
          journey: {
            stops: mockStops,
            avls: mockAvls,
          },
        },
        loading: false,
        networkStatus: 7, // 7 means "ready" in Apollo
        errors: undefined,
        extensions: undefined,
      }),
    );
  });

  const setQueryParam = () => {
    spectator.setRouteParam("journeyId", "gp2");
    spectator.setRouteQueryParam("date", "2022-08-18");
    spectator.setRouteQueryParam("operator", "OP123");
    spectator.setRouteQueryParam("service", "TWET-8-PB2060442:5");
    spectator.setRouteQueryParam("direction", "inbound");
  };
  it("should create", () => {
    expect(spectator.component).toBeTruthy();
  });

  it("should set journeyInfo and journeys on init", () => {
    // Set route params and query params to match the provided URI and mock data
    setQueryParam();
    spectator.detectChanges();

    expect(spectator.component.journeyInfo).toEqual({
      stops: mockStops,
      avls: mockAvls,
    });
    expect(spectator.component.journeys.length).toBe(3);
  });

  it("should display the service number and name in page title", async () => {
    setQueryParam();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(
      spectator.query(
        byTextContent("5: Bristol to Bath", {
          selector: "app-browser-title",
        }),
      ),
    ).toBeVisible();
  });

  it("should display error message when journeyGQL.fetch throws an error", () => {
    journeyGQL.fetch.and.returnValue(throwError(() => new Error("Not found")));
    setQueryParam();
    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent("Not found", { selector: "app-browser-title" }),
      ),
    ).toBeVisible();
    expect(
      spectator.query(
        byTextContent(
          "Vehicle journey not found, or you do not have permission to view. Go back to Vehicle journeys?",
          {
            selector: ".govuk-body",
          },
        ),
      ),
    ).toBeVisible();
  });

  it("should set stopType to TimingPoints if allStops query param is not 'true'", () => {
    setQueryParam();
    spectator.detectChanges();

    expect(spectator.component.stopType).toBe(StopTypeOption.TimingPoints);
  });

  it("should set stopType to AllStops if allStops query param is 'true'", () => {
    setQueryParam();
    spectator.setRouteQueryParam("allStops", "true");
    spectator.detectChanges();

    expect(spectator.component.stopType).toBe(StopTypeOption.AllStops);
  });

  it("should update journeyInfo when onVehicleChange is called", () => {
    setQueryParam();
    spectator.detectChanges();

    spectator.component.rawAvls = [
      ...mockAvls,
      { ...mockAvls[0], vehicleRef: "XYZ-999" },
    ];
    spectator.component.vehicleRef = "XYZ-999";
    spectator.component.onVehicleChange();

    expect(
      spectator.component.journeyInfo?.avls.every(
        (a) => a.vehicleRef === "XYZ-999",
      ),
    ).toBeTrue();
  });

  it("should update selectedStop when onStopSelected is called", () => {
    const stop = mockStops[0];
    spectator.component.onStopSelected(stop);
    expect(spectator.component.selectedStop).toBe(stop);
  });

  it("should update hoveredStop when onStopHovered is called", () => {
    const stopEvent: StopHoverEvent = { stop: mockStops[0], event: "enter" };
    spectator.component.onStopHovered(stopEvent);
    expect(spectator.component.hoveredStop).toBe(stopEvent);
  });

  it("should display cancellation warning if selected journey is marked as cancelled", () => {
    //spyOn(viewService, "getVehicleJourneyView").and.returnValue(of(true));
    spectator.setRouteParam("journeyId", "arbb|a|5113|2025-05-0");
    spectator.setRouteQueryParam("date", "2022-08-18");
    spectator.setRouteQueryParam("operator", "OP123");
    spectator.setRouteQueryParam("startTime", toUrlDateFormat(startTime));

    spectator.component.journeys = [
      {
        isCancelled: false,
        directionRef: "inbound",
        groupId: "arbb|a|5113|2025-05-05",
        operatorName: "Arriva Beds and Bucks",
        operatorNoc: "ARBB",
        serviceName: "Dunstable to Luton Airport",
        serviceNumber: "A",
        startTime: "2025-05-05T02:00:00+01:00",
      },
      {
        isCancelled: true,
        directionRef: "inbound",
        groupId: "arbb|a|5113|2025-05-05",
        operatorName: "Arriva Beds and Bucks",
        operatorNoc: "ARBB",
        serviceName: "Dunstable to Luton Airport",
        serviceNumber: "A",
        startTime: "2025-05-05T03:00:00+01:00",
      },
    ];
    spectator.component.currentJourneyIndex = 1;

    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent("Journey Cancelled", {
          selector: ".govuk-error-summary__title",
        }),
      ),
    ).toBeVisible();
  });
});
