import { PrismaClient } from "@prisma/client";
import {
  StartedPostgreSqlContainer,
  PostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Kysely } from "kysely";
import { DB } from "../../kysely";
import {
  connectKysely,
  connectPrisma,
  createCorridorTablesAndData,
  createNaptanTablesAndData,
  createOperatorsAndServiceDetails,
  createRouteTablesAndData,
  createTimetableTablesAndData,
  createUserTablesAndData,
  getContext,
  getSingleResultData,
  setEnvVariables,
} from "../../lib/testUtils";
import { ApolloServer } from "@apollo/server";
import logger from "../../logger";
import { CorridorStatsType, MatchType } from "../../types/generated";
import resolvers from "..";
import { typeDefs } from "../..";

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
    createUserTablesAndData(kysely),
    createCorridorTablesAndData(kysely),
    createNaptanTablesAndData(kysely),
    createRouteTablesAndData(kysely),
    createTimetableTablesAndData(kysely),
    createOperatorsAndServiceDetails(kysely),
  ]);

  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("Corridor stats resolver integration", () => {
  it("Should return summaryStats for corridorStats query", async () => {
    const query = `
      query corridorStats($params: CorridorStatsInputType!) {
        corridor {
          stats(inputs: $params) {
            summaryStats {
              totalTransits
              numberOfServices
              averageTransitTime
              scheduledTransits
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
      params: {
        corridorId: "1",
        fromTimestamp: "2025-10-17T00:00:00Z",
        toTimestamp: "2025-10-18T00:00:00Z",
        stopList: ["12345", "12346"],
        granularity: "day",
        matchType: MatchType.Evidenced,
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { stats: CorridorStatsType };
    }>(response);

    expect(data?.corridor?.stats?.summaryStats).toBeDefined();
    expect(data?.corridor?.stats?.summaryStats?.scheduledTransits).toEqual(1);
    expect(data?.corridor?.stats?.summaryStats?.numberOfServices).toEqual(1);
    expect(data?.corridor?.stats?.summaryStats?.averageTransitTime).toEqual(
      300,
    );
  });

  it("Should return transitTimeStats for corridorStats query", async () => {
    const query = `
      query corridorStats($params: CorridorStatsInputType!) {
        corridor {
          stats(inputs: $params) {
            transitTimeStats {
              ts
              minTransitTime
              maxTransitTime
              avgTransitTime
              percentile25
              percentile75
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
      params: {
        corridorId: "1",
        fromTimestamp: "2025-10-17T00:00:00Z",
        toTimestamp: "2025-10-18T00:00:00Z",
        stopList: ["12345", "12346"],
        granularity: "day",
        matchType: MatchType.Evidenced,
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { stats: CorridorStatsType };
    }>(response);

    expect(data?.corridor?.stats?.transitTimeStats).toBeDefined();
    expect(Array.isArray(data?.corridor?.stats?.transitTimeStats)).toBe(true);
    expect(data?.corridor?.stats?.transitTimeStats.length).toBeGreaterThan(0);
    expect(
      data?.corridor?.stats?.transitTimeStats[0].minTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeStats[0].maxTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeStats[0].avgTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeStats[0].percentile25,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeStats[0].percentile75,
    ).toBeDefined();
  });

  it("Should return transitTimeTimeOfDayStats for corridorStats query", async () => {
    const query = `
    query corridorStats($params: CorridorStatsInputType!) {
      corridor {
        stats(inputs: $params) {
          transitTimeTimeOfDayStats {
            hour
            minTransitTime
            maxTransitTime
            avgTransitTime
            percentile25
            percentile75
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
      params: {
        corridorId: "1",
        fromTimestamp: "2025-10-17T00:00:00Z",
        toTimestamp: "2025-10-18T00:00:00Z",
        stopList: ["12345", "12346"],
        granularity: "day",
        matchType: MatchType.Evidenced,
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { stats: CorridorStatsType };
    }>(response);

    expect(data?.corridor?.stats?.transitTimeTimeOfDayStats).toBeDefined();
    expect(
      Array.isArray(data?.corridor?.stats?.transitTimeTimeOfDayStats),
    ).toBe(true);
    expect(
      data?.corridor?.stats?.transitTimeTimeOfDayStats.length,
    ).toBeGreaterThan(0);
    expect(data?.corridor?.stats?.transitTimeTimeOfDayStats[0].hour).toEqual(9);
    expect(
      data?.corridor?.stats?.transitTimeTimeOfDayStats[0].minTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeTimeOfDayStats[0].maxTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeTimeOfDayStats[0].avgTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeTimeOfDayStats[0].percentile25,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeTimeOfDayStats[0].percentile75,
    ).toBeDefined();
  });

  it("Should return transitTimeDayOfWeekStats for corridorStats query", async () => {
    const query = `
    query corridorStats($params: CorridorStatsInputType!) {
      corridor {
        stats(inputs: $params) {
          transitTimeDayOfWeekStats {
            dow
            minTransitTime
            maxTransitTime
            avgTransitTime
            percentile25
            percentile75
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
      params: {
        corridorId: "1",
        fromTimestamp: "2025-10-17T00:00:00Z",
        toTimestamp: "2025-10-18T00:00:00Z",
        stopList: ["12345", "12346"],
        granularity: "day",
        matchType: MatchType.Evidenced,
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { stats: CorridorStatsType };
    }>(response);

    expect(data?.corridor?.stats?.transitTimeDayOfWeekStats).toBeDefined();
    expect(
      Array.isArray(data?.corridor?.stats?.transitTimeDayOfWeekStats),
    ).toBe(true);
    expect(
      data?.corridor?.stats?.transitTimeDayOfWeekStats.length,
    ).toBeGreaterThan(0);
    expect(
      data?.corridor?.stats?.transitTimeDayOfWeekStats.length,
    ).toBeGreaterThan(0);
    expect(data?.corridor?.stats?.transitTimeDayOfWeekStats[0].dow).toEqual(5);
    expect(
      data?.corridor?.stats?.transitTimeDayOfWeekStats[0].minTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeDayOfWeekStats[0].maxTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeDayOfWeekStats[0].avgTransitTime,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeDayOfWeekStats[0].percentile25,
    ).toBeDefined();
    expect(
      data?.corridor?.stats?.transitTimeDayOfWeekStats[0].percentile75,
    ).toBeDefined();
  });

  it("Should return transitTimePerServiceStats for corridorStats query", async () => {
    const query = `
    query corridorStats($params: CorridorStatsInputType!) {
      corridor {
        stats(inputs: $params) {
          transitTimePerServiceStats {
            lineName
            servicePatternName
            noc
            operatorName
            totalTransitTime
            recordedTransits
            scheduledTransits
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
      params: {
        corridorId: "1",
        fromTimestamp: "2025-10-17T00:00:00Z",
        toTimestamp: "2025-10-18T00:00:00Z",
        stopList: ["12345", "12346"],
        granularity: "day",
        matchType: MatchType.Evidenced,
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { stats: CorridorStatsType };
    }>(response);

    expect(data?.corridor?.stats?.transitTimePerServiceStats).toBeDefined();
    expect(
      Array.isArray(data?.corridor?.stats?.transitTimePerServiceStats),
    ).toBe(true);
    expect(
      data?.corridor?.stats?.transitTimePerServiceStats.length,
    ).toBeGreaterThan(0);
    expect(
      data?.corridor?.stats?.transitTimePerServiceStats[0].lineName,
    ).toEqual("L1");
    expect(
      data?.corridor?.stats?.transitTimePerServiceStats[0].servicePatternName,
    ).toEqual("Operator One");
    expect(data?.corridor?.stats?.transitTimePerServiceStats[0].noc).toEqual(
      "OP1",
    );
    expect(
      data?.corridor?.stats?.transitTimePerServiceStats[0].operatorName,
    ).toEqual("Operator One");
    expect(
      data?.corridor?.stats?.transitTimePerServiceStats[0].totalTransitTime,
    ).toEqual(300);
    expect(
      data?.corridor?.stats?.transitTimePerServiceStats[0].recordedTransits,
    ).toEqual(1);
    expect(
      data?.corridor?.stats?.transitTimePerServiceStats[0].scheduledTransits,
    ).toEqual(1);
  });

  it("Should return transitTimeHistogram for corridorStats query", async () => {
    const query = `
    query corridorStats($params: CorridorStatsInputType!) {
      corridor {
        stats(inputs: $params) {
          transitTimeHistogram {
            ts
            hist {
              bin
              freq
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
      params: {
        corridorId: "1",
        fromTimestamp: "2025-10-17T00:00:00Z",
        toTimestamp: "2025-10-18T00:00:00Z",
        stopList: ["12345", "12346"],
        granularity: "day",
        matchType: MatchType.Evidenced,
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { stats: CorridorStatsType };
    }>(response);

    expect(data?.corridor?.stats?.transitTimeHistogram).toBeDefined();
    expect(Array.isArray(data?.corridor?.stats?.transitTimeHistogram)).toBe(
      true,
    );
    expect(data?.corridor?.stats?.transitTimeHistogram.length).toBeGreaterThan(
      0,
    );
    expect(
      Array.isArray(data?.corridor?.stats?.transitTimeHistogram[0]?.hist),
    ).toBe(true);
    expect(data?.corridor?.stats?.transitTimeHistogram[0]?.hist[0].bin).toEqual(
      5,
    );
    expect(
      data?.corridor?.stats?.transitTimeHistogram[0]?.hist[0].freq,
    ).toEqual(1);
  });

  it("Should return serviceLinks for corridorStats query", async () => {
    const query = `
    query corridorStats($params: CorridorStatsInputType!) {
      corridor {
        stats(inputs: $params) {
          serviceLinks {
            fromStop
            toStop
            distance
            routeValidity
            linkRoute
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
      params: {
        corridorId: "1",
        fromTimestamp: "2025-10-17T00:00:00Z",
        toTimestamp: "2025-10-18T00:00:00Z",
        stopList: ["12345", "12346"],
        granularity: "day",
        matchType: MatchType.Evidenced,
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { stats: CorridorStatsType };
    }>(response);

    expect(data?.corridor?.stats?.serviceLinks).toBeDefined();
    expect(Array.isArray(data?.corridor?.stats?.serviceLinks)).toBe(true);
    expect(data?.corridor?.stats?.serviceLinks.length).toBeGreaterThan(0);
    expect(data?.corridor?.stats?.serviceLinks.length).toBeGreaterThan(0);
    expect(data?.corridor?.stats?.serviceLinks[0].fromStop).toEqual("12345");
    expect(data?.corridor?.stats?.serviceLinks[0].toStop).toEqual("12346");
    expect(data?.corridor?.stats?.serviceLinks[0].distance).toEqual(1000);
    expect(data?.corridor?.stats?.serviceLinks[0].routeValidity).toEqual(
      "VALID",
    );
    expect(data?.corridor?.stats?.serviceLinks[0].linkRoute).toEqual(
      "[[-0.12345,51.54321],[-0.12345,51.54321]]",
    );
  });
});
