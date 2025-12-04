import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { Kysely } from "kysely";
import { DB } from "../kysely";
import { ApolloServer } from "@apollo/server";
import logger from "../logger";
import { LoginInfo, LoginResponse, Organisation } from "../types/generated";
import resolvers from ".";
import { typeDefs } from "..";
import {
  connectKysely,
  connectPrisma,
  createUserTablesAndData,
  getContext,
  getSingleResultData,
  setEnvVariables,
} from "../lib/test/utils";

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

  kysely = await connectKysely(kysely);

  await createUserTablesAndData(kysely);

  prisma = await connectPrisma(prisma);
}, 120000);

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (kysely) await kysely.destroy();
  if (container) await container.stop();
});

describe("User function resolvers", () => {
  it("Should return user information", async () => {
    const query = `query user {
      user {
        currentUserId
        canViewServiceMonitoring
        canEditAllAlerts
        canViewDistances
        serviceMonitoringEmbedUrl
        flags
      }
    }`;

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
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

    const data = getSingleResultData<{ user: LoginInfo | null }>(response);

    expect(data?.user).toBeDefined();
    expect(Number(data?.user?.currentUserId)).toEqual(1);
    expect(data?.user?.canViewServiceMonitoring).toEqual(true);
  });

  it("Should return user organisations for logged in user", async () => {
    const query = `
      query {
        userOrgs {
          id
          name
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
        variables: {},
      },
      {
        contextValue: getContext(prisma, kysely),
      },
    );

    const data = getSingleResultData<{
      userOrgs: Organisation[];
    }>(response);

    expect(data?.userOrgs).toBeDefined();
    expect(Array.isArray(data?.userOrgs)).toBe(true);
    expect(data?.userOrgs.length).toBeGreaterThan(0);
    expect(data?.userOrgs[0]).toMatchObject({ id: 1, name: "Test Org" });
  });

  it("Should login with valid credentials", async () => {
    const mutation = `
      mutation login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          success
          expiresAt
          maxAttempts
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
        query: mutation,
        variables: { username: "test@dft.gov.uk", password: "hashedpassword" },
      },
      {
        contextValue: { ...getContext(prisma, kysely), logger },
      },
    );

    const data = getSingleResultData<{ login: LoginResponse | null }>(response);

    expect(data?.login).toBeDefined();
    expect(data?.login?.success).toBe(true);
    expect(data?.login?.maxAttempts).toBeDefined();
    expect(
      typeof data?.login?.expiresAt === "string" ||
        data?.login?.expiresAt === null,
    ).toBe(true);
  });

  it("Should logout the user", async () => {
    const mutation = `
      mutation logout {
        logout
      }
    `;

    await prisma.tokens.deleteMany({});

    await prisma.tokens.create({
      data: {
        token: "test-session-id",
        user_id: 1,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const testServer = new ApolloServer({
      typeDefs,
      resolvers,
      logger,
    });

    const response = await testServer.executeOperation(
      {
        query: mutation,
        variables: {},
      },
      {
        contextValue: getContext(prisma, kysely),
      },
    );

    const data = getSingleResultData<{ logout: boolean }>(response);

    expect(data?.logout).toBe(true);
  });
});
