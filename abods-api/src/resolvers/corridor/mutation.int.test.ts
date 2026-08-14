import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { Kysely } from "kysely";
import { DB } from "../../kysely";
import { ApolloServer } from "@apollo/server";
import logger from "../../logger";
import corridorMutations from "./mutation";
import corridorResolvers from "./corridorResolver";
import { typeDefs } from "../..";
import {
  setEnvVariables,
  connectKysely,
  connectPrisma,
  getContext,
  getSingleResultData,
  createUserTablesAndData,
  createCorridorTablesAndData,
  createNaptanTablesAndData,
} from "../../lib/test/utils";
import { MutationResponseType } from "../../types/generated";

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
  ]);
  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("Corridor mutation integration", () => {
  it("Should create a corridor", async () => {
    const mutation = `
			mutation createCorridor($name: String!, $stopIds: [String!]!) {
				createCorridor(payload: { name: $name, stopIds: $stopIds }) {
					success
					error
				}
			}
		`;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: { ...corridorResolvers, ...corridorMutations },
      logger,
    });

    const variables = {
      name: "New Corridor",
      stopIds: ["1", "2"],
    };

    const response = await testServer.executeOperation(
      { query: mutation, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{ createCorridor: MutationResponseType }>(
      response,
    );
    expect(data?.createCorridor?.success).toBe(true);
    expect(data?.createCorridor?.error).toBe(null);
  });

  it("Should update a corridor", async () => {
    // First create a corridor to update
    await kysely
      .insertInto("corridor")
      .values({
        corridor_id: 3,
        corridor_name: "Corridor To Update",
        organisation_id: 1,
      })
      .execute();
    await kysely
      .insertInto("corridor_stops")
      .values({
        corridor_id: 3,
        corridor_index: 0,
        stop_id: 1,
      })
      .execute();

    const mutation = `
			mutation updateCorridor($inputs: CorridorUpdateInputType!) {
				updateCorridor(inputs: $inputs) {
					success
					error
				}
			}
		`;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: { ...corridorResolvers, ...corridorMutations },
      logger,
    });

    const variables = {
      inputs: {
        id: 3,
        name: "Updated Corridor Name",
        stopList: ["1", "2"],
      },
    };

    const response = await testServer.executeOperation(
      { query: mutation, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{ updateCorridor: MutationResponseType }>(
      response,
    );
    expect(data?.updateCorridor?.success).toBe(true);
    expect(data?.updateCorridor?.error).toBe(null);
  });

  it("Should delete a corridor", async () => {
    // First create a corridor to delete
    await kysely
      .insertInto("corridor")
      .values({
        corridor_id: 4,
        corridor_name: "Corridor To Delete",
        organisation_id: 1,
      })
      .execute();
    await kysely
      .insertInto("corridor_stops")
      .values({
        corridor_id: 4,
        corridor_index: 0,
        stop_id: 1,
      })
      .execute();

    const mutation = `
			mutation deleteCorridor($corridorId: Int!) {
				deleteCorridor(corridorId: $corridorId) {
					success
					error
				}
			}
		`;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: { ...corridorResolvers, ...corridorMutations },
      logger,
    });

    const variables = {
      corridorId: 4,
    };

    const response = await testServer.executeOperation(
      { query: mutation, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{ deleteCorridor: MutationResponseType }>(
      response,
    );
    expect(data?.deleteCorridor?.success).toBe(true);
    expect(data?.deleteCorridor?.error).toBe(null);
  });
});
