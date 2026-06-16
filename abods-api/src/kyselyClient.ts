import { Kysely, PostgresDialect } from "kysely";
import { DB } from "./kysely";
import { getDatabaseUrl, isLocal } from "./prismaClient.js";
import logger from "./logger.js";
import pg from "pg";

export const getKyselyClient = async () => {
  const pool = new pg.Pool({
    connectionString: await getDatabaseUrl(),
  });

  // When a database is terminated (for example, testcontainers teardown),
  // idle clients can emit errors. Handle them to avoid unhandled exceptions.
  pool.on("error", (error) => {
    logger.warn({ error }, "Postgres pool emitted idle client error");
  });

  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool,
    }),
    log(event) {
      if (event.level === "query") {
        logger.debug({
          sql: event.query.sql,
          // Don't log query parameters for now in case there's anything sensitive. Local is fine though
          ...(isLocal() ? { parameters: event.query.parameters } : {}),
          queryDurationMillis: event.queryDurationMillis,
        });
      }
      if (event.level === "error") {
        logger.error(event.error);
      }
    },
  });
};
