import { PrismaClient } from "@prisma/client";
import {
  StartedPostgreSqlContainer,
  PostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Kysely } from "kysely";
import { DB } from "../../kysely";
import {
  setEnvVariables,
  connectKysely,
  createUserTablesAndData,
  createOperatorsAndServiceDetails,
  connectPrisma,
  createSummaryTablesAndData,
  createTimetableSummaryStopsTableAndData,
  createFrequentSummariesTableAndData,
  createExpectedTablesAndData,
  getContext,
  getSingleResultData,
  createNaptanTablesAndData,
} from "../../lib/test/utils";
import { ApolloServer } from "@apollo/server";
import { typeDefs } from "../..";
import resolvers from "..";
import logger from "../../logger";
import {
  DelayFrequencyType,
  OperatorPerformancePage,
  PunctualityDayOfWeekType,
  PunctualityTimeOfDayType,
  PunctualityTimeSeriesType,
  PunctualityTotalsType,
  ServicePerformanceType,
  ServicePunctualityType,
  StopPerformanceType,
} from "../../types/generated";

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
    createOperatorsAndServiceDetails(kysely),
    createSummaryTablesAndData(kysely),
    createTimetableSummaryStopsTableAndData(kysely),
    createFrequentSummariesTableAndData(kysely),
    createExpectedTablesAndData(kysely),
    createNaptanTablesAndData(kysely),
  ]);

  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("OnTimePerformance queries", () => {
  it("Should return delayFrequency buckets and frequencies", async () => {
    const query = `
      query onTimeDelayFrequency($params: PerformanceInputType!) {
        onTimePerformance {
          delayFrequency(inputs: $params) {
            bucket
            frequency
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
        filters: {
          operatorIds: ["OP1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { delayFrequency: DelayFrequencyType[] };
    }>(response);

    expect(data?.onTimePerformance?.delayFrequency).toBeDefined();
    expect(data?.onTimePerformance?.delayFrequency.length).toBeGreaterThan(0);

    // Example: check for specific bucket/frequency values
    expect(data?.onTimePerformance?.delayFrequency).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bucket: 3, frequency: 5 }),
        expect.objectContaining({ bucket: 2, frequency: 4 }),
      ]),
    );
  });

  it("Should return operatorPerformance stats for OP1", async () => {
    const query = `
      query onTimeOperatorPerformanceList($params: PerformanceInputType!) {
        onTimePerformance {
          operatorPerformance(inputs: $params) {
            pageInfo {
              totalCount
              next
            }
            items {
              nocCode
              operatorId
              name
              early
              onTime
              late
              averageDelay
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
        filters: {
          operatorIds: ["OP1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { operatorPerformance: OperatorPerformancePage };
    }>(response);

    expect(data?.onTimePerformance?.operatorPerformance).toBeDefined();
    expect(
      data?.onTimePerformance?.operatorPerformance.items.length,
    ).toBeGreaterThan(0);

    const op = data?.onTimePerformance?.operatorPerformance.items[0];
    expect(op?.nocCode).toEqual("OP1");
    expect(op?.operatorId).toEqual("OP1");
    expect(op?.name).toEqual("Operator One");
    expect(typeof op?.early).toBe("number");
    expect(typeof op?.onTime).toBe("number");
    expect(typeof op?.late).toBe("number");
    expect(typeof op?.averageDelay).toBe("number");
  });

  it("Should return punctualityDayOfWeek stats for OP1", async () => {
    const query = `
      query onTimePunctualityDayOfWeek($params: PerformanceInputType!) {
        onTimePerformance {
          punctualityDayOfWeek(inputs: $params) {
            dayOfWeek
            early
            onTime
            late
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
        filters: {
          operatorIds: ["OP1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { punctualityDayOfWeek: PunctualityDayOfWeekType[] };
    }>(response);

    expect(data?.onTimePerformance?.punctualityDayOfWeek).toBeDefined();
    expect(
      data?.onTimePerformance?.punctualityDayOfWeek.length,
    ).toBeGreaterThan(0);

    // Example: check for specific values
    const dow = data?.onTimePerformance?.punctualityDayOfWeek[0];
    expect(dow).toHaveProperty("dayOfWeek");
    expect(typeof dow?.early).toBe("number");
    expect(typeof dow?.onTime).toBe("number");
    expect(typeof dow?.late).toBe("number");
  });

  it("Should return punctualityOverview stats for OP1", async () => {
    const query = `
      query onTimeStats($params: PerformanceInputType!) {
        onTimePerformance {
          punctualityOverview(inputs: $params) {
            early
            late
            onTime
            scheduled
            completed
            averageDeviation
            incomplete
            averageDelay
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
        filters: {
          operatorIds: ["OP1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { punctualityOverview: PunctualityTotalsType };
    }>(response);

    expect(data?.onTimePerformance?.punctualityOverview).toBeDefined();
    expect(typeof data?.onTimePerformance?.punctualityOverview.early).toBe(
      "number",
    );
    expect(typeof data?.onTimePerformance?.punctualityOverview.late).toBe(
      "number",
    );
    expect(typeof data?.onTimePerformance?.punctualityOverview.onTime).toBe(
      "number",
    );
    expect(typeof data?.onTimePerformance?.punctualityOverview.scheduled).toBe(
      "number",
    );
    expect(typeof data?.onTimePerformance?.punctualityOverview.completed).toBe(
      "number",
    );
    expect(
      typeof data?.onTimePerformance?.punctualityOverview.averageDeviation,
    ).toBe("number");
    expect(typeof data?.onTimePerformance?.punctualityOverview.incomplete).toBe(
      "string",
    );
    expect(
      typeof data?.onTimePerformance?.punctualityOverview.averageDelay,
    ).toBe("number");
    // Example: check for specific values
    expect(data?.onTimePerformance?.punctualityOverview.early).toEqual(3);
    expect(data?.onTimePerformance?.punctualityOverview.late).toEqual(5);
    expect(data?.onTimePerformance?.punctualityOverview.onTime).toEqual(18);
    expect(data?.onTimePerformance?.punctualityOverview.scheduled).toEqual(26);
    expect(data?.onTimePerformance?.punctualityOverview.completed).toEqual(26);
  });

  it("Should return punctualityTimeOfDay stats for OP1", async () => {
    const query = `
      query onTimePunctualityTimeOfDay($params: PerformanceInputType!) {
        onTimePerformance {
          punctualityTimeOfDay(inputs: $params) {
            timeOfDay
            onTime
            early
            late
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
        filters: {
          operatorIds: ["OP1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { punctualityTimeOfDay: PunctualityTimeOfDayType[] };
    }>(response);

    expect(data?.onTimePerformance?.punctualityTimeOfDay).toBeDefined();
    expect(
      data?.onTimePerformance?.punctualityTimeOfDay.length,
    ).toBeGreaterThan(0);

    const tod = data?.onTimePerformance?.punctualityTimeOfDay[0];
    expect(tod).toHaveProperty("timeOfDay");
    expect(typeof tod?.onTime).toBe("number");
    expect(typeof tod?.early).toBe("number");
    expect(typeof tod?.late).toBe("number");
  });

  it("Should return punctualityTimeSeries stats for OP1", async () => {
    const query = `
      query onTimeTimeSeries($params: PerformanceInputType!) {
        onTimePerformance {
          punctualityTimeSeries(inputs: $params) {
            ts
            onTime
            early
            late
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
        filters: {
          operatorIds: ["OP1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { punctualityTimeSeries: PunctualityTimeSeriesType[] };
    }>(response);

    expect(data?.onTimePerformance?.punctualityTimeSeries).toBeDefined();
    expect(
      data?.onTimePerformance?.punctualityTimeSeries.length,
    ).toBeGreaterThan(0);

    const ts = data?.onTimePerformance?.punctualityTimeSeries[0];
    expect(ts).toHaveProperty("ts");
    expect(typeof ts?.onTime).toBe("number");
    expect(typeof ts?.early).toBe("number");
    expect(typeof ts?.late).toBe("number");
  });

  it("Should return servicePunctuality stats for OP1 (dashboardServiceRanking query)", async () => {
    const query = `
      query dashboardServiceRanking($params: ServicePerformanceInputType!, $trendFrom: DateTime!, $trendTo: DateTime!) {
        onTimePerformance {
          servicePunctuality(inputs: $params) {
            nocCode
            lineId
            lineInfo {
              serviceId
              serviceName
              serviceNumber
              __typename
            }
            onTime
            early
            late
            trend(fromTimestamp: $trendFrom, toTimestamp: $trendTo) {
              onTime
              early
              late
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
        fromTimestamp: "2025-10-15T00:00:00.000+01:00",
        toTimestamp: "2025-10-22T00:00:00.000+00:00",
        order: "descending",
        filters: {
          timingPointsOnly: true,
        },
      },
      trendFrom: "2025-10-07T00:00:00.000+01:00",
      trendTo: "2025-10-14T00:00:00.000+01:00",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { servicePunctuality: ServicePunctualityType[] };
    }>(response);

    expect(data?.onTimePerformance?.servicePunctuality).toBeDefined();
    expect(data?.onTimePerformance?.servicePunctuality.length).toBeGreaterThan(
      0,
    );

    const sp = data?.onTimePerformance?.servicePunctuality[0];
    expect(sp).toHaveProperty("lineId");
    expect(sp?.lineInfo).toHaveProperty("serviceId");
    expect(sp?.lineInfo).toHaveProperty("serviceName");
    expect(sp?.lineInfo).toHaveProperty("serviceNumber");
    expect(typeof sp?.early).toBe("number");
    expect(typeof sp?.onTime).toBe("number");
    expect(typeof sp?.late).toBe("number");
    expect(sp?.trend).toBeDefined();
    expect(typeof sp?.trend?.onTime).toBe("number");
    expect(typeof sp?.trend?.early).toBe("number");
    expect(typeof sp?.trend?.late).toBe("number");
  });

  it("Should return servicePerformance stats for OP1", async () => {
    const query = `
      query onTimeServicePerformanceList($params: PerformanceInputType!) {
        onTimePerformance {
          servicePerformance(inputs: $params) {
            lineId
            lineInfo {
              serviceId
              serviceName
              serviceNumber
            }
            early
            onTime
            late
            averageDelay
            countDelayed
            scheduledDepartures
            actualDepartures
            direction
            onTimeInSeconds
            earlyInSeconds
            lateInSeconds
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
        filters: {
          operatorIds: ["OP1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { servicePerformance: ServicePerformanceType[] };
    }>(response);

    expect(data?.onTimePerformance?.servicePerformance).toBeDefined();
    expect(data?.onTimePerformance?.servicePerformance.length).toBeGreaterThan(
      0,
    );

    const sp = data?.onTimePerformance?.servicePerformance[0];
    expect(sp).toHaveProperty("lineId");
    expect(sp?.lineInfo).toHaveProperty("serviceId");
    expect(sp?.lineInfo).toHaveProperty("serviceName");
    expect(sp?.lineInfo).toHaveProperty("serviceNumber");
    expect(typeof sp?.early).toBe("number");
    expect(typeof sp?.onTime).toBe("number");
    expect(typeof sp?.late).toBe("number");
    expect(typeof sp?.averageDelay).toBe("number");
    expect(typeof sp?.countDelayed).toBe("number");
    expect(typeof sp?.scheduledDepartures).toBe("number");
    expect(typeof sp?.actualDepartures).toBe("number");
    expect(typeof sp?.direction).toBe("string");
    expect(typeof sp?.onTimeInSeconds).toBe("number");
    expect(typeof sp?.earlyInSeconds).toBe("number");
    expect(typeof sp?.lateInSeconds).toBe("number");
  });

  it("Should return stopPerformance stats for OP1", async () => {
    const query = `
      query onTimeStopPerformanceList($params: PerformanceInputType!) {
        onTimePerformance {
          stopPerformance(inputs: $params) {
            lineId
            stopId
            stopInfo {
              stopId
              sourceId
              stopName
              stopLocation {
                latitude
                longitude
              }
              stopLocality {
                localityId
                localityName
                localityAreaId
                localityAreaName
              }
            }
            early
            onTime
            late
            averageDelay
            countDelayed
            scheduledDepartures
            actualDepartures
            timingPoint
            direction
            averageScheduled
            averageActual
            onTimeInSeconds
            earlyInSeconds
            lateInSeconds
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
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["OP1-L1-SC1"],
        },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-21T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      onTimePerformance: { stopPerformance: StopPerformanceType[] };
    }>(response);

    expect(data?.onTimePerformance?.stopPerformance).toBeDefined();
    expect(data?.onTimePerformance?.stopPerformance.length).toBeGreaterThan(0);

    const sp = data?.onTimePerformance?.stopPerformance[0];
    expect(sp).toHaveProperty("lineId");
    expect(sp).toHaveProperty("stopId");
    expect(sp?.stopInfo).toHaveProperty("stopId");
    expect(sp?.stopInfo).toHaveProperty("stopName");
    expect(sp?.stopInfo?.stopLocation).toHaveProperty("latitude");
    expect(sp?.stopInfo?.stopLocation).toHaveProperty("longitude");
    expect(sp?.stopInfo?.stopLocality).toHaveProperty("localityId");
    expect(sp?.stopInfo?.stopLocality).toHaveProperty("localityName");
    expect(sp?.stopInfo?.stopLocality).toHaveProperty("localityAreaId");
    expect(sp?.stopInfo?.stopLocality).toHaveProperty("localityAreaName");
    expect(typeof sp?.early).toBe("number");
    expect(typeof sp?.onTime).toBe("number");
    expect(typeof sp?.late).toBe("number");
    expect(typeof sp?.averageDelay).toBe("number");
    expect(typeof sp?.countDelayed).toBe("number");
    expect(typeof sp?.scheduledDepartures).toBe("number");
    expect(typeof sp?.actualDepartures).toBe("number");
    expect(typeof sp?.timingPoint).toBe("boolean");
    expect(typeof sp?.direction).toBe("string");
    expect(typeof sp?.averageScheduled).toBe("number");
    expect(typeof sp?.averageActual).toBe("number");
    expect(typeof sp?.onTimeInSeconds).toBe("number");
    expect(typeof sp?.earlyInSeconds).toBe("number");
    expect(typeof sp?.lateInSeconds).toBe("number");
  });
});
