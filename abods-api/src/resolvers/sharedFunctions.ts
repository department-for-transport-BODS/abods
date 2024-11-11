import {
  ApiInfoType,
  Maybe,
  QueryResolvers,
  Resolvers,
  RoleType,
} from "../types/generated.js";
import { requireUserSession } from "./helpers.js";

// Summary: fetch api info
export const getApiInfo: QueryResolvers["apiInfo"] = async (
  _,
  __,
  context,
): Promise<Maybe<ApiInfoType>> => {
  try {
    const apiInfo = await context.db.apiInfo.findFirst({
      include: {
        feature_flag: true,
      },
    });

    if (!apiInfo) {
      throw "No api info found";
    }

    return {
      buildNumber: apiInfo.build_number,
      version: apiInfo.version,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Summary: fetch roles
export const getRoles: QueryResolvers["roles"] = async (
  _,
  __,
  context,
): Promise<Maybe<RoleType[]>> => {
  try {
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
  } catch (error) {
    console.error(error);
    return null;
  }
};

const sharedResolvers: Resolvers = {
  Query: {
    apiInfo: getApiInfo,
    roles: getRoles,
  },
};

export default sharedResolvers;
