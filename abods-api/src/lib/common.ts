import { Kysely, sql } from "kysely";
import { DB } from "../kysely";

export const getTracksData = async (
  stop_atcos: {
    from_atco_code: string;
    to_atco_code: string;
  }[],
  db: Kysely<DB>,
) => {
  return db
    .selectFrom("transmodel_tracks")
    .select([
      "id",
      "from_atco_code",
      "to_atco_code",
      sql`ST_AsGeoJSON(geometry)`.as("geometry"),
      "distance",
    ])
    .where((eb) =>
      eb.or(
        stop_atcos.map((condition) =>
          eb.and({
            "transmodel_tracks.from_atco_code": condition.from_atco_code,
            "transmodel_tracks.to_atco_code": condition.to_atco_code,
          }),
        ),
      ),
    )
    .execute();
};
