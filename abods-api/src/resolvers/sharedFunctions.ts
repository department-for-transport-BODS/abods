import {
  ApiInfoType,
  Maybe,
  QueryResolvers,
  Resolvers,
} from "../types/generated.js";
import logger from "../logger.js";

// Summary: fetch api info
export const getApiInfo: QueryResolvers["apiInfo"] = async (
  _,
  __,
  context,
): Promise<Maybe<ApiInfoType>> => {
  const apiInfo = await context.db
    .selectFrom("ApiInfo")
    .select(["build_number", "version"])
    .executeTakeFirst();

  if (!apiInfo) {
    logger.error("No api info found in database");
    return null;
  }

  return {
    buildNumber: apiInfo.build_number,
    version: apiInfo.version,
  };
};

const sharedResolvers: Resolvers = {
  Query: {
    apiInfo: getApiInfo,
  },
};

export default sharedResolvers;
