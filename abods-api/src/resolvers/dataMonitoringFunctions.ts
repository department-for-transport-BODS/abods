import { QueryResolvers, Resolvers } from "../types/generated";
import { requireUserSession } from "./helpers.js";

export const getEmbeddedUrl: QueryResolvers["embeddedUrl"] = async (
  _,
  __,
  context,
): Promise<string> => {
  await requireUserSession(context);

  return "";
};

const dataMonitoringResolvers: Resolvers = {
  Query: {
    embeddedUrl: getEmbeddedUrl,
  },
};

export default dataMonitoringResolvers;
