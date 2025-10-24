import {
  StartedPostgreSqlContainer,
  PostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { typeDefs } from "../index"; // Your express app export
import resolvers from ".";
import { ApolloServer } from "@apollo/server";
import { DB } from "../kysely";
import { Kysely } from "kysely";
import logger from "../logger";
import { ServicePatternDistanceResult } from "../types/generated";
import {
  connectKysely,
  connectPrisma,
  createUserTablesAndData,
  getContext,
  getSingleResultData,
  setEnvVariables,
} from "../lib/test/utils";
import {
  createTransmodelServicepatterndistanceTable,
  createTransmodelVehiclejourneyTable,
} from "../lib/test/db";

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let kysely: Kysely<DB>;

beforeAll(async () => {
  // Start Postgres container
  container = await new PostgreSqlContainer("postgis/postgis:16-3.4")
    .withDatabase("testdb")
    .withUsername("testuser")
    .withPassword("testpass")
    .start();

  // Set env vars for Prisma and app
  setEnvVariables(container);

  [kysely, prisma] = await Promise.all([
    connectKysely(kysely),
    connectPrisma(prisma),
  ]);

  //await setupTestUser(kysely);

  await createUserTablesAndData(kysely);
  await createTransmodelServicepatterndistanceTable(kysely);
  await createTransmodelVehiclejourneyTable(kysely);
  await kysely
    .insertInto("transmodel_servicepatterndistance")
    .values({
      service_pattern_id: 100,
      distance: 12345,
      geom: '{"type":"LineString","coordinates":[[0,0],[1,1]]}', // Example GeoJSON
    })
    .execute();

  await kysely
    .insertInto("transmodel_vehiclejourney")
    .values({
      id: "vj-1",
      service_pattern_id: 100,
      start_time: new Date(),
      direction: "outbound",
      journey_code: "JC-001",
      line_ref: "LN-001",
      departure_day_shift: false,
      block_number: "B1",
    })
    .execute();
}, 120000); // Increase timeout for container startup

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

it("Should return logged in user information", async () => {
  const query = `
    query($vehicleJourneyId: ID!) {
      getServicePatternDistanceGeom(vehicleJourneyId: $vehicleJourneyId) {
        distance
        geom
      }
    }
  `;

  const testServer = new ApolloServer({
    typeDefs,
    resolvers,
    logger,
  });

  const response = await testServer.executeOperation(
    {
      query,
      variables: { vehicleJourneyId: "vj-1" },
    },
    {
      contextValue: getContext(prisma, kysely),
    },
  );

  const data = getSingleResultData<{
    getServicePatternDistanceGeom: ServicePatternDistanceResult;
  }>(response);

  expect(data?.getServicePatternDistanceGeom).toBeDefined();
  expect(data?.getServicePatternDistanceGeom?.distance).toEqual(12345);
  expect(data?.getServicePatternDistanceGeom?.geom).toEqual([
    [0, 0],
    [1, 1],
  ]);
});
