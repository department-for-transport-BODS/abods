import { SessionUser } from "../types/extra";
import { Kysely } from "kysely";
import { DB } from "../kysely";

export const getUserOperatorIdsQuery = (db: Kysely<DB>, user: SessionUser) =>
  db
    .selectFrom("bods_organisationoperator")
    .where("organisation_id", "in", user.orgIds)
    .select("operatorref");

export const getUserOperatorIds = async (user: SessionUser, db: Kysely<DB>) =>
  getUserOperatorIdsQuery(db, user)
    .execute()
    .then((n) => n.map((o) => o.operatorref));

export const getUserTypeDetails = async (db: Kysely<DB>, user_id: number) => {
  return db
    .selectFrom("bods_user as bu")
    .innerJoin("bods_userorganisation as buo", "buo.user_id", "bu.id")
    .leftJoin("organisation_organisation_admin_areas as ooaa", (join) =>
      join
        .onRef("buo.organisation_id", "=", "ooaa.organisation_id")
        .on("bu.is_superuser", "=", false),
    )
    .leftJoin("naptan_adminarea as na", "na.id", "ooaa.adminarea_id")
    .leftJoin("ui_lta as ul", "ul.id", "na.ui_lta_id")
    .leftJoin("bods_organisation as bo", (join) =>
      join.onRef("bo.id", "=", "buo.organisation_id").on("ul.id", "is", null),
    )
    .where("buo.user_id", "=", user_id)
    .select([
      "bo.is_abods_global_viewer as is_superuser",
      "ul.name as lta_name",
      "bo.name as org_name",
    ])
    .execute();
};
