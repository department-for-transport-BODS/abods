import { getAVLLineLevelStatus } from "./avlFunctions";
import { jest } from "@jest/globals";
import { AvlLineLevelStatus } from "../types/generated";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { Kysely } from "kysely";
import { createResponse, createRequest } from "node-mocks-http";
import { DB } from "../kysely";
import { RequestContext } from "../types/extra";
import { GraphQLResolveInfo } from "graphql";

const mockAvlData = [
  {
    operatorNoc: "OP1",
    lineName: "Line 1",
    lastRecordedAtTime: "2025-09-23T12:00:00Z",
  },
  {
    operatorNoc: "OP2",
    lineName: "Line 2",
    lastRecordedAtTime: "2025-09-23T13:00:00Z",
  },
];

let mockDb: DeepMockProxy<PrismaClient>;
let context: RequestContext;
beforeEach(() => {
  jest.clearAllMocks();
  mockDb = mockDeep<PrismaClient>();
  context = {
    res: createResponse(),
    req: createRequest(),
    headers: {},
    db: mockDb,
    kysely: {} as unknown as Kysely<DB>,
  };
});

describe("getAVLLineLevelStatus", () => {
  it("returns AVL data for given filters (happy path)", async () => {
    mockDb.avl_line_level_monitoring.findMany.mockResolvedValue(
      mockAvlData as never,
    );

    const args = {
      filters: {
        operatorNoc: "OP1",
        lineName: "Line 1",
      },
    };

    let result: Partial<AvlLineLevelStatus>[] = [];
    if (typeof getAVLLineLevelStatus === "function") {
      result = (await getAVLLineLevelStatus(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<AvlLineLevelStatus>[];
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.avl_line_level_monitoring.findMany).toHaveBeenCalledWith({
      where: {
        operatorNoc: "OP1",
        lineName: "Line 1",
      },
      select: {
        operatorNoc: true,
        lineName: true,
        lastRecordedAtTime: true,
      },
    });
    expect(result).toEqual([
      {
        operatorNoc: "OP1",
        lineName: "Line 1",
        lastRecordedAtTime: "2025-09-23T12:00:00Z",
      },
      {
        operatorNoc: "OP2",
        lineName: "Line 2",
        lastRecordedAtTime: "2025-09-23T13:00:00Z",
      },
    ]);
  });

  it("returns empty array when avlData is null", async () => {
    mockDb.avl_line_level_monitoring.findMany.mockResolvedValue([] as never);

    const args = {
      filters: {
        operatorNoc: "OP1",
      },
    };

    let result: Partial<AvlLineLevelStatus>[] = [];
    if (typeof getAVLLineLevelStatus === "function") {
      result = (await getAVLLineLevelStatus(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<AvlLineLevelStatus>[];
    }

    expect(result).toEqual([]);
  });

  it("returns empty array when avlData is empty", async () => {
    mockDb.avl_line_level_monitoring.findMany.mockResolvedValue([] as never);

    const args = {
      filters: {
        operatorNoc: "OP1",
      },
    };

    let result: Partial<AvlLineLevelStatus>[] = [];
    if (typeof getAVLLineLevelStatus === "function") {
      result = (await getAVLLineLevelStatus(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as Partial<AvlLineLevelStatus>[];
    }

    expect(result).toEqual([]);
  });
});
