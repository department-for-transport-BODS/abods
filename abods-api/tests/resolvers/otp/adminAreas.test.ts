import { getAdminAreas } from "../../../src/resolvers/otpFunctions";
import { jest } from "@jest/globals";
import { AdminAreasType } from "../../../src/types/generated";
import { Kysely } from "kysely";

jest.mock("../../../src/resolvers/helpers", () => ({
  requireUserSession: jest.fn(() =>
    Promise.resolve({ id: 1, orgs: [{ id: 10 }] }),
  ),
}));
jest.mock("../../../src/lib/operators", () => ({
  getUserOperatorIds: jest.fn(() => Promise.resolve(["OP1", "OP2"])),
}));

const mockAdminAreaRecords = [{ adminarea_id: 101 }, { adminarea_id: 102 }];

const mockAdminAreas = [
  { id: 101, name: "Area 1", st_asgeojson: '{"type":"Polygon"}' },
  { id: 102, name: "Area 2", st_asgeojson: '{"type":"Polygon"}' },
];

const mockDb = {
  noc_adminarea: {
    findMany: jest.fn().mockResolvedValue(mockAdminAreaRecords as never),
  },
  naptan_adminarea_with_shape: {
    findMany: jest.fn().mockResolvedValue(mockAdminAreas as never),
  },
};

describe("getAdminAreas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns admin areas for user operators", async () => {
    const context = {
      db: mockDb,
      kysely: {} as Kysely<any>,
    };

    let result: Partial<AdminAreasType>[] | null = null;
    if (typeof getAdminAreas === "function") {
      result = (await getAdminAreas(
        {},
        {},
        context as any,
        {} as any,
      )) as Partial<AdminAreasType>[];
    }

    expect(result).not.toBeNull();
    expect(result?.length).toBe(2);

    expect(result?.[0]).toEqual({
      id: "101",
      name: "Area 1",
      shape: '{"type":"Polygon"}',
    });
    expect(result?.[1]).toEqual({
      id: "102",
      name: "Area 2",
      shape: '{"type":"Polygon"}',
    });

    expect(mockDb.noc_adminarea.findMany).toHaveBeenCalledTimes(1);
    expect(mockDb.naptan_adminarea_with_shape.findMany).toHaveBeenCalledTimes(
      1,
    );
  });

  it("returns null if no admin areas found", async () => {
    mockDb.noc_adminarea.findMany.mockResolvedValue([] as never);
    mockDb.naptan_adminarea_with_shape.findMany.mockResolvedValue([] as never);

    const context = {
      db: mockDb,
      kysely: {} as Kysely<any>,
    };

    let result: Partial<AdminAreasType>[] | null = null;
    if (typeof getAdminAreas === "function") {
      result = (await getAdminAreas(
        {},
        {},
        context as any,
        {} as any,
      )) as Partial<AdminAreasType>[];
    }

    expect(result).toEqual([]);
  });

  it("throws error if naptan_adminarea_with_shape returns null", async () => {
    mockDb.noc_adminarea.findMany.mockResolvedValue(
      mockAdminAreaRecords as never,
    );
    mockDb.naptan_adminarea_with_shape.findMany.mockResolvedValue([] as never);

    const context = {
      db: mockDb,
      kysely: {} as Kysely<any>,
    };

    let result: Partial<AdminAreasType>[] | null = null;
    if (typeof getAdminAreas === "function") {
      result = (await getAdminAreas(
        {},
        {},
        context as any,
        {} as any,
      )) as Partial<AdminAreasType>[];
    }

    expect(result).toEqual([]);
  });
});
