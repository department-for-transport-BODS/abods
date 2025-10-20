import { Router, UrlTree } from "@angular/router";
import { createServiceFactory, SpectatorService } from "@ngneat/spectator";
import { of } from "rxjs";
import { OperatorService } from "../shared/services/operator.service";
import { SingleOperatorGuardService } from "./single-operator-guard.service";

describe("SingleOperatorGuardService", () => {
  let spectator: SpectatorService<SingleOperatorGuardService>;
  let operatorService: jasmine.SpyObj<OperatorService>;
  let router: jasmine.SpyObj<Router>;
  let mockUrlTree: UrlTree;

  const serviceFactory = createServiceFactory({
    service: SingleOperatorGuardService,
    mocks: [OperatorService, Router],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    operatorService = spectator.inject(
      OperatorService,
    ) as jasmine.SpyObj<OperatorService>;
    router = spectator.inject(Router) as jasmine.SpyObj<Router>;

    mockUrlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(mockUrlTree);
  });

  it("should be created", () => {
    expect(spectator.service).toBeTruthy();
  });

  describe("canActivate", () => {
    it("should redirect to operator page when only one operator exists", (done: DoneFn) => {
      const singleOperator = [
        {
          operatorId: "OP001",
          name: "Operator 1",
          nocCode: "NOC001",
          adminAreaIds: ["110"],
        },
      ];
      operatorService.fetchOperators.and.returnValue(of(singleOperator));

      spectator.service.canActivate().subscribe((result) => {
        expect(result).toBe(mockUrlTree);
        expect(router.createUrlTree).toHaveBeenCalledWith(["on-time", "OP001"]);
        done();
      });
    });

    it("should return true when multiple operators exist", (done: DoneFn) => {
      const multipleOperators = [
        {
          operatorId: "OP001",
          name: "Operator 1",
          nocCode: "NOC001",
          adminAreaIds: ["110"],
        },
        {
          operatorId: "OP002",
          name: "Operator 2",
          nocCode: "NOC002",
          adminAreaIds: ["120"],
        },
      ];
      operatorService.fetchOperators.and.returnValue(of(multipleOperators));

      spectator.service.canActivate().subscribe((result) => {
        expect(result).toBe(true);
        expect(router.createUrlTree).not.toHaveBeenCalled();
        done();
      });
    });

    it("should return true when no operators exist", (done: DoneFn) => {
      operatorService.fetchOperators.and.returnValue(of([]));

      spectator.service.canActivate().subscribe((result) => {
        expect(result).toBe(true);
        expect(router.createUrlTree).not.toHaveBeenCalled();
        done();
      });
    });

    it("should use correct operatorId from the first operator", (done: DoneFn) => {
      const singleOperator = [
        {
          operatorId: "TEST_OP_123",
          name: "Test Operator",
          nocCode: "NOC_TEST",
          adminAreaIds: ["999"],
        },
      ];
      operatorService.fetchOperators.and.returnValue(of(singleOperator));

      spectator.service.canActivate().subscribe(() => {
        expect(router.createUrlTree).toHaveBeenCalledWith([
          "on-time",
          "TEST_OP_123",
        ]);
        done();
      });
    });
  });
});
