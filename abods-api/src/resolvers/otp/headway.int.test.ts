import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { Kysely } from "kysely";
import { DB } from "../../kysely";
import { ApolloServer } from "@apollo/server";
import logger from "../../logger";
import { typeDefs } from "../..";
import {
  setEnvVariables,
  connectKysely,
  connectPrisma,
  getContext,
  getSingleResultData,
  createUserTablesAndData,
  createFrequentSummariesTableAndData,
  createTimetableSummaryStopsTableAndData,
} from "../../lib/testUtils";
import {
  FrequentServiceInfoType,
  FrequentServiceType,
  HeadwayOverviewType,
  HeadwayTimeSeriesType,
} from "../../types/generated";
import resolvers from "../index";

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
    createFrequentSummariesTableAndData(kysely),
    createTimetableSummaryStopsTableAndData(kysely),
  ]);

  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("Headway resolver integration", () => {
  it("Should return headwayTimeSeries", async () => {
    const query = `
			query headwayTimeSeries($params: HeadwayInputType!) {
				headwayMetrics {
					headwayTimeSeries(inputs: $params) {
						ts
						actual
						scheduled
						excess
					}
				}
			}
		`;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: resolvers,
      logger,
    });

    const variables = {
      params: {
        filters: {
          operatorIds: ["OP1"],
          lineIds: ["OP1-L1-SC1"],
        },
        fromTimestamp: "2025-10-19T08:00:00Z",
        toTimestamp: "2025-10-22T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      headwayMetrics: { headwayTimeSeries: HeadwayTimeSeriesType[] };
    }>(response);
    expect(data?.headwayMetrics.headwayTimeSeries).toBeDefined();
    expect(data?.headwayMetrics.headwayTimeSeries[0].actual).toEqual(12);
    expect(data?.headwayMetrics.headwayTimeSeries[0].scheduled).toEqual(10);
    expect(data?.headwayMetrics.headwayTimeSeries[0].excess).toEqual(2);
  });

  it("Should return headwayOverview", async () => {
    const query = `
			query headwayOverview($params: HeadwayInputType!) {
				headwayMetrics {
					headwayOverview(inputs: $params) {
						excess
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
        fromTimestamp: "2025-10-19T08:00:00Z",
        toTimestamp: "2025-10-22T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      headwayMetrics: { headwayOverview: HeadwayOverviewType };
    }>(response);
    expect(data?.headwayMetrics?.headwayOverview).toBeDefined();
    expect(data?.headwayMetrics?.headwayOverview.excess).toEqual(2);
  });

  it("Should return frequentServices", async () => {
    const query = `
			query headwayFrequentServices($operatorId: String!, $fromTimestamp: String!, $toTimestamp: String!) {
				headwayMetrics {
					frequentServices(operatorId: $operatorId, fromTimestamp: $fromTimestamp, toTimestamp: $toTimestamp) {
						serviceId
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
      fromTimestamp: "2025-10-19T08:00:00Z",
      toTimestamp: "2025-10-22T00:00:00Z",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      headwayMetrics: { frequentServices: FrequentServiceType[] };
    }>(response);
    expect(data?.headwayMetrics?.frequentServices).toBeDefined();
    expect(data?.headwayMetrics?.frequentServices[0].serviceId).toEqual(
      "OP1-L1-SC1",
    );
  });

  it("Should return frequentServiceInfo", async () => {
    const query = `
			query headwayFrequentServiceInfo($inputs: FrequentServiceInfoInputType!) {
				headwayMetrics {
					frequentServiceInfo(inputs: $inputs) {
						numHours
						totalHours
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
      inputs: {
        filters: { operatorId: "OP1" },
        fromTimestamp: "2025-10-20T08:00:00Z",
        toTimestamp: "2025-10-22T00:00:00Z",
      },
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      headwayMetrics: { frequentServiceInfo: FrequentServiceInfoType };
    }>(response);
    expect(data?.headwayMetrics?.frequentServiceInfo).toBeDefined();
    expect(data?.headwayMetrics?.frequentServiceInfo?.numHours).toEqual(2);
    expect(data?.headwayMetrics?.frequentServiceInfo?.totalHours).toEqual(1);
  });
});
