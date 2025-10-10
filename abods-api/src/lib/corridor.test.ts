import { insertCorridorStops } from "./corridor";
import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";

let mockDb: DeepMockProxy<PrismaClient>;

beforeEach(() => {
  jest.clearAllMocks();
  mockDb = mockDeep<PrismaClient>();
});

describe("insertCorridorStops", () => {
  it("inserts corridor stops with correct data", async () => {
    mockDb.corridor_stops.createMany.mockResolvedValue({ count: 2 } as never);

    const corridorId = 42;
    const stopIds = ["101", "102"];

    await insertCorridorStops(corridorId, stopIds, mockDb);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.corridor_stops.createMany).toHaveBeenCalledWith({
      data: [
        { corridor_id: 42, corridor_index: 0, stop_id: 101 },
        { corridor_id: 42, corridor_index: 1, stop_id: 102 },
      ],
    });
  });

  it("handles empty stopIds array", async () => {
    mockDb.corridor_stops.createMany.mockResolvedValue({ count: 0 } as never);

    const corridorId = 42;
    const stopIds: string[] = [];

    await insertCorridorStops(corridorId, stopIds, mockDb);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.corridor_stops.createMany).toHaveBeenCalledWith({
      data: [],
    });
  });

  it("converts stopIds to numbers and indexes correctly", async () => {
    mockDb.corridor_stops.createMany.mockResolvedValue({ count: 3 } as never);

    const corridorId = 99;
    const stopIds = ["201", "202", "203"];

    await insertCorridorStops(corridorId, stopIds, mockDb);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDb.corridor_stops.createMany).toHaveBeenCalledWith({
      data: [
        { corridor_id: 99, corridor_index: 0, stop_id: 201 },
        { corridor_id: 99, corridor_index: 1, stop_id: 202 },
        { corridor_id: 99, corridor_index: 2, stop_id: 203 },
      ],
    });
  });
});
