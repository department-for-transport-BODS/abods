import { createCorridor, deleteCorridor, updateCorridor } from "./mutation";
import { jest } from "@jest/globals";
import { MutationResponseType } from "../../types/generated";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { createRequest, createResponse } from "node-mocks-http";
import { RequestContext } from "../../types/extra";
import { GraphQLResolveInfo } from "graphql";
import * as corridorLib from "../../lib/corridor";

const mockUser = { id: 1, orgs: [{ id: 10 }] };

jest.mock("../../resolvers/helpers", () => ({
  requireUserSession: jest.fn(() => Promise.resolve(mockUser)),
}));

jest.mock("../../lib/corridor", () => {
  const actual = jest.requireActual("../../lib/corridor");
  return {
    ...(actual as Record<string, unknown>),
    insertCorridorStops: jest.fn(),
    updateCorridorDb: jest.fn(),
    deleteCorridorDb: jest.fn(),
    deleteCorridorStops: jest.fn(),
    isCorridorMappedToUserOrg: jest.fn(() => Promise.resolve(true)),
  };
});

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
    kysely: {} as never,
  };
});

describe("createCorridor", () => {
  it("creates a corridor and returns success", async () => {
    mockDb.corridor.create.mockResolvedValue({ corridor_id: 42 } as never);
    (corridorLib.insertCorridorStops as jest.Mock).mockResolvedValue(
      undefined as never,
    );

    const args = {
      payload: {
        name: "Test Corridor",
        stopIds: ["101", "102"],
      },
    };

    let result: MutationResponseType | null = null;
    if (typeof createCorridor === "function") {
      result = (await createCorridor(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as MutationResponseType;
    }

    expect(result).toEqual({ success: true });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.corridor.create).toHaveBeenCalledWith({
      data: {
        corridor_name: "Test Corridor",
        organisation_id: 10,
      },
      select: {
        corridor_id: true,
      },
    });
    expect(corridorLib.insertCorridorStops).toHaveBeenCalledWith(
      42,
      ["101", "102"],
      mockDb,
    );
  });

  it("throws error if name or stopIds missing", async () => {
    const argsMissingName = { payload: { stopIds: ["101", "102"] } };
    const argsMissingStops = { payload: { name: "Test Corridor" } };

    if (typeof createCorridor === "function") {
      await expect(
        createCorridor(
          {},
          argsMissingName as never,
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow("Bad Request");
      await expect(
        createCorridor(
          {},
          argsMissingStops as never,
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow("Bad Request");
    }
  });
});

describe("updateCorridor", () => {
  it("updates a corridor and returns success", async () => {
    (corridorLib.isCorridorMappedToUserOrg as jest.Mock).mockResolvedValue(
      true as never,
    );

    const args = {
      inputs: {
        id: 42,
        name: "Updated Corridor",
        stopList: ["101", "102"],
      },
    };

    let result: MutationResponseType | null = null;
    if (typeof updateCorridor === "function") {
      result = (await updateCorridor(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as MutationResponseType;
    }

    expect(result).toEqual({ success: true });
    expect(corridorLib.isCorridorMappedToUserOrg).toHaveBeenCalledWith(
      42,
      mockUser,
      mockDb,
    );
    expect(corridorLib.updateCorridorDb).toHaveBeenCalledWith(
      42,
      "Updated Corridor",
      mockDb,
    );
    expect(corridorLib.deleteCorridorStops).toHaveBeenCalledWith(42, mockDb);
    expect(corridorLib.insertCorridorStops).toHaveBeenCalledWith(
      42,
      ["101", "102"],
      mockDb,
    );
  });

  it("throws error if inputs are missing", async () => {
    const args = {};

    if (typeof updateCorridor === "function") {
      await expect(
        updateCorridor({}, args as never, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow("Bad Request");
    }
  });

  it("throws error if corridor is not mapped to user org", async () => {
    (corridorLib.isCorridorMappedToUserOrg as jest.Mock).mockResolvedValue(
      false as never,
    );

    const args = {
      inputs: {
        id: 42,
        name: "Updated Corridor",
        stopList: ["101", "102"],
      },
    };

    if (typeof updateCorridor === "function") {
      await expect(
        updateCorridor({}, args, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow("Not Authorized");
    }
  });

  it("throws error if id, name, or stopList missing", async () => {
    (corridorLib.isCorridorMappedToUserOrg as jest.Mock).mockResolvedValue(
      true as never,
    );

    const argsMissingId = { inputs: { name: "Name", stopList: ["101"] } };
    const argsMissingName = { inputs: { id: 42, stopList: ["101"] } };
    const argsMissingStops = { inputs: { id: 42, name: "Name" } };

    if (typeof updateCorridor === "function") {
      await expect(
        updateCorridor(
          {},
          argsMissingId as never,
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow("Bad Request");
      await expect(
        updateCorridor(
          {},
          argsMissingName as never,
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow("Bad Request");
      await expect(
        updateCorridor(
          {},
          argsMissingStops as never,
          context,
          {} as GraphQLResolveInfo,
        ),
      ).rejects.toThrow("Bad Request");
    }
  });
});

describe("deleteCorridor", () => {
  it("deletes a corridor and returns success", async () => {
    (corridorLib.isCorridorMappedToUserOrg as jest.Mock).mockResolvedValue(
      true as never,
    );

    const args = { corridorId: 42 };

    let result: MutationResponseType | null = null;
    if (typeof deleteCorridor === "function") {
      result = (await deleteCorridor(
        {},
        args,
        context,
        {} as GraphQLResolveInfo,
      )) as MutationResponseType;
    }

    expect(result).toEqual({ success: true });
    expect(corridorLib.isCorridorMappedToUserOrg).toHaveBeenCalledWith(
      42,
      mockUser,
      mockDb,
    );
    expect(corridorLib.deleteCorridorDb).toHaveBeenCalledWith(42, mockDb);
    expect(corridorLib.deleteCorridorStops).toHaveBeenCalledWith(42, mockDb);
  });

  it("throws error if corridorId is missing", async () => {
    const args = {};

    if (typeof deleteCorridor === "function") {
      await expect(
        deleteCorridor({}, args as never, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow("Bad Request");
    }
  });

  it("throws error if corridor is not mapped to user org", async () => {
    (corridorLib.isCorridorMappedToUserOrg as jest.Mock).mockResolvedValue(
      false as never,
    );

    const args = { corridorId: 42 };

    if (typeof deleteCorridor === "function") {
      await expect(
        deleteCorridor({}, args, context, {} as GraphQLResolveInfo),
      ).rejects.toThrow("Not Authorized");
    }
  });
});
