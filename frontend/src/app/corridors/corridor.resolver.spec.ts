import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, RouterModule } from "@angular/router";
import { ApolloTestingModule } from "apollo-angular/testing";
import { of, throwError } from "rxjs";
import { CorridorNotFoundView } from "./corridor-not-found-view.model";
import { CorridorsService } from "./corridors.service";

import { CorridorResolver } from "./corridor.resolver";
import { Corridor } from "./types";

describe("CorridorResolver", () => {
  let resolver: CorridorResolver;
  let service: CorridorsService;
  const route: ActivatedRouteSnapshot = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paramMap: { get: (name: string) => "123" },
  } as ActivatedRouteSnapshot;
  const testStop1 = {
    stopId: "ST012345",
    naptan: "012345",
    stopName: "Station Road",
    lat: 50,
    lon: 0,
    intId: 0,
  };
  const testStop2 = {
    stopId: "ST023456",
    naptan: "023456",
    stopName: "High Street",
    lat: 51,
    lon: 0,
    intId: 1,
  };
  const corridor: Corridor = {
    name: "test corridor",
    id: 123,
    stops: [testStop1, testStop2],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), ApolloTestingModule],
      providers: [CorridorsService],
    });
    resolver = TestBed.inject(CorridorResolver);
    service = TestBed.inject(CorridorsService);
  });

  it("should be created", async () => {
    await expect(resolver).toBeTruthy();
  });

  it("should call fetchCorridorById passing corridorId", () => {
    spyOn(service, "fetchCorridorById").and.returnValue(of(corridor));
    resolver.resolve(route);

    expect(service.fetchCorridorById).toHaveBeenCalledWith(123);
  });

  it("should return corridor", () => {
    spyOn(service, "fetchCorridorById").and.returnValue(of(corridor));
    resolver.resolve(route).subscribe((corridor) => {
      void expect(corridor).toBeTruthy();
      void expect((corridor as Corridor).id).toEqual(123);
      void expect((corridor as Corridor).name).toEqual("test corridor");
      void expect((corridor as Corridor).stops).toEqual([testStop1, testStop2]);
    });
  });

  it("shoud return corridor not found view on error", () => {
    spyOn(service, "fetchCorridorById").and.returnValue(
      throwError(() => "error"),
    );
    resolver.resolve(route).subscribe((corridor) => {
      void expect(corridor).toBeTruthy();
      expect(corridor).toBeInstanceOf(CorridorNotFoundView);
    });
  });
});
