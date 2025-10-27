import { createServiceFactory, SpectatorService } from "@ngneat/spectator";
import {
  ApolloTestingController,
  ApolloTestingModule,
} from "apollo-angular/testing";
import {
  AdminOrgListDocument,
  DistancesDropdownInputDocument,
  DistancesListDocument,
  OrgOperatorListDocument,
  UserOrganisationsDocument,
} from "../../generated/graphql";
import { DistancesService } from "./distances.service";

describe("DistancesService", () => {
  let spectator: SpectatorService<DistancesService>;
  let controller: ApolloTestingController;

  const serviceFactory = createServiceFactory({
    service: DistancesService,
    imports: [ApolloTestingModule],
  });

  beforeEach(() => {
    spectator = serviceFactory();
    controller = spectator.inject(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it("should be created", () => {
    expect(spectator.service).toBeTruthy();
  });

  describe("fetchOperatorsUsingOrg", () => {
    it("should fetch operators for a given organization", (done: DoneFn) => {
      const orgId = 123;
      const mockOperators = [
        { nocCode: "OP001", name: "Operator 1" },
        { nocCode: "OP002", name: "Operator 2" },
      ];

      spectator.service.fetchOperatorsUsingOrg(orgId).subscribe((result) => {
        expect(result).toEqual(mockOperators);
        done();
      });

      const op = controller.expectOne(OrgOperatorListDocument);
      expect(op.operation.variables.orgId).toEqual(orgId);

      op.flush({
        data: {
          operators: mockOperators,
        },
      });
    });

    it("should handle empty operators list", (done: DoneFn) => {
      const orgId = 999;

      spectator.service.fetchOperatorsUsingOrg(orgId).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const op = controller.expectOne(OrgOperatorListDocument);
      op.flush({
        data: {
          operators: [],
        },
      });
    });
  });

  describe("fetchDistances", () => {
    it("should fetch distances with filter parameters", (done: DoneFn) => {
      const filterBy = {
        fromTimestamp: "2024-01-01",
        toTimestamp: "2024-01-31",
        operatorIds: ["OP001"],
      };
      const mockDistances = [
        {
          operatorId: "OP001",
          operatorName: "Operator 1",
          nocLineAndServiceCode: "LINE001:SERVICE001",
          lineName: "Line 1",
          serviceName: "Service 1",
          distance: 100,
          avlDistance: 95,
        },
        {
          operatorId: "OP002",
          operatorName: "Operator 2",
          nocLineAndServiceCode: "LINE002:SERVICE002",
          lineName: "Line 2",
          serviceName: "Service 2",
          distance: 200,
          avlDistance: 190,
        },
      ];

      spectator.service.fetchDistances(filterBy).subscribe((result) => {
        expect(result).toEqual(mockDistances);
        done();
      });

      const op = controller.expectOne(DistancesListDocument);
      expect(op.operation.variables.filterBy).toEqual(filterBy);

      op.flush({
        data: {
          distances: mockDistances,
        },
      });
    });

    it("should handle null distances response", (done: DoneFn) => {
      const filterBy = {
        fromTimestamp: "2024-01-01",
        toTimestamp: "2024-01-31",
      };

      spectator.service.fetchDistances(filterBy).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const op = controller.expectOne(DistancesListDocument);
      op.flush({
        data: {
          distances: null,
        },
      });
    });
  });

  describe("fetchAdminOrgList", () => {
    it("should fetch admin organization list", (done: DoneFn) => {
      const mockAdminOrgMap = [
        {
          adminAreaId: 1,
          adminName: "Admin Area 1",
          operatorId: "OP001",
          orgId: 1,
          orgName: "Org 1",
        },
        {
          adminAreaId: 2,
          adminName: "Admin Area 2",
          operatorId: "OP002",
          orgId: 2,
          orgName: "Org 2",
        },
      ];

      spectator.service.fetchAdminOrgList().subscribe((result) => {
        expect(result).toEqual(mockAdminOrgMap);
        done();
      });

      const op = controller.expectOne(AdminOrgListDocument);
      expect(op.operation.variables).toEqual({});

      op.flush({
        data: {
          adminOrgMap: mockAdminOrgMap,
        },
      });
    });

    it("should handle empty admin org list", (done: DoneFn) => {
      spectator.service.fetchAdminOrgList().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const op = controller.expectOne(AdminOrgListDocument);
      op.flush({
        data: {
          adminOrgMap: [],
        },
      });
    });
  });

  describe("fetchDistancesDropdows", () => {
    it("should fetch distances dropdown options", (done: DoneFn) => {
      const mockDropdowns = {
        operators: [
          {
            id: "OP001",
            name: "Operator 1",
            licenses: [
              {
                id: "L001",
                services: [{ id: "S001", name: "Service 1", line: "Line 1" }],
              },
            ],
          },
          {
            id: "OP002",
            name: "Operator 2",
            licenses: [
              {
                id: "L002",
                services: [{ id: "S002", name: "Service 2", line: "Line 2" }],
              },
            ],
          },
        ],
      };

      spectator.service.fetchDistancesDropdows().subscribe((result) => {
        expect(result).toEqual(mockDropdowns);
        done();
      });

      const op = controller.expectOne(DistancesDropdownInputDocument);
      expect(op.operation.variables).toEqual({});

      op.flush({
        data: {
          distancesDropdowns: mockDropdowns,
        },
      });
    });

    it("should handle null dropdowns response", (done: DoneFn) => {
      spectator.service.fetchDistancesDropdows().subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const op = controller.expectOne(DistancesDropdownInputDocument);
      op.flush({
        data: {
          distancesDropdowns: null,
        },
      });
    });
  });

  describe("fetchUserOrgs", () => {
    it("should fetch user organizations", (done: DoneFn) => {
      const mockUserOrgs = [
        { id: 1, name: "Org 1" },
        { id: 2, name: "Org 2" },
      ];

      spectator.service.fetchUserOrgs().subscribe((result) => {
        expect(result).toEqual(mockUserOrgs);
        done();
      });

      const op = controller.expectOne(UserOrganisationsDocument);
      expect(op.operation.variables).toEqual({});

      op.flush({
        data: {
          userOrgs: mockUserOrgs,
        },
      });
    });

    it("should handle empty user orgs list", (done: DoneFn) => {
      spectator.service.fetchUserOrgs().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const op = controller.expectOne(UserOrganisationsDocument);
      op.flush({
        data: {
          userOrgs: [],
        },
      });
    });
  });
});
