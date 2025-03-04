import { getUserTypeDetails } from "../lib/operators.js";
import {
  DataAndServiceMonitoringUser,
  QueryResolvers,
  Resolvers,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";

export const getServiceMonitoringUrl: QueryResolvers["embeddedUrl"] = async (
  _,
  __,
  context,
): Promise<DataAndServiceMonitoringUser> => {
  const embedUrl = process.env.DATADOG_SERVICE_MONITORING_DASHBOARD;
  if (!embedUrl) {
    throw Error("Dashbord URL not found for Service Monitoring");
  }

  const user = await requireUserSession(context);
  const userType = await getUserTypeDetails(context.kysely, user.id);

  const isAdmin = userType.some((user) => user.is_superuser === true);
  if (!isAdmin) {
    throw Error(
      "User is not an Admin and should not be allowed access to the api",
    );
  }

  return {
    enabled: true,
    url: embedUrl,
  };
};

const serviceMonitoringResolvers: Resolvers = {
  Query: {
    serviceMonitorUrl: getServiceMonitoringUrl,
  },
};

export default serviceMonitoringResolvers;
