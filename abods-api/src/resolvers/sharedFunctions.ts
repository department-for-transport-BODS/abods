import {
  ApiInfoType,
  Maybe,
  QueryResolvers,
  Resolvers,
  RoleType,
} from "../types/generated.js";
import { requireUserSession } from "./helpers.js";
import logger from "../logger.js";

// Summary: fetch api info
export const getApiInfo: QueryResolvers["apiInfo"] = async (
  _,
  __,
  context,
): Promise<Maybe<ApiInfoType>> => {
  const apiInfo = await context.db.apiInfo.findFirst();

  if (!apiInfo) {
    logger.error("No api info found in database");
    return null;
  }

  return {
    buildNumber: apiInfo.build_number,
    version: apiInfo.version,
  };
};

// Summary: fetch roles
export const getRoles: QueryResolvers["roles"] = async (
  _,
  __,
  context,
): Promise<Maybe<RoleType[]>> => {
  await requireUserSession(context);
  return [
    {
      id: "1",
      name: "Staff",
      scope: "organisation",
    },
    {
      id: "2",
      name: "Administrator",
      scope: "organisation",
    },
  ];
};

const sharedResolvers: Resolvers = {
  Query: {
    apiInfo: getApiInfo,
    roles: getRoles,
  },
};

export default sharedResolvers;
