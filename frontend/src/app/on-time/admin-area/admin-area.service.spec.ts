import { ApolloTestingModule } from "apollo-angular/testing";

import {
  createServiceFactory,
  mockProvider,
  SpyObject,
} from "@ngneat/spectator";
import { SpectatorService } from "@ngneat/spectator/lib/spectator-service/spectator-service";
import { of } from "rxjs";
import { GetAdminAreasGQL } from "../../../generated/graphql";
import { OperatorService } from "../../shared/services/operator.service";
import { AdminAreaService } from "./admin-area.service";

const DERBYSHIRE_BOUNDARY_SHAPE = [
  [53.3680458, -2.02690601],
  [52.9045258, -1.82813036],
  [52.7352142, -1.69209635],
  [52.7351685, -1.69203734],
  [52.7139664, -1.63121402],
  [52.7125931, -1.57442915],
  [52.8888206, -1.25723732],
  [53.2825508, -1.17243993],
  [53.2834587, -1.17240739],
  [53.3302841, -1.30053258],
  [53.5030289, -1.85361552],
  [53.4718971, -1.97595978],
  [53.4700737, -1.98201668],
  [53.4256248, -2.01974869],
  [53.3680458, -2.02690601],
];

describe("AdminAreaService", () => {
  let spectator: SpectatorService<AdminAreaService>;
  let adminAreaGqlSpy: SpyObject<GetAdminAreasGQL>;

  const serviceFactory = createServiceFactory({
    service: AdminAreaService,
    imports: [ApolloTestingModule],
    mocks: [GetAdminAreasGQL],
    providers: [
      mockProvider(OperatorService, {
        fetchOperators: () =>
          of([
            {
              name: "Op A",
              nocCode: "AAA",
              operatorId: "AAA",
              adminAreaIds: [],
            },
            {
              name: "Op B",
              nocCode: "BBB",
              operatorId: "BBB",
              adminAreaIds: ["1", "2"],
            },
            {
              name: "Stagecoach East Midlands",
              nocCode: "SCEM",
              operatorId: "SCEM",
              adminAreaIds: ["AA100", "AA370", "AA910"],
            },
          ]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    adminAreaGqlSpy = spectator.inject(GetAdminAreasGQL);

    adminAreaGqlSpy.fetch.and.returnValue(
      of({
        data: {
          adminAreas: [
            {
              name: "Area 1",
              id: "1",
              shape: JSON.stringify({
                type: "Polygon",
                coordinates: [],
              }),
            },
            {
              name: "Area 2",
              id: "2",
              shape: JSON.stringify({
                type: "Polygon",
                coordinates: [],
              }),
            },
          ],
        },
        loading: false,
        networkStatus: 7,
      }),
    );
  });

  it("should be created", async () => {
    await expect(spectator.service).toBeTruthy();
  });

  it("should fetch admin areas", (done: DoneFn) => {
    spectator.service.fetchAdminAreas().subscribe((actual) => {
      void expect(actual).not.toBeNull();
      void expect(actual.length).toEqual(2);
      void expect(actual[0].id).toEqual("1");
      void expect(actual[0].name).toEqual("Area 1");

      done();
    });
  });

  it("should fetch admin area boundaries", (done: DoneFn) => {
    adminAreaGqlSpy.fetch.and.returnValue(
      of({
        data: {
          adminAreas: [
            {
              name: "Area 1",
              id: "1",
              shape: JSON.stringify({
                type: "Polygon",
                coordinates: [DERBYSHIRE_BOUNDARY_SHAPE],
              }),
            },
            {
              name: "Area 2",
              id: "2",
              shape: JSON.stringify({
                type: "Polygon",
                coordinates: [DERBYSHIRE_BOUNDARY_SHAPE],
              }),
            },
          ],
        },
        loading: false,
        networkStatus: 7,
      }),
    );

    spectator.service.fetchAdminAreaBoundaries().subscribe((actual) => {
      void expect(actual).not.toBeNull();
      void expect(actual.type).toEqual("FeatureCollection");
      void expect(actual.bbox).toEqual([
        -2.02690601, 52.7125931, -1.17240739, 53.5030289,
      ]);
      void expect(actual.features.length).toEqual(2);
      void expect(actual.features[0].properties.name).toEqual("Area 1");
      void expect(actual.features[0].geometry.coordinates).toEqual([
        DERBYSHIRE_BOUNDARY_SHAPE.map((a) => [a[1], a[0]]), // The code flips the coordinates to lon/lat so we need to do this here
      ]);

      done();
    });
  });

  describe("fetchAdminAreasForOperator", () => {
    it("should return empty array if operator is empty string", (done: DoneFn) => {
      spectator.service.fetchAdminAreasForOperator("").subscribe((data) => {
        void expect(data).toEqual([]);
        done();
      });
    });

    it("should return empty array if operator not found", (done: DoneFn) => {
      spectator.service.fetchAdminAreasForOperator("ZZZ").subscribe((data) => {
        void expect(data).toEqual([]);
        done();
      });
    });

    it("should return empty array if operator found but no admin areas", (done: DoneFn) => {
      spectator.service.fetchAdminAreasForOperator("AAA").subscribe((data) => {
        void expect(data).toEqual([]);
        done();
      });
    });

    it("should return array of admin areas if operator found", (done: DoneFn) => {
      const expected = [
        {
          name: "Area 1",
          id: "1",
          shape: JSON.stringify({
            type: "Polygon",
            coordinates: [],
          }),
        },
        {
          name: "Area 2",
          id: "2",
          shape: JSON.stringify({
            type: "Polygon",
            coordinates: [],
          }),
        },
      ];
      spectator.service.fetchAdminAreasForOperator("BBB").subscribe((data) => {
        void expect(data).toEqual(expected);
        done();
      });
    });
  });
});
