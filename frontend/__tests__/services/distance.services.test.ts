import { distanceService } from "@/services/distances/distance.services";
import {
  AdminOrgListDocument,
  DistancesDropdownInputDocument,
  DistancesListDocument,
  OrgOperatorListDocument,
} from "@/src/generated/graphql";

const mockQuery = vi.fn();

vi.mock("@/services/apolloClient", () => ({
  apolloClient: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

describe("distanceService", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("fetchOrgOperators", () => {
    it("should fetch operators for a given organisation", async () => {
      const orgId = 123;
      const mockOperators = [
        { nocCode: "OP001", name: "Operator 1" },
        { nocCode: "OP002", name: "Operator 2" },
      ];

      mockQuery.mockResolvedValue({ data: { operators: mockOperators } });

      const result = await distanceService.fetchOrgOperators(orgId);

      expect(mockQuery).toHaveBeenCalledWith({
        query: OrgOperatorListDocument,
        variables: { orgId },
      });
      expect(result).toEqual(mockOperators);
    });

    it("should return an empty array when operators is null", async () => {
      mockQuery.mockResolvedValue({ data: { operators: null } });

      const result = await distanceService.fetchOrgOperators(1);

      expect(result).toEqual([]);
    });

    it("should return an empty array when the query throws", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await distanceService.fetchOrgOperators(1);

      expect(result).toEqual([]);
    });
  });

  describe("fetchDistances", () => {
    const filterBy = {
      fromTimestamp: "2024-01-01",
      toTimestamp: "2024-01-31",
      operatorIds: ["OP001"],
    };

    it("should fetch distances with filter parameters", async () => {
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

      mockQuery.mockResolvedValue({ data: { distances: mockDistances } });

      const result = await distanceService.fetchDistances(filterBy);

      expect(mockQuery).toHaveBeenCalledWith({
        query: DistancesListDocument,
        variables: { filterBy },
      });
      expect(result).toEqual(mockDistances);
    });

    it("should return an empty array when distances is null", async () => {
      mockQuery.mockResolvedValue({ data: { distances: null } });

      const result = await distanceService.fetchDistances(filterBy);

      expect(result).toEqual([]);
    });

    it("should return an empty array when the query throws", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await distanceService.fetchDistances(filterBy);

      expect(result).toEqual([]);
    });
  });

  describe("fetchDropdownInputs", () => {
    it("should fetch distances dropdown options", async () => {
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

      mockQuery.mockResolvedValue({
        data: { distancesDropdowns: mockDropdowns },
      });

      const result = await distanceService.fetchDropdownInputs();

      expect(mockQuery).toHaveBeenCalledWith({
        query: DistancesDropdownInputDocument,
      });
      expect(result).toEqual(mockDropdowns);
    });

    it("should return a default empty operators object when distancesDropdowns is null", async () => {
      mockQuery.mockResolvedValue({ data: { distancesDropdowns: null } });

      const result = await distanceService.fetchDropdownInputs();

      expect(result).toEqual({ operators: [] });
    });

    it("should return a default empty operators object when the query throws", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await distanceService.fetchDropdownInputs();

      expect(result).toEqual({ operators: [] });
    });
  });

  describe("fetchAdminOrg", () => {
    it("should fetch admin organisation list", async () => {
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

      mockQuery.mockResolvedValue({ data: { adminOrgMap: mockAdminOrgMap } });

      const result = await distanceService.fetchAdminOrg();

      expect(mockQuery).toHaveBeenCalledWith({
        query: AdminOrgListDocument,
      });
      expect(result).toEqual(mockAdminOrgMap);
    });

    it("should return an empty array when adminOrgMap is null", async () => {
      mockQuery.mockResolvedValue({ data: { adminOrgMap: null } });

      const result = await distanceService.fetchAdminOrg();

      expect(result).toEqual([]);
    });

    it("should return an empty array when the query throws", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      const result = await distanceService.fetchAdminOrg();

      expect(result).toEqual([]);
    });
  });
});
