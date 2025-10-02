import { SelectQueryBuilder } from "kysely";
import { DB } from "../kysely";

export const executeQuery = async <T>(
  query: SelectQueryBuilder<DB, never, T>,
): Promise<T[]> => {
  return await query.execute();
};

export const executeQueryTakeFirst = async <T>(
  query: SelectQueryBuilder<DB, never, T>,
): Promise<T | undefined> => {
  return await query.executeTakeFirst();
};
