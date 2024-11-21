import { SessionUser } from "../types/extra";
import { PrismaClient } from "@prisma/client";

export const getOperatorIds = async (user: SessionUser, db: PrismaClient) => {
  return db.bods_organisationoperator
    .findMany({
      where: { organisation_id: user.orgId },
      select: { operatorref: true },
    })
    .then((n) => n.map((o) => o.operatorref));
};
