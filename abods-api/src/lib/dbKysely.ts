import { SelectQueryBuilder, UpdateQueryBuilder } from "kysely";
import { DB } from "../kysely";
import { SimplifySingleResult } from "kysely/dist/cjs/util/type-utils";

export const executeQuery = async <T>(
  query: SelectQueryBuilder<DB, never, T>,
): Promise<T[]> => {
  return query.execute();
};

export const executeQueryTakeFirst = async <T>(
  query: SelectQueryBuilder<DB, never, T>,
): Promise<T | undefined> => {
  return query.executeTakeFirst();
};

export const updateQueryTakeFirst = async <T>(
  query: UpdateQueryBuilder<DB, never, never, T>,
): Promise<SimplifySingleResult<T> | undefined> => {
  return query.executeTakeFirst();
};
