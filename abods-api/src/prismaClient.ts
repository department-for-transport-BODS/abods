import { Prisma, PrismaClient } from "@prisma/client";
import { Signer } from "@aws-sdk/rds-signer";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import logger from "./logger.js";
import { sendErrorMetric } from "./lib/datadog.js";

export const isLocal = () => (process.env.PROJECT_ENV || "local") === "local";

async function generateRdsIamToken(
  region: string,
  hostname: string,
  port: number,
  username: string,
): Promise<string> {
  const signer = new Signer({
    hostname,
    port,
    username,
    region,
    credentials: fromNodeProviderChain(),
  });
  return signer.getAuthToken();
}

export async function getDatabaseUrl(): Promise<string> {
  const region = process.env.AWS_REGION || "eu-west-2";
  const hostname = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "5432", 10);
  const username = process.env.DB_USER || "postgres";
  const dbName = process.env.DB_NAME || "postgres";

  if (isLocal()) {
    const password = process.env.DB_PASSWORD;
    return `postgresql://${username}:${password}@${hostname}:${port}/${dbName}?schema=public&connection_limit=50&gssencmode=disable&sslmode=disable&ssl=false`;
  } else {
    const token = await generateRdsIamToken(region, hostname, port, username);
    const encodedToken = encodeURIComponent(token);
    return `postgresql://${username}:${encodedToken}@${hostname}:${port}/${dbName}?schema=public&connection_limit=50&sslmode=prefer&ssl=true`;
  }
}

let prisma: PrismaClient;

async function initialisePrismaClient(force = false): Promise<PrismaClient> {
  logger.debug("Initialising prisma client");

  if (!prisma || force) {
    logger.debug("Getting database url and prisma client");
    const databaseUrl = await getDatabaseUrl();
    const logTypes: Prisma.LogDefinition[] = [
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "query" },
    ];
    prisma = new PrismaClient({
      log: logTypes,
      datasources: { db: { url: databaseUrl } },
    });
    prisma.$on("error" as never, (e) =>
      logger.error({
        message: "prisma error",
        // @ts-expect-error This is typed as never, but does contain properties
        ...e,
      }),
    );
    prisma.$on("warn" as never, (e) =>
      logger.warn({
        message: "prisma warning",
        // @ts-expect-error This is typed as never, but does contain properties
        ...e,
      }),
    );
    prisma.$on("info" as never, (e) =>
      logger.info({
        message: "prisma log",
        // @ts-expect-error This is typed as never, but does contain properties
        ...e,
      }),
    );
    prisma.$on("query" as never, (e) =>
      logger.debug({
        message: "prisma query",
        // @ts-expect-error This is typed as never, but does contain properties
        ...e,
        // Don't log query parameters for now in case there's anything sensitive. Local is fine though
        ...(isLocal() ? {} : { params: undefined }),
      }),
    );
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      //await Promise.all([prisma.$disconnect(), prisma.$connect()]);
    } catch (error) {
      sendErrorMetric(error);
      throw new Error("Failed to connect to database using prisma");
      logger.error(error);
    }
    logger.debug("Prisma has connected to the database");
  }
  return prisma;
}

export { initialisePrismaClient };
