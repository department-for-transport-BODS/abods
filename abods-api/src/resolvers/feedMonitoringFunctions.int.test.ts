import { PrismaClient } from "@prisma/client";
import {
  StartedPostgreSqlContainer,
  PostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Kysely } from "kysely";
import { DB } from "../kysely";
import {
  setEnvVariables,
  connectKysely,
  createUserTablesAndData,
  createOperatorsAndServiceDetails,
  createFrequentSummariesTableAndData,
  createExpectedTablesAndData,
  createNaptanTablesAndData,
  connectPrisma,
  createTimetableTablesAndData,
  getContext,
  getSingleResultData,
  createFeedMonitoringTablesAndData,
} from "../lib/test/utils";
import { ApolloServer } from "@apollo/server";
import { typeDefs } from "..";
import resolvers from ".";
import logger from "../logger";
import {
  HistoricalStatsType,
  OperatorFeedMonitoring,
  VehicleStatsType,
} from "../types/generated";
import dayjs from "dayjs";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let kysely: Kysely<DB>;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgis/postgis:16-3.4")
    .withDatabase("testdb")
    .withUsername("testuser")
    .withPassword("testpass")
    .start();

  setEnvVariables(container);
  kysely = await connectKysely(kysely);
  await Promise.all([
    createFeedMonitoringTablesAndData(kysely),
    createUserTablesAndData(kysely),
    createOperatorsAndServiceDetails(kysely),
    createTimetableTablesAndData(kysely),
    createExpectedTablesAndData(kysely),
    createNaptanTablesAndData(kysely),
    createFrequentSummariesTableAndData(kysely),
  ]);

  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("FeedMonitoring queries", () => {
  it.skip("Should return dashboard vehicle counts for an operator", async () => {
    const query = `
      query dashboardOperatorVehicleCountsList($operatorId: String) {
        dashboardVehicles(operatorId: $operatorId) {
          operatorId
          expected
          actual
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = {
      operatorId: "OP1",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      dashboardVehicles: {
        operatorId: string;
        expected: number;
        actual: number;
      }[];
    }>(response);

    expect(data?.dashboardVehicles).toBeDefined();
    expect(data?.dashboardVehicles.length).toBeGreaterThan(0);
    const vehicle = data?.dashboardVehicles[0];
    expect(vehicle).toHaveProperty("operatorId");
    expect(typeof vehicle?.expected).toBe("number");
    expect(typeof vehicle?.actual).toBe("number");
  });

  it.skip("Should return operatorFeedMonitoring details for an operator", async () => {
    const query = `
    query operatorFeedMonitoring($operatorId: String!) {
      operatorFeedMonitoring(operatorId: $operatorId) {
        name
        nocCode
        operatorId
        feedMonitoring {
          feedStatus
          availability
          lastOutage
          unavailableSince
          liveStats {
            updateFrequency
            currentVehicles
            expectedVehicles
            last24Hours {
              actual
              expected
              timestamp
            }
          }
        }
      }
    }
  `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = {
      operatorId: "OP1",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      operatorFeedMonitoring: OperatorFeedMonitoring;
    }>(response);

    expect(data?.operatorFeedMonitoring).toBeDefined();
    expect(data?.operatorFeedMonitoring.name).toBe("Operator One");
    expect(data?.operatorFeedMonitoring.nocCode).toBe("OP1");
    expect(data?.operatorFeedMonitoring.operatorId).toBe("OP1");
    expect(data?.operatorFeedMonitoring.feedMonitoring).toBeDefined();
    expect(
      typeof data?.operatorFeedMonitoring?.feedMonitoring?.feedStatus,
    ).toBe("boolean");
    expect(
      typeof data?.operatorFeedMonitoring?.feedMonitoring?.availability,
    ).toBe("number");
    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.liveStats,
    ).toBeDefined();
    expect(
      typeof data?.operatorFeedMonitoring?.feedMonitoring?.liveStats
        ?.updateFrequency,
    ).toBe("number");
    expect(
      typeof data?.operatorFeedMonitoring?.feedMonitoring?.liveStats
        ?.currentVehicles,
    ).toBe("number");
    expect(
      typeof data?.operatorFeedMonitoring?.feedMonitoring?.liveStats
        ?.expectedVehicles,
    ).toBe("number");
    expect(
      Array.isArray(
        data?.operatorFeedMonitoring?.feedMonitoring?.liveStats?.last24Hours,
      ),
    ).toBe(true);
  });

  it("Should return last20Minutes AVL points for operatorLiveStatus", async () => {
    const operatorId = "OP1";
    const now = new Date();
    const startTime = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes ago
    const endTime = now;

    await kysely
      .insertInto("expected_journeys")
      .values({
        date_of_journey: startTime,
        operator_noc: operatorId,
        line_name: "L1",
        noc_and_line_and_servicecode: "OP1-L1-SC1",
        journey_code: "JCODE1",
        group_id: "G1",
        stop_count: 2,
        expected_journey_start: startTime,
        journey_pattern_description: "Main Street to Another Street",
        vehicle_journey_id: 101,
        day_of_week: 5,
        admin_area_id: [10],
        expected_journey_end: endTime,
        direction: "outbound",
        is_cancelled: false,
      })
      .execute();

    await kysely
      .insertInto("SiriVMPositions")
      .values([
        {
          siri_vm_positions_id: "1001",
          operator_ref: operatorId,
          line_name: "L1",
          journey_ref: "JCODE1",
          direction_ref: "outbound",
          date_of_journey: startTime,
          latitude: 51.54321,
          longitude: -0.12345,
          vehicle_ref: "V1",
          batch_id: "batchA",
          recorded_at_time: new Date(now.getTime() - 10 * 60 * 1000),
          response_time_stamp: new Date(now.getTime() - 10 * 60 * 1000),
          load_time_stamp: new Date(now.getTime() - 10 * 60 * 1000),
          group_id: "G1",
          origin_ref: "12345",
          destination_ref: "12346",
          departure_time: new Date("2025-10-17T08:05:00Z"),
        },
        {
          siri_vm_positions_id: "1002",
          operator_ref: operatorId,
          line_name: "L1",
          journey_ref: "JCODE1",
          direction_ref: "outbound",
          date_of_journey: startTime,
          latitude: 51.54321,
          longitude: -0.12345,
          vehicle_ref: "V1",
          batch_id: "batchA",
          recorded_at_time: new Date(now.getTime() - 5 * 60 * 1000),
          response_time_stamp: new Date(now.getTime() - 5 * 60 * 1000),
          load_time_stamp: new Date(now.getTime() - 5 * 60 * 1000),
          group_id: "G1",
          origin_ref: "12345",
          destination_ref: "12346",
          departure_time: new Date("2025-10-17T08:10:00Z"),
        },
      ])
      .execute();

    const query = `
    query operatorLiveStatus($operatorId: String!) {
      operatorFeedMonitoring(operatorId: $operatorId) {
        name
        nocCode
        operatorId
        feedMonitoring {
          feedStatus
          availability
          lastOutage
          unavailableSince
          liveStats {
            updateFrequency
            currentVehicles
            expectedVehicles
            last24Hours {
              actual
              expected
              timestamp
            }
            last20Minutes {
              actual
              expected
              timestamp
            }
          }
        }
      }
    }
  `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = { operatorId };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      operatorFeedMonitoring: {
        feedMonitoring: {
          liveStats: {
            last20Minutes: VehicleStatsType[];
          };
        };
      };
    }>(response);

    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.liveStats?.last20Minutes,
    ).toBeDefined();
    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.liveStats?.last20Minutes
        .length,
    ).toBeGreaterThan(0);

    const stat =
      data?.operatorFeedMonitoring?.feedMonitoring?.liveStats?.last20Minutes[0];

    expect(typeof stat?.actual).toBe("number");
    expect(typeof stat?.expected).toBe("number");
    expect(typeof stat?.timestamp).toBeDefined();
    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.liveStats?.last20Minutes
        .length,
    ).toBe(20);
  });

  it.skip("Should return historicalStats for an operator and date", async () => {
    const query = `
        query operatorFeedHistory($operatorId: String!, $date: Date!) {
        operatorFeedMonitoring(operatorId: $operatorId) {
            feedMonitoring {
            historicalStats(date: $date) {
                updateFrequency
                availability
            }
            }
        }
        }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = {
      operatorId: "OP1",
      date: "2025-10-17",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      operatorFeedMonitoring: {
        feedMonitoring: {
          historicalStats: HistoricalStatsType;
        };
      };
    }>(response);

    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.historicalStats,
    ).toBeDefined();
    expect(
      typeof data?.operatorFeedMonitoring?.feedMonitoring?.historicalStats
        .updateFrequency,
    ).toBe("number");
    expect(
      typeof data?.operatorFeedMonitoring?.feedMonitoring?.historicalStats
        .availability,
    ).toBe("number");
    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.historicalStats
        .updateFrequency,
    ).toBe(15);
    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.historicalStats
        .availability,
    ).toBeCloseTo(0.1);
  });

  it.skip("Should return vehicleStats by minute for an operator and time range", async () => {
    const query = `
        query operatorHistoricStats($operatorId: String!, $date: Date!, $start: DateTime!, $end: DateTime!) {
          operatorFeedMonitoring(operatorId: $operatorId) {
            ...OperatorFeedHistory
          }
        }

        fragment OperatorFeedHistory on OperatorFeedMonitoring {
          name
          nocCode
          operatorId
          feedMonitoring {
            historicalStats(date: $date) {
              updateFrequency
              availability
            }
            vehicleStats(granularity: minute, start: $start, end: $end) {
              ...VehicleStat
            }
          }
        }

        fragment VehicleStat on VehicleStatsType {
          actual
          expected
          timestamp
        }
      `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = {
      operatorId: "OP1",
      date: "2025-10-17",
      start: dayjs().startOf("day").toISOString(),
      end: dayjs().endOf("day").toISOString(),
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      operatorFeedMonitoring: {
        name: string;
        nocCode: string;
        operatorId: string;
        feedMonitoring: {
          historicalStats: {
            updateFrequency: number;
            availability: number;
          };
          vehicleStats: VehicleStatsType[];
        };
      };
    }>(response);

    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.vehicleStats,
    ).toBeDefined();
    expect(
      Array.isArray(data?.operatorFeedMonitoring?.feedMonitoring?.vehicleStats),
    ).toBe(true);
    expect(
      data?.operatorFeedMonitoring?.feedMonitoring?.vehicleStats.length,
    ).toBeGreaterThan(0);

    const stat = data?.operatorFeedMonitoring?.feedMonitoring?.vehicleStats[0];
    expect(typeof stat?.actual).toBe("number");
    expect(typeof stat?.expected).toBe("number");
    expect(typeof stat?.timestamp).toBeDefined();
  });
});
