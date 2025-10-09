import { createServiceFactory } from "@ngneat/spectator";
import { SpectatorService } from "@ngneat/spectator/lib/spectator-service/spectator-service";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import {
  ServicePatternType,
  TransitModelServicePatternStopsDocument,
} from "../../generated/graphql";
import { TransitModelService } from "./transit-model.service";

fdescribe("TransitModelService", () => {
  let spectator: SpectatorService<TransitModelService>;
  let controller: ApolloTestingController;
  const serviceFactory = createServiceFactory({
    service: TransitModelService,
    imports: [ApolloTestingModule],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it("should fetch transit model data", (done: DoneFn) => {
    const expected: ServicePatternType = {
      servicePatternId: "123",
      serviceLinks: [],
      stops: [
        { stopId: "ST0000001", stopName: "Railway Station", lat: 52, lon: 0 },
      ],
    };

    spectator.service
      .fetchServicePatternStops("OP1", "LI12345")
      .subscribe((actual) => {
        void expect(actual).toHaveSize(1);
        void expect(actual[0]).not.toBeNull();
        void expect(actual[0].servicePatternId).toEqual("123");
        void expect(actual[0].stops[0]).toEqual(
          jasmine.objectContaining({ ...expected.stops[0] }),
        );
        done();
      });

    const op = controller.expectOne(TransitModelServicePatternStopsDocument);

    void expect(op.operation.variables.operatorId).toEqual("OP1");
    void expect(op.operation.variables.lineId).toEqual("LI12345");

    op.flush({
      data: {
        servicePatterns: [expected],
      },
    });
  });

  it("should cope with empty array in graphql response", (done: DoneFn) => {
    spectator.service
      .fetchServicePatternStops("OP2", "LI34567")
      .subscribe((actual) => {
        void expect(actual).toHaveSize(0);
        done();
      });

    const op = controller.expectOne(TransitModelServicePatternStopsDocument);

    void expect(op.operation.variables.operatorId).toEqual("OP2");
    void expect(op.operation.variables.lineId).toEqual("LI34567");

    op.flush({
      data: {
        servicePatterns: [],
      },
    });
  });
});
