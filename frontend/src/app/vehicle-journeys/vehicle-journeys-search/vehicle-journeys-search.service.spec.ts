import { SpectatorService } from "@ngneat/spectator/lib/spectator-service/spectator-service";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import { createServiceFactory } from "@ngneat/spectator";
import {
  Direction,
  JourneysQuery,
  JourneysDocument,
  ServicePatternDistanceGeomDocument,
} from "../../../generated/graphql";
import { VehicleJourneysSearchService } from "./vehicle-journeys-search.service";
import { DateTime, Settings } from "luxon";
import { waitForAsync } from "@angular/core/testing";

// The real data has duplicates, as we are only selecting a small subset of fields
const data: JourneysQuery = {
  findJourneys: [
    {
      groupId: "VJ0c5bcd05",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 1,
    },
    {
      groupId: "VJ0c5bcd05",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 2,
    },
    {
      groupId: "VJ0c5bcd05",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 3,
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 4,
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 5,
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 6,
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 7,
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 8,
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",
      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Outbound,
      isCancelled: false,
      vehicleJourneyId: 9,
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",
      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Outbound,
      isCancelled: false,
      vehicleJourneyId: 10,
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",
      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Outbound,
      isCancelled: false,
      vehicleJourneyId: 11,
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",
      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Outbound,
      isCancelled: false,
      vehicleJourneyId: 12,
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",
      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Outbound,
      isCancelled: false,
      vehicleJourneyId: 13,
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 14,
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 15,
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 16,
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 17,
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "Stagecoach",
      operatorNoc: "OP123",
      directionRef: Direction.Inbound,
      isCancelled: false,
      vehicleJourneyId: 18,
    },
  ],
};

describe("VehicleJourneysSearchService", () => {
  let spectator: SpectatorService<VehicleJourneysSearchService>;
  let controller: ApolloTestingController;
  const serviceFactory = createServiceFactory({
    service: VehicleJourneysSearchService,
    imports: [ApolloTestingModule],
  });

  beforeEach(() => {
    Settings.defaultZone = "utc";
    Settings.now = () => 1663286400000; // 2022-09-16

    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  it("should query journeys", waitForAsync(() => {
    spectator.service
      .fetchDayJourneys(DateTime.fromISO("2022-09-01T00:00").toISO(), "LI12345")
      .subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(18);
        expect(actual[0].groupId).toEqual("VJ9be619bc");
        expect(actual[0].startTime).toEqual("2022-09-01T07:35:00");
        expect(actual[0].serviceName).toEqual("Chesterfield - Worksop");
        expect(actual[0].serviceNumber).toEqual("77");
        expect(actual[0].directionRef).toEqual(Direction.Inbound);
        expect(actual[5].groupId).toEqual("VJ0c5bcd05");
        expect(actual[5].startTime).toEqual("2022-09-01T08:35:00");
        expect(actual[5].serviceName).toEqual("Chesterfield - Worksop");
        expect(actual[5].serviceNumber).toEqual("77");
        expect(actual[5].directionRef).toEqual(Direction.Inbound);
      });

    const op = controller.expectOne(JourneysDocument);

    expect(op.operation.variables.dateOfJourney).toEqual(
      "2022-09-01T00:00:00.000Z",
    );
    expect(op.operation.variables.lineId).toEqual("LI12345");

    op.flush({ data });

    controller.verify();
  }));

  it("should fetch service pattern distance geometry successfully", (done) => {
    const mockResponse = {
      getServicePatternDistanceGeom: {
        distance: 123,
        geom: [
          [0, 0],
          [1, 1],
        ],
      },
    };

    spectator.service
      .getServicePatternDistanceGeom("patternId")
      .subscribe((result) => {
        expect(result).toEqual({
          distance: 123,
          geom: [
            [0, 0],
            [1, 1],
          ],
        });
        done();
      });

    const op = controller.expectOne(ServicePatternDistanceGeomDocument);
    expect(op.operation.variables.vehicleJourneyId).toBe("patternId");
    op.flush({ data: mockResponse });
    controller.verify();
  });

  it("should handle errors when fetching service pattern distance geometry", (done) => {
    spectator.service.getServicePatternDistanceGeom("patternId").subscribe({
      next: () => fail("should not emit on success"),
      error: (err) => {
        expect(err).toBeTruthy();
        done();
      },
    });

    const op = controller.expectOne(ServicePatternDistanceGeomDocument);
    op.graphqlErrors([new Error("GraphQL error") as any]);
    controller.verify();
  });
});
