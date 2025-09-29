import { getLiveStats } from "./feedMonitoringFunctions";
import * as feedMonitoringLib from "../lib/feedMonitoring";
import dayjs from "dayjs";
import { GraphQLResolveInfo } from "graphql";
import { RequestContext } from "../types/extra";
import { FeedMonitoringType, LiveStatsType } from "../types/generated";

jest.spyOn(feedMonitoringLib, "getVehicleCounts").mockImplementation(jest.fn());

describe("getLiveStats", () => {
  let context: RequestContext;
  let parent: FeedMonitoringType;

  beforeEach(() => {
    jest.clearAllMocks();
    context = {
      kysely: {} as never,
    } as unknown as RequestContext;
    parent = {
      operatorId: "OP1",
      liveStats: { updateFrequency: 5, operatorId: "OP1" },
    };
  });

  it("calls getVehicleCounts 20 times", async () => {
    // Arrange
    const mockVehicleCounts = [
      [{ actual: 10, expected: 12 }],
      [{ actual: 11, expected: 13 }],
      [{ actual: 12, expected: 14 }],
      [{ actual: 13, expected: 15 }],
      [{ actual: 14, expected: 16 }],
      [{ actual: 15, expected: 17 }],
      [{ actual: 16, expected: 18 }],
    ];
    (feedMonitoringLib.getVehicleCounts as jest.Mock).mockImplementation(
      (_kysely, _operatorId, _start, _end) => {
        // Return a different mock for each call
        return Promise.resolve(mockVehicleCounts.shift() ?? []);
      },
    );

    // Simulate info for a week duration
    const info = {
      operation: {
        name: { value: "operatorLiveStatus" },
      },
      duration: "week",
    };

    if (typeof getLiveStats === "function") {
      await getLiveStats(
        parent,
        {},
        context,
        info as unknown as GraphQLResolveInfo,
      );
    }
    // Assert
    expect(feedMonitoringLib.getVehicleCounts).toHaveBeenCalledTimes(20);

    const lastCall = (feedMonitoringLib.getVehicleCounts as jest.Mock).mock
      .calls[19] as unknown[];
    const firstCall = (feedMonitoringLib.getVehicleCounts as jest.Mock).mock
      .calls[0] as unknown[];

    const endTimeRange = dayjs(firstCall[3] as Date);
    const currentTime = dayjs().startOf("minute");
    const inputStart = dayjs(lastCall[2] as string);
    //const end = dayjs(lastCall[3]);
    const startTime = dayjs().subtract(20, "minute").startOf("minute");

    // Check that the last call was for 20 minutes ago
    // Allowing a few seconds difference for test execution time
    expect(startTime.diff(inputStart, "second")).toBeCloseTo(0); // or adjust if your code uses a different interval
    expect(endTimeRange.diff(currentTime, "second")).toBeCloseTo(0);
  });

  it("returns sorted last20Minutes array by timestamp", async () => {
    (feedMonitoringLib.getVehicleCounts as jest.Mock).mockResolvedValue([
      { actual: 10, expected: 12 },
    ]);

    const info = {
      operation: {
        name: { value: "operatorLiveStatus" },
      },
    };

    let result: Partial<LiveStatsType> | null = null;
    if (typeof getLiveStats === "function") {
      result = await getLiveStats(
        parent,
        {},
        context,
        info as unknown as GraphQLResolveInfo,
      );
    }
    // Assert
    expect(result?.last20Minutes).toBeDefined();
    const timestamps = result?.last20Minutes?.map((v) => v.timestamp);
    const sorted = timestamps
      ? [...timestamps].sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        )
      : [];
    expect(timestamps).toEqual(sorted);
  });
});
