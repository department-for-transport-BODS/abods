import { getApiInfo } from "./sharedFunctions.js";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { createRequest, createResponse } from "node-mocks-http";
import { RequestContext } from "../types/extra";
import { GraphQLResolveInfo } from "graphql";
import { ApiInfoType } from "../types/generated";

let mockDb: DeepMockProxy<PrismaClient>;
let context: RequestContext;

beforeEach(() => {
  jest.clearAllMocks();
  mockDb = mockDeep<PrismaClient>();
  context = {
    db: mockDb,
    req: createRequest(),
    res: createResponse(),
    headers: {},
    kysely: {} as never,
  };
});

describe("getApiInfo", () => {
  it("returns API info from the database", async () => {
    const mockApiInfo = {
      version: "1.2.3",
      build_number: "10",
    };
    mockDb.apiInfo.findFirst.mockResolvedValue(mockApiInfo as never);

    let result: Partial<ApiInfoType> | null = null;
    if (typeof getApiInfo === "function") {
      result = await getApiInfo({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).not.toBeNull();
    expect(result).toEqual({
      version: "1.2.3",
      buildNumber: "10",
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.apiInfo.findFirst).toHaveBeenCalledTimes(1);
  });

  it("returns null if no API info is found", async () => {
    mockDb.apiInfo.findFirst.mockResolvedValue(null);

    let result: Partial<ApiInfoType> | null = null;
    if (typeof getApiInfo === "function") {
      result = await getApiInfo({}, {}, context, {} as GraphQLResolveInfo);
    }

    expect(result).toBeNull();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.apiInfo.findFirst).toHaveBeenCalledTimes(1);
  });
});
