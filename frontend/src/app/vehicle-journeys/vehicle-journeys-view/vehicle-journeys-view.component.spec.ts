import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import {
  byTextContent,
  createRoutingFactory,
  SpectatorRouting,
} from "@ngneat/spectator";
import { ApolloTestingModule } from "apollo-angular/testing";
import { DateTime } from "luxon";
import { MockComponent } from "ng-mocks";
import { of, throwError } from "rxjs";
import { LayoutModule } from "../../layout/layout.module";
import { SharedModule } from "../../shared/shared.module";
import { toUrlDateFormat } from "../../shared/url-helper";
import { JourneyInfoComponent } from "./journey-info/journey-info.component";
import { StopListComponent } from "./stop-list/stop-list.component";
import { VehicleJourneysViewComponent } from "./vehicle-journeys-view.component";
import { JourneyNavComponent } from "./journey-nav/journey-nav.component";
import { VehicleJourneysSearchService } from "../vehicle-journeys-search/vehicle-journeys-search.service";
import {
  Stop,
  AvlPoint,
  Journey,
  StopTypeOption,
} from "../../../generated/graphql";
import { StopHoverEvent } from "./stop-list/stop-item/stop-item.component";

describe("VehicleJourneysViewComponent", () => {
  let spectator: SpectatorRouting<VehicleJourneysViewComponent>;
  let viewService: any;

  const journeyId = "VJ7eb0894c0ed7613e55fc516103b05db9408cdd05";
  const startTime = "2022-08-18T11:22:00.000+01:00";
  const mockJourney: Journey = {
    groupId: journeyId,
    startTime: DateTime.fromISO(startTime),
    lineNumber: "5",
    servicePattern: "Bristol to Bath",
    serviceName: "Bristol to Bath",
    serviceId: "5",
    directionRef: "inbound",
    vehicleJourneyId: "vj-1",
  } as any;

  const mockPrevJourney: Journey = {
    groupId: "VJ564d30c786cf4cae8a2276393b3263dc",
    startTime: DateTime.fromISO("2022-08-18T11:07:00.000+01:00"),
    lineNumber: "5",
    servicePattern: "Bristol to Bath",
    serviceName: "Bristol to Bath",
    serviceId: "5",
    directionRef: "inbound",
    vehicleJourneyId: "vj-0",
  } as any;

  const mockNextJourney: Journey = {
    groupId: "VJ849a1ba0f34c4d3fad757a7fee47636d",
    startTime: DateTime.fromISO("2022-08-18T11:37:00.000+01:00"),
    lineNumber: "5",
    servicePattern: "Bristol to Bath",
    serviceName: "Bristol to Bath",
    serviceId: "5",
    directionRef: "inbound",
    vehicleJourneyId: "vj-2",
  } as any;

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
      RouterTestingModule,
      HttpClientTestingModule,
    ],
    declarations: [
      MockComponent(StopListComponent),
      MockComponent(JourneyInfoComponent),
      MockComponent(JourneyNavComponent),
    ],
    mocks: [VehicleJourneysSearchService],
    stubsEnabled: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    viewService = spectator.inject(VehicleJourneysSearchService);
    viewService.fetchDayJourneys.and.returnValue(of(mockJourneys));
    viewService.getServicePatternDistanceGeom?.and.returnValue(
      of({
        distance: 123,
        geom: [
          [0, 0],
          [1, 1],
        ],
      }),
    );
    // Mock journeyGQL.fetch to return journeyInfo
    (spectator.component as any).journeyGQL = {
      fetch: () =>
        of({
          data: {
            journey: {
              stops: mockStops,
              avls: mockAvls,
            },
          },
        }),
    } as any;
  });

  it("should create", () => {
    expect(spectator.component).toBeTruthy();
  });

  it("should set journeyInfo and journeys on init", () => {
    spectator.setRouteParam("journeyId", journeyId);
    spectator.setRouteQueryParam("startTime", toUrlDateFormat(startTime));
    spectator.detectChanges();

    expect(spectator.component.journeyInfo).toEqual({
      stops: mockStops,
      avls: mockAvls,
    });
    expect(spectator.component.journeys.length).toBe(3);
  });

  it("should display the service number and name in page title", () => {
    spectator.setRouteParam("journeyId", journeyId);
    spectator.setRouteQueryParam("startTime", toUrlDateFormat(startTime));
    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent("5: Bristol to Bath", {
          selector: ".page-header__title",
        }),
      ),
    ).toBeVisible();
  });

  it("should display error message when journeyGQL.fetch throws an error", () => {
    (spectator.component as any).journeyGQL = {
      fetch: () => throwError(() => new Error("Not found")),
    };
    spectator.setRouteParam("journeyId", journeyId);
    spectator.setRouteQueryParam("startTime", toUrlDateFormat(startTime));
    spectator.detectChanges();

    expect(
      spectator.query(
        byTextContent("Journey not found", { selector: ".page-header__title" }),
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
    spectator.setRouteParam("journeyId", journeyId);
    spectator.setRouteQueryParam("startTime", toUrlDateFormat(startTime));
    spectator.setRouteQueryParam("allStops", "true");
    spectator.detectChanges();

    expect(spectator.component.stopType).toBe(StopTypeOption.TimingPoints);
  });

  it("should set stopType to AllStops if allStops query param is 'true'", () => {
    spectator.setRouteParam("journeyId", journeyId);
    spectator.setRouteQueryParam("startTime", toUrlDateFormat(startTime));
    spectator.setRouteQueryParam("allStops", "true");
    spectator.detectChanges();

    expect(spectator.component.stopType).toBe(StopTypeOption.AllStops);
  });

  it("should update journeyInfo when onVehicleChange is called", () => {
    spectator.setRouteParam("journeyId", journeyId);
    spectator.setRouteQueryParam("startTime", toUrlDateFormat(startTime));
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
    spyOn(viewService, "getVehicleJourneyView").and.returnValue(of(mockView));
    spectator.setRouteParam("journeyId", journeyId);
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
