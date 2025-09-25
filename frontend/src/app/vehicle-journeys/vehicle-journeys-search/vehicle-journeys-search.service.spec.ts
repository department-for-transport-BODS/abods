import { SpectatorService } from "@ngneat/spectator/lib/spectator-service/spectator-service";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import { createServiceFactory } from "@ngneat/spectator";
import {
  Direction,
  JourneysDocument,
  ServicePatternDistanceGeomDocument,
} from "../../../generated/graphql";
import { VehicleJourneysSearchService } from "./vehicle-journeys-search.service";
import { DateTime, Settings } from "luxon";
import { waitForAsync } from "@angular/core/testing";

// The real data has duplicates, as we are only selecting a small subset of fields
const data = {
  vehicleReplay: {
    findJourneys: [
      {
        groupId: "VJ0c5bcd05",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ0c5bcd05",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ0c5bcd05",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ0c5bcd04",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ0c5bcd04",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ0c5bcd04",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ0c5bcd04",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ0c5bcd04",
        startTime: "2022-09-01T08:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ41f09c9c",
        startTime: "2022-09-01T08:55:00",
        serviceInfo: {
          serviceName: "Worksop - Chesterfield",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ41f09c9c",
        startTime: "2022-09-01T08:55:00",
        serviceInfo: {
          serviceName: "Worksop - Chesterfield",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ41f09c9c",
        startTime: "2022-09-01T08:55:00",
        serviceInfo: {
          serviceName: "Worksop - Chesterfield",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ41f09c9c",
        startTime: "2022-09-01T08:55:00",
        serviceInfo: {
          serviceName: "Worksop - Chesterfield",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ41f09c9c",
        startTime: "2022-09-01T08:55:00",
        serviceInfo: {
          serviceName: "Worksop - Chesterfield",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ9be619bc",
        startTime: "2022-09-01T07:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ9be619bc",
        startTime: "2022-09-01T07:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ9be619bc",
        startTime: "2022-09-01T07:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ9be619bc",
        startTime: "2022-09-01T07:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
      {
        groupId: "VJ9be619bc",
        startTime: "2022-09-01T07:35:00",
        serviceInfo: {
          serviceName: "Chesterfield - Worksop",
          serviceNumber: "77",
        },
      },
    ],
  },
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
      .fetchDayJourneys(
        DateTime.fromISO("2022-09-01T00:00").toISO(),
        DateTime.fromISO("2022-09-02T00:00").toISO(),
      )
      .subscribe((actual) => {
        expect(actual).not.toBeNull();
        expect(actual.length).toEqual(4);
        expect(actual[0].groupId).toEqual("VJ9be619bc");
        expect(actual[0].startTime).toEqual(
          DateTime.fromISO("2022-09-01T07:35:00").toISO(),
        );
        expect(actual[0].serviceName).toEqual("Chesterfield - Worksop");
        expect(actual[0].serviceNumber).toEqual("77");
        expect(actual[0].directionRef).toEqual(Direction.Inbound);
        expect(actual[1].groupId).toEqual("VJ0c5bcd05");
        expect(actual[1].startTime).toEqual(
          DateTime.fromISO("2022-09-01T08:35:00").toISO(),
        );
        expect(actual[1].serviceName).toEqual("Chesterfield - Worksop");
        expect(actual[1].serviceNumber).toEqual("77");
        expect(actual[2].groupId).toEqual("VJ0c5bcd04");
        expect(actual[2].startTime).toEqual(
          DateTime.fromISO("2022-09-01T08:35:00").toISO(),
        );
        expect(actual[2].serviceName).toEqual("Chesterfield - Worksop");
        expect(actual[2].serviceNumber).toEqual("77");
        expect(actual[3].groupId).toEqual("VJ41f09c9c");
        expect(actual[3].startTime).toEqual(
          DateTime.fromISO("2022-09-01T08:55:00").toISO(),
        );
        expect(actual[3].serviceName).toEqual("Worksop - Chesterfield");
        expect(actual[3].serviceNumber).toEqual("77");
      });

    const op = controller.expectOne(JourneysDocument);

    expect(op.operation.variables.fromTimestamp).toEqual(
      "2022-09-01T00:00:00.000Z",
    );
    expect(op.operation.variables.toTimestamp).toEqual(
      "2022-09-02T00:00:00.000Z",
    );
    expect(op.operation.variables.lineId).toEqual("LI12345");

    op.flush({ data });

    controller.verify();
  }));

  it("should fetch service pattern distance geometry successfully", (done) => {
    const mockGeom: { distance: number; geom: [number, number][] } = {
      distance: 123,
      geom: [
        [0, 0],
        [1, 1],
      ],
    };
    const mockResponse = {
      vehicleReplay: {
        getServicePatternDistanceGeom: mockGeom,
      },
    };

    spectator.service
      .getServicePatternDistanceGeom("patternId")
      .subscribe((result) => {
        expect(result).toEqual(mockGeom);
        done();
      });

    const op = controller.expectOne(ServicePatternDistanceGeomDocument);
    expect(op.operation.variables.patternId).toBe("patternId");
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
