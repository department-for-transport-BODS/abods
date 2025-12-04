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
  createExpectedTablesAndData,
  connectPrisma,
  getContext,
  getSingleResultData,
  createTimetableTablesAndData,
  createTransmodelTablesAndData,
} from "../lib/test/utils";
import { ApolloServer } from "@apollo/server";
import logger from "../logger";
import { typeDefs } from "..";
import resolvers from ".";
import {
  Journey,
  JourneyResult,
  ServicePatternDistanceResult,
} from "../types/generated";

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
    // createSummaryTablesAndData(kysely),
    // createTimetableSummaryStopsTableAndData(kysely),
    // createFrequentSummariesTableAndData(kysely),
    createExpectedTablesAndData(kysely),
    createTimetableTablesAndData(kysely),
    createTransmodelTablesAndData(kysely),
    //createNaptanTablesAndData(kysely),
  ]);

  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("VehicleJourney queries", () => {
  it("Should return journeys based on input params", async () => {
    const query = `
      query journeys($dateOfJourney: String!, $lineId: String!) {
        findJourneys(dateOfJourney: $dateOfJourney, lineId: $lineId) {
          groupId
          startTime
          serviceName
          serviceNumber
          operatorName
          operatorNoc
          directionRef
          isCancelled
          vehicleJourneyId
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = {
      dateOfJourney: "2025-10-18T00:00:00Z",
      lineId: "OP1-L1-SC1",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      findJourneys: Journey[];
    }>(response);

    expect(data?.findJourneys).toBeDefined();
    expect(data?.findJourneys.length).toBeGreaterThan(0);
    const journey = data?.findJourneys[0];
    expect(journey).toHaveProperty("groupId");
    expect(journey).toHaveProperty("startTime");
    expect(journey).toHaveProperty("serviceName");
    expect(journey).toHaveProperty("serviceNumber");
    expect(journey).toHaveProperty("operatorName");
    expect(journey).toHaveProperty("operatorNoc");
    expect(journey).toHaveProperty("directionRef");
    expect(journey).toHaveProperty("isCancelled");
    expect(journey).toHaveProperty("vehicleJourneyId");
  });

  it("Should return journey details for a given groupId and lineId", async () => {
    const query = `
    query journey($groupId: String!, $lineId: String!) {
      journey(groupId: $groupId, lineId: $lineId) {
        stops {
          estimatedDepartureUtc
          actualDepartureUtc
          scheduledDepartureUtc
          latitude
          longitude
          stopIndex
          stopName
          stopId
          isTimingPoint
          otp
          directionRef
          incompleteReason
          setDown
        }
        avls {
          recordedAtTimeUtc
          latitude
          longitude
          vehicleRef
          directionRef
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
      groupId: "op1|L1|SC1|2025-10-17",
      lineId: "OP1-L1-SC1",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      journey: JourneyResult;
    }>(response);

    expect(data?.journey).toBeDefined();
    expect(Array.isArray(data?.journey.stops)).toBe(true);
    expect(data?.journey.stops.length).toBeGreaterThan(0);
    expect(Array.isArray(data?.journey.avls)).toBe(true);

    const stop = data?.journey.stops[0];
    expect(stop).toHaveProperty("scheduledDepartureUtc");
    expect(stop).toHaveProperty("latitude");
    expect(stop).toHaveProperty("longitude");
    expect(stop).toHaveProperty("stopIndex");
    expect(stop).toHaveProperty("stopName");
    expect(stop).toHaveProperty("stopId");
    expect(stop).toHaveProperty("isTimingPoint");
    expect(stop).toHaveProperty("directionRef");
    expect(stop).toHaveProperty("incompleteReason");
    expect(stop).toHaveProperty("setDown");

    const avl = data?.journey.avls;
    expect(avl?.length).toEqual(2);

    expect(avl?.[0]).toHaveProperty("recordedAtTimeUtc");
    expect(avl?.[0]).toHaveProperty("latitude");
    expect(avl?.[0]).toHaveProperty("longitude");
    expect(avl?.[0]).toHaveProperty("vehicleRef");
    expect(avl?.[0]).toHaveProperty("directionRef");
  });

  it("Should return service pattern distance and geometry for a given vehicleJourneyId", async () => {
    const query = `
    query servicePatternDistanceGeom($vehicleJourneyId: ID!) {
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

    const variables = {
      vehicleJourneyId: 101,
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      getServicePatternDistanceGeom: ServicePatternDistanceResult;
    }>(response);

    expect(data?.getServicePatternDistanceGeom).toBeDefined();
    expect(typeof data?.getServicePatternDistanceGeom.distance).toBe("number");
    expect(data?.getServicePatternDistanceGeom.distance).toBeGreaterThan(0);
    expect(data?.getServicePatternDistanceGeom.geom).toBeDefined();
    expect(Array.isArray(data?.getServicePatternDistanceGeom.geom)).toBe(true);
    expect(data?.getServicePatternDistanceGeom.geom).toEqual([
      [-0.12345, 51.54321],
      [-0.1235, 51.54325],
    ]);
  });
});
