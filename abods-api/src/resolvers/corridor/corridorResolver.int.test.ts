import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { Kysely } from "kysely";
import { DB } from "../../kysely";
import { ApolloServer } from "@apollo/server";
import logger from "../../logger";
import { CorridorType, StopType } from "../../types/generated";
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
  createRouteTablesAndData,
  createTimetableTablesAndData,
} from "../../lib/testUtils";

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
  ]);

  console.log(
    "Connecting prisma client---",
    await kysely.selectFrom("corridor").selectAll().execute(),
  );
  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("Corridor resolver integration", () => {
  it("Should return corridor details for getCorridor query", async () => {
    const query = `
			query getCorridor($corridorId: Int!) {
				corridor {
					getCorridor(corridorId: $corridorId) {
						id
						name
						stops {
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
					}
				}
			}
		`;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: corridorResolvers,
      logger,
    });

    const response = await testServer.executeOperation(
      {
        query,
        variables: { corridorId: 1 },
      },
      {
        contextValue: getContext(prisma, kysely),
      },
    );

    const data = getSingleResultData<{
      corridor: { getCorridor: CorridorType | null };
    }>(response);
    expect(data?.corridor?.getCorridor).toBeDefined();
    expect(data?.corridor?.getCorridor?.id).toEqual(1);
    expect(data?.corridor?.getCorridor?.name).toEqual("Test Corridor");
    expect(data?.corridor?.getCorridor?.stops.length).toBe(2);
    expect(data?.corridor?.getCorridor?.stops[0]?.stopId).toEqual("1");
    expect(
      data?.corridor?.getCorridor?.stops[0]?.stopLocality.localityId,
    ).toEqual("LOC001");
    expect(
      data?.corridor?.getCorridor?.stops[0]?.stopLocality.localityAreaId,
    ).toEqual("10");
    expect(data?.corridor?.getCorridor?.stops[1]?.stopId).toEqual("2");
    expect(
      data?.corridor?.getCorridor?.stops[1]?.stopLocality.localityId,
    ).toEqual("LOC001");
  });

  it("Should return a list of corridors for corridorsList query", async () => {
    // Insert an additional corridor and stop
    await kysely
      .insertInto("corridor")
      .values({
        corridor_id: 2,
        corridor_name: "Second Corridor",
        organisation_id: 1,
        user_id: 1,
      })
      .execute();
    await kysely
      .insertInto("corridor_stops")
      .values({
        corridor_id: 2,
        corridor_index: 0,
        stop_id: 1,
      })
      .execute();

    const query = `
      query corridorsList {
        corridor {
          corridorList {
            id
            name
            stops {
              stopId
            }
          }
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: corridorResolvers,
      logger,
    });

    const response = await testServer.executeOperation(
      {
        query,
        variables: {},
      },
      {
        contextValue: getContext(prisma, kysely),
      },
    );

    const data = getSingleResultData<{
      corridor: { corridorList: CorridorType[] };
    }>(response);
    expect(data?.corridor?.corridorList).toBeDefined();
    expect(Array.isArray(data?.corridor?.corridorList)).toBe(true);
    expect(data?.corridor?.corridorList.length).toBeGreaterThanOrEqual(2);
    const names = data?.corridor?.corridorList.map((c) => c.name);
    expect(names).toContain("Test Corridor");
    expect(names).toContain("Second Corridor");
  });

  it("Should return stops for addFirstStop query", async () => {
    const query = `
      query corridorsStopSearch($inputs: AddFirstStopInputType!) {
        corridor {
          addFirstStop(inputs: $inputs) {
            stopId
            stopName
            lat
            lon
            localityName
            adminAreaId
            sourceId
          }
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: corridorResolvers,
      logger,
    });

    // Use a search string that matches seeded data, e.g., "Main"
    const variables = { inputs: { searchString: "Main" } };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { addFirstStop: StopType[] };
    }>(response);

    expect(data?.corridor?.addFirstStop).toBeDefined();
    expect(Array.isArray(data?.corridor?.addFirstStop)).toBe(true);
    expect(data?.corridor?.addFirstStop.length).toBeGreaterThan(0);
    expect(data?.corridor?.addFirstStop[0].stopName).toContain("Main Street");
  });

  it("Should return subsequent stops for addSubsequentStops query", async () => {
    const query = `
    query corridorsSubsequentStops($stopList: [String!]!) {
      corridor {
        addSubsequentStops(stopList: $stopList) {
          stopId
          stopName
          lon
          lat
          localityName
          adminAreaId
          sourceId
        }
      }
    }
  `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers: corridorResolvers,
      logger,
    });

    // Use a stopList that matches the seeded distinct_routes and naptan_stoppoint_latlong
    const variables = { stopList: ["12345"] };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      corridor: { addSubsequentStops: StopType[] };
    }>(response);

    expect(data?.corridor?.addSubsequentStops).toBeDefined();
    expect(Array.isArray(data?.corridor?.addSubsequentStops)).toBe(true);
    expect(data?.corridor?.addSubsequentStops.length).toBeGreaterThan(0);
    // You can add more specific assertions based on your seeded data
  });
});
