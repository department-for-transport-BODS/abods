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
  connectPrisma,
  createOperatorsAndServiceDetails,
  createRouteTablesAndData,
  getContext,
  getSingleResultData,
  createExpectedTablesAndData,
  createNaptanTablesAndData,
} from "../../lib/test/utils";
import resolvers from "../index";
import { ApolloServer } from "@apollo/server";
import logger from "../../logger";
import {
  AdminAreasType,
  LineType,
  OperatorType,
  ServiceInfoType,
  ServicePatternType,
} from "../../types/generated";
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
    createOperatorsAndServiceDetails(kysely),
    createRouteTablesAndData(kysely),
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

describe("OTP root queries", () => {
  it("Should return operators", async () => {
    const query = `
      query operatorList {
        operators {
          name
          nocCode
          operatorId
          adminAreaIds
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const response = await testServer.executeOperation(
      { query },
      { contextValue: getContext(prisma, kysely) },
    );

    // Helper to extract data from Apollo response
    const data = getSingleResultData<{
      operators: OperatorType[];
    }>(response);

    expect(data).toBeDefined();
    expect(data?.operators.length).toBeGreaterThan(0);
    expect(data?.operators[0]).toHaveProperty("name");
    expect(data?.operators[0]).toHaveProperty("nocCode");
    expect(data?.operators[0]).toHaveProperty("operatorId");
    expect(data?.operators[0].adminAreaIds.length).toBeGreaterThan(0);
  });

  it("Should return serviceInfo for a valid serviceId", async () => {
    const query = `
      query serviceInfo($lineId: String!) {
        serviceInfo(serviceId: $lineId) {
          serviceId
          serviceNumber
          serviceName
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = {
      lineId: "OP1-L1-SC1", // Use a serviceId that exists in your test data
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      serviceInfo: ServiceInfoType;
    }>(response);

    expect(data?.serviceInfo).toBeDefined();
    expect(data?.serviceInfo.serviceId).toEqual("OP1-L1-SC1");
    expect(data?.serviceInfo.serviceNumber).toEqual("L1");
    expect(data?.serviceInfo.serviceName).toEqual("Operator One");
  });

  it("Should return adminAreas", async () => {
    const query = `
      query getAdminAreas {
        adminAreas {
          id
          name
          shape
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const response = await testServer.executeOperation(
      { query },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      adminAreas: AdminAreasType[];
    }>(response);

    expect(data).toBeDefined();
    expect(data?.adminAreas.length).toBeGreaterThan(0);
    expect(data?.adminAreas[0]).toHaveProperty("id");
    expect(data?.adminAreas[0].id).toEqual("10");
    expect(data?.adminAreas[0]).toHaveProperty("name");
    expect(data?.adminAreas[0]).toHaveProperty("shape");
  });

  it("Should return lines for given operatorIds and inputDate", async () => {
    const query = `
      query operatorLines($operatorIds: [String!]!, $inputDate: String!, $endDate: String) {
        lines(operatorIds: $operatorIds, inputDate: $inputDate, endDate: $endDate) {
          id
          name
          number
          adminAreaIds
        }
      }
    `;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const variables = {
      operatorIds: ["OP1"],
      inputDate: "2025-10-17T00:00:00Z",
      endDate: "2025-10-20T00:00:00Z",
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      lines: LineType[];
    }>(response);

    expect(data).toBeDefined();
    expect(data?.lines.length).toBeGreaterThan(0);
    expect(data?.lines[0]).toHaveProperty("id");
    expect(data?.lines[0].id).toEqual("OP1-L1-SC1");
    expect(data?.lines[0]).toHaveProperty("name");
    expect(data?.lines[0]).toHaveProperty("number");
    expect(data?.lines[0].adminAreaIds.length).toBeGreaterThan(0);
  });

  it("Should return servicePatterns for given operatorId and lineId", async () => {
    const query = `
      query transitModelServicePatternStops($operatorId: String!, $lineId: String!) {
        servicePatterns(operatorId: $operatorId, lineId: $lineId) {
          servicePatternId
          stops {
            stopId
            stopName
            lon
            lat
          }
          serviceLinks {
            fromStop
            toStop
            distance
            routeValidity
            linkRoute
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
      lineId: "OP1-L1-SC1", // Use a lineId that exists in your test data
    };

    const response = await testServer.executeOperation(
      { query, variables },
      { contextValue: getContext(prisma, kysely) },
    );

    const data = getSingleResultData<{
      servicePatterns: ServicePatternType[];
    }>(response);

    expect(data).toBeDefined();
    expect(data?.servicePatterns.length).toBeGreaterThan(0);
    expect(data?.servicePatterns[0]).toHaveProperty("servicePatternId");
    expect(data?.servicePatterns[0].stops.length).toBeGreaterThan(0);
    expect(data?.servicePatterns[0].stops[0]).toHaveProperty("stopId");
    expect(data?.servicePatterns[0].stops[0]).toHaveProperty("stopName");
    expect(data?.servicePatterns[0].stops[0]).toHaveProperty("lon");
    expect(data?.servicePatterns[0].stops[0]).toHaveProperty("lat");
    expect(data?.servicePatterns[0].stops.length).toEqual(2);
    expect(data?.servicePatterns[0].serviceLinks.length).toBeGreaterThan(0);
    expect(data?.servicePatterns[0].serviceLinks[0]).toHaveProperty("fromStop");
    expect(data?.servicePatterns[0].serviceLinks[0]).toHaveProperty("toStop");
    expect(data?.servicePatterns[0].serviceLinks[0]).toHaveProperty("distance");
    expect(data?.servicePatterns[0].serviceLinks[0]).toHaveProperty(
      "routeValidity",
    );
    expect(data?.servicePatterns[0].serviceLinks[0]).toHaveProperty(
      "linkRoute",
    );
  });
});
