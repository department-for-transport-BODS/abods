import { SessionUser } from "../types/extra";
import { Kysely } from "kysely";
import { DB } from "../kysely";

export const getUserOperatorIdsQuery = (db: Kysely<DB>, user: SessionUser) =>
  db
    .selectFrom("bods_organisationoperator")
    .where("organisation_id", "=", user.orgId)
    .select("operatorref");

export const getUserOperatorIds = async (user: SessionUser, db: Kysely<DB>) =>
  getUserOperatorIdsQuery(db, user)
    .execute()
    .then((n) => n.map((o) => o.operatorref));
