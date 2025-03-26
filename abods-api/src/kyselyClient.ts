import { Kysely, PostgresDialect } from "kysely";
import { DB } from "./kysely";
import { getDatabaseUrl, isLocal } from "./dbHelpers.js";
import logger from "./logger.js";
import pg from "pg";

export const getKyselyClient = async () => {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: await getDatabaseUrl(),
      }),
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
