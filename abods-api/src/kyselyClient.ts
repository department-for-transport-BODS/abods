import { Kysely, PostgresDialect } from "kysely";
import { DB } from "./kysely";
import { getDatabaseUrl, isLocal } from "./prismaClient";
import logger from "./logger";
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
        logger.debug(event.query.sql);
        // Don't log query parameters for now in case there's anything sensitive. Local is fine though
        if (isLocal()) {
          logger.debug(event.query.parameters);
        }
      }
      if (event.level === "error") {
        logger.error(event.error);
      }
    },
  });
};
