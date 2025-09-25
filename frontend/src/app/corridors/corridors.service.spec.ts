import { fakeAsync, flush } from "@angular/core/testing";
import { createServiceFactory, SpyObject } from "@ngneat/spectator";
import { SpectatorService } from "@ngneat/spectator/lib/spectator-service/spectator-service";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import { DateTime, Settings } from "luxon";
import { of } from "rxjs";
import {
  CorridorGranularity,
  CorridorsListDocument,
  CorridorsStopSearchDocument,
  CorridorsSubsequentStopsDocument,
  CorridorStatsDocument,
  CorridorStatsType,
  CreateCorridorDocument,
  DeleteCorridorDocument,
  GetCorridorDocument,
  MatchType,
  ServiceLinkType,
  UpdateCorridorDocument,
} from "../../generated/graphql";
import { OperatorService } from "../shared/services/operator.service";
import {
  CorridorsService,
  filterServiceLinksByStopsOrReturnServiceLinks,
} from "./corridors.service";
import {
  CorridorStatsViewParams,
  CorridorStop,
  ICorridortransitTimeStats,
} from "./types";
import objectContaining = jasmine.objectContaining;

const journeyTime: ICorridortransitTimeStats = {
  avgTransitTime: 5,
  minTransitTime: 1,
  maxTransitTime: 10,
  percentile5: 2,
  percentile25: 3,
  percentile75: 7,
};

const params: CorridorStatsViewParams = {
  corridorId: "150",
  from: DateTime.fromISO("2023-03-03", { zone: "Europe/London" }),
  to: DateTime.fromISO("2023-03-30", { zone: "Europe/London" }),
  granularity: CorridorGranularity.Day,
  stops: [
    { stopId: "ST0001", stopName: "A", naptan: "ST0001" } as CorridorStop,
    { stopId: "ST0002", stopName: "B", naptan: "ST0002" } as CorridorStop,
  ],
  matchType: MatchType.Evidenced,
};

const stats: CorridorStatsType = {
  summaryStats: {
    scheduledTransits: 100,
    averageTransitTime: 90,
    totalTransits: 95,
    numberOfServices: 5,
  },
  transitTimeStats: [
    {
      ts: DateTime.fromISO("2023-03-03").toISO({ suppressMilliseconds: true }),
      ...journeyTime,
    },
  ],
  transitTimeTimeOfDayStats: [{ hour: 9, ...journeyTime }],
  transitTimeDayOfWeekStats: [{ dow: 1, ...journeyTime }],
  transitTimeHistogram: [
    {
      hist: [
        { bin: 89, freq: 3 },
        { bin: 90, freq: 6 },
        { bin: 92, freq: 1 },
      ],
    },
  ],
  transitTimePerServiceStats: [
    {
      lineName: "Sheffield to Mansfield",
      noc: "OP01",
      operatorName: "Stagecoach East Midlands",
      totalTransitTime: 810,
      scheduledTransits: 10,
      recordedTransits: 9,
      servicePatternName: "",
    },
  ],
  serviceLinks: [],
};

const serviceLinks = [
  {
    fromStop: "ST0100BRP90312",
    toStop: "ST0100BRA10796",
    distance: 100,
    routeValidity: "",
  },
  {
    fromStop: "ST0100BRA10796",
    toStop: "ST0100BRA10807",
    distance: 200,
    routeValidity: "",
  },
  {
    fromStop: "ST0100BRA10807",
    toStop: "ST0100BRP90340",
    distance: 300,
    routeValidity: "",
  },
  {
    fromStop: "ST0100BRP90340",
    toStop: "ST0100BRP90345",
    distance: 400,
    routeValidity: "",
  },
  {
    fromStop: "ST0100BRP90345",
    toStop: "ST0100BRP90003",
    distance: 500,
    routeValidity: "",
  },
];

const paramStopsFound = [
  {
    stopId: "ST0100BRP90312",
    stopName: "",
    lat: 0,
    lon: 1,
    naptan: "ST0100BRP90312",
    intId: 0,
  },
  {
    stopId: "ST0100BRA10796",
    stopName: "",
    lat: 0,
    lon: 1,
    naptan: "ST0100BRA10796",
    intId: 0,
  },
];
const paramStopsNotFound = [
  {
    stopId: "ST0100",
    stopName: "",
    lat: 0,
    lon: 1,
    naptan: "ST0100",
    intId: 0,
  },
  {
    stopId: "ST0200",
    stopName: "",
    lat: 0,
    lon: 1,
    naptan: "ST0200",
    intId: 0,
  },
];

fdescribe("CorridorsService", () => {
  let spectator: SpectatorService<CorridorsService>;
  let controller: ApolloTestingController;
  let opService: SpyObject<OperatorService>;
  const serviceFactory = createServiceFactory({
    service: CorridorsService,
    imports: [ApolloTestingModule],
    providers: [],
    mocks: [OperatorService],
  });

  beforeEach(() => {
    Settings.defaultZone = "Europe/London";
    Settings.now = () => 1664578800; // 2022-10-01 GMT+01:00, i.e. during BST

    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
    opService = spectator.inject(OperatorService);
  });

  it("should query stops", async () => {
    opService.fetchAdminAreaIds.and.returnValue(of(["001", "002"]));

    spectator.service.queryStops("station").subscribe((actual) => {
      void expect(actual).not.toBeNull();
      void expect(actual.orgStops.length).toEqual(2);
      void expect(actual.orgStops[0].stopId).toEqual("ST00001");
      void expect(actual.orgStops[0].stopName).toEqual("Station Road");
      void expect(actual.orgStops[1].stopId).toEqual("ST00002");
      void expect(actual.orgStops[1].stopName).toEqual("Bus Station");
      void expect(actual.nonOrgStops.length).toEqual(1);
      void expect(actual.nonOrgStops[0].stopId).toEqual("ST00003");
      void expect(actual.nonOrgStops[0].stopName).toEqual("Temple Way");
    });

    const op = controller.expectOne(CorridorsStopSearchDocument);

    await expect(op.operation.variables.inputs).toEqual({
      searchString: "station",
      boundingBox: undefined,
    });

    op.flush({
      data: {
        corridor: {
          addFirstStop: [
            {
              stopId: "ST00001",
              stopName: "Station Road",
              lat: 50,
              lon: 0,
              adminAreaId: "001",
            },
            {
              stopId: "ST00002",
              stopName: "Bus Station",
              lat: 50,
              lon: 0,
              adminAreaId: "002",
            },
            {
              stopId: "ST00003",
              stopName: "Temple Way",
              lat: 50,
              lon: 0,
              adminAreaId: "003",
            },
          ],
        },
      },
    });

    controller.verify();
  });

  it("should fetch subsequent stops", fakeAsync(() => {
    spectator.service.fetchSubsequentStops(["ST012345"]).subscribe((actual) => {
      void expect(actual).not.toBeNull();
      void expect(actual.length).toEqual(1);
      void expect(actual[0].stopId).toEqual("ST023456");
      void expect(actual[0].stopName).toEqual("High Street");
    });
    const op = controller.expectOne(CorridorsSubsequentStopsDocument);

    void expect(op.operation.variables.stopList).toEqual(["ST012345"]);

    op.flush({
      data: {
        corridor: {
          addSubsequentStops: [
            {
              stopId: "ST023456",
              stopName: "High Street",
              lat: 51,
              lon: 0,
            },
          ],
        },
      },
    });

    controller.verify();
    flush();
  }));

  it("should save corridors", () => {
    spectator.service
      .createCorridor("my new corridor", ["ST012345"])
      .subscribe();

    controller.expectOne((operation) => {
      void expect(operation.query.definitions).toEqual(
        CreateCorridorDocument.definitions,
      );

      void expect(operation.variables.name).toEqual("my new corridor");
      void expect(operation.variables.stopIds).toEqual(["ST012345"]);
      return true;
    });

    controller.verify();
  });

  it("should fetch corridors", fakeAsync(() => {
    spectator.service.fetchCorridors().subscribe((actual) => {
      void expect(actual).not.toBeNull();
      void expect(actual.length).toEqual(1);
      void expect(actual[0].id).toEqual(234);
      void expect(actual[0].name).toEqual("Test corridor");
      void expect(actual[0].numStops).toEqual(2);
    });

    const op = controller.expectOne(CorridorsListDocument);

    op.flush({
      data: {
        corridor: {
          corridorList: [
            {
              id: 234,
              name: "Test corridor",
              stops: [{ stopId: "ST000001" }, { stopId: "ST000002" }],
            },
          ],
        },
      },
    });

    controller.verify();
    flush();
  }));

  it("should fetch corridors by id", fakeAsync(() => {
    spectator.service.fetchCorridorById(150).subscribe((actual) => {
      void expect(actual).not.toBeNull();
      void expect(actual.id).toEqual(150);
      void expect(actual.name).toEqual("Test corridor");
      void expect(actual.stops.length).toEqual(2);
      void expect(actual.stops[0].stopId).toEqual("ST000001");
      void expect(actual.stops[1].stopId).toEqual("ST000002");
      void expect(actual.stops[0].naptan).toEqual("ST000001");
      void expect(actual.stops[1].naptan).toEqual("ST000002");
    });

    const op = controller.expectOne(GetCorridorDocument);

    void expect(op.operation.variables.corridorId).toEqual(150);

    op.flush({
      data: {
        corridor: {
          getCorridor: {
            id: 150,
            name: "Test corridor",
            stops: [
              {
                stopId: "ST000001",
                stopName: "Foo street",
                stopLocation: { latitude: 50, longitude: 0 },
              },
              {
                stopId: "ST000002",
                stopName: "Bar road",
                stopLocation: { latitude: 51, longitude: 0 },
              },
            ],
          },
        },
      },
    });

    controller.verify();
    flush();
  }));

  it("should fetch corridor stats", async () => {
    spectator.service.fetchStats(params).subscribe((actual) => {
      void expect(actual.summaryStats.numberOfServices).toEqual(5);
    });

    const op = controller.expectOne(CorridorStatsDocument);

    await expect(op.operation.variables.params).toEqual(
      objectContaining({
        corridorId: "150",
        fromTimestamp: "2023-03-03T00:00:00.000+00:00",
        toTimestamp: "2023-03-30T00:00:00.000+01:00",
        granularity: CorridorGranularity.Day,
        stopList: ["ST0001", "ST0002"],
      }),
    );

    op.flush({ data: { corridor: { stats } } });

    controller.verify();
  });

  it("should convert corridor stats", async () => {
    const actual = spectator.service.convertStats(stats, params);

    await expect(actual.transitTimeStats[0].ts).toEqual(
      "2023-03-03T00:00:00+00:00",
    );
    await expect(
      actual.transitTimeStats[actual.transitTimeStats.length - 1].ts,
    ).toEqual("2023-03-30T00:00:00+01:00");

    await expect(actual.transitTimeStats.length).toEqual(28);
    await expect(actual.transitTimeTimeOfDayStats.length).toEqual(25);
    await expect(actual.transitTimeDayOfWeekStats.length).toEqual(7);
    await expect(actual.transitTimeHistogram.length).toEqual(5);
    await expect(actual.transitTimePerServiceStats.length).toEqual(1);

    // from midnight to midnight, inclusive
    await expect(actual.transitTimeTimeOfDayStats[0].hour).toEqual(0);
    await expect(actual.transitTimeTimeOfDayStats[24].hour).toEqual(24);

    // Monday to Sunday
    await expect(actual.transitTimeDayOfWeekStats[0].category).toEqual("Mon");
    await expect(actual.transitTimeDayOfWeekStats[6].category).toEqual("Sun");

    await expect(actual.transitTimePerServiceStats[0]?.noc).toEqual("OP01");
    await expect(actual.transitTimePerServiceStats[0]?.operatorName).toEqual(
      "Stagecoach East Midlands",
    );
  });

  it("should delete corridors", () => {
    spectator.service.deleteCorridor(1234).subscribe();

    controller.expectOne((operation) => {
      void expect(operation.query.definitions).toEqual(
        DeleteCorridorDocument.definitions,
      );

      void expect(operation.variables.corridorId).toEqual(1234);
      return true;
    });

    controller.verify();
  });

  describe("filterServiceLinksByStopsOrReturnServiceLinks", () => {
    it("should return a single service link section where fromStop and toStop matches", async () => {
      params.stops = paramStopsFound;
      const result = filterServiceLinksByStopsOrReturnServiceLinks(
        serviceLinks as ServiceLinkType[],
        params.stops,
      );

      await expect(result[0].distance).toEqual(100);
      await expect(result[0].fromStop).toEqual(params.stops[0].stopId);
      await expect(result[0].toStop).toEqual(params.stops[1].stopId);
    });

    it("should return all service links if params undefined", async () => {
      const result = filterServiceLinksByStopsOrReturnServiceLinks(
        serviceLinks as ServiceLinkType[],
        undefined,
      );

      await expect(result.length).toEqual(serviceLinks.length);
    });

    it("should return all service links if params stop list empty", async () => {
      params.stops = [];
      const result = filterServiceLinksByStopsOrReturnServiceLinks(
        serviceLinks as ServiceLinkType[],
        params.stops,
      );

      await expect(result.length).toEqual(serviceLinks.length);
    });

    it("should return all service links if no match params stop list empty", async () => {
      params.stops = paramStopsNotFound;
      const result = filterServiceLinksByStopsOrReturnServiceLinks(
        serviceLinks as ServiceLinkType[],
        params.stops,
      );

      await expect(result.length).toEqual(serviceLinks.length);
    });

    afterAll(() => {
      params.stops = [
        { stopId: "ST0001", stopName: "A", naptan: "ST0001" } as CorridorStop,
        { stopId: "ST0002", stopName: "B", naptan: "ST0002" } as CorridorStop,
      ];
    });
  });

  it("should update corridor", () => {
    spectator.service
      .updateCorridor({
        name: "my updated corridor",
        id: 123,
        stopList: ["ST012345", "ST67890"],
      })
      .subscribe();

    controller.expectOne((operation) => {
      void expect(operation.query.definitions).toEqual(
        UpdateCorridorDocument.definitions,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      void expect(operation.variables.inputs.name).toEqual(
        "my updated corridor",
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      void expect(operation.variables.inputs.id).toEqual(123);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      void expect(operation.variables.inputs.stopList).toEqual([
        "ST012345",
        "ST67890",
      ]);
      return true;
    });

    controller.verify();
  });
});
