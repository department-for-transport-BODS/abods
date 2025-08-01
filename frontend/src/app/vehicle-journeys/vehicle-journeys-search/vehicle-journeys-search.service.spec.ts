import { SpectatorService } from "@ngneat/spectator/lib/spectator-service/spectator-service";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import { createServiceFactory } from "@ngneat/spectator";
import { JourneysDocument, JourneysQuery } from "../../../generated/graphql";
import { VehicleJourneysSearchService } from "./vehicle-journeys-search.service";
import { DateTime, Settings } from "luxon";
import { waitForAsync } from "@angular/core/testing";

// The real data has duplicates, as we are only selecting a small subset of fields
const data = {
  findJourneys: [
    {
      groupId: "VJ0c5bcd05",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ0c5bcd05",
      startTime: "2022-09-01T08:35:00",
      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ0c5bcd05",
      startTime: "2022-09-01T08:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ0c5bcd04",
      startTime: "2022-09-01T08:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",

      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",

      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",

      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",

      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ41f09c9c",
      startTime: "2022-09-01T08:55:00",

      serviceName: "Worksop - Chesterfield",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
    {
      groupId: "VJ9be619bc",
      startTime: "2022-09-01T07:35:00",

      serviceName: "Chesterfield - Worksop",
      serviceNumber: "77",
      operatorName: "",
      operatorNoc: "",
    },
  ],
} as JourneysQuery;

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

  // it("should find next and previous journeys", waitForAsync(() => {
  //   spectator.service
  //     .fetchDayJourneys(
  //       DateTime.fromISO("20220901T0835Z").toISO(),
  //     )
  //     .subscribe((actual) => {
  //       expect(actual).not.toBeNull();
  //       expect(actual.length).toEqual(2);

  //       const [prev, next] = actual;

  //       expect(prev?.groupId).toEqual("VJ0c5bcd05");
  //       expect(prev?.startTime).toEqual(
  //         DateTime.fromISO("2022-09-01T08:35:00"),
  //       );

  //       expect(next?.groupId).toEqual("VJ41f09c9c");
  //       expect(next?.startTime).toEqual(
  //         DateTime.fromISO("2022-09-01T08:55:00"),
  //       );
  //     });

  //   const op = controller.expectOne(JourneysDocument);

  //   expect(op.operation.variables.fromTimestamp).toEqual(
  //     "2022-09-01T00:00:00.000Z",
  //   );
  //   expect(op.operation.variables.toTimestamp).toEqual(
  //     "2022-09-02T00:00:00.000Z",
  //   );
  //   expect(op.operation.variables.lineId).toEqual("LI12345");

  //   op.flush({ data });

  //   controller.verify();
  // }));
});
