import {
  assumeRole,
  describeUser,
  getDashboardUrl,
  getQuicksighClient,
  registerUser,
} from "../lib/aws.js";
import {
  AwsQuicksightUser,
  QueryResolvers,
  Resolvers,
} from "../types/generated";
import { requireUserSession } from "./helpers.js";

export const getEmbeddedUrl: QueryResolvers["embeddedUrl"] = async (
  _,
  __,
  context,
): Promise<AwsQuicksightUser> => {
  const user = await requireUserSession(context);

  const awsCreds = await assumeRole();
  const quickSightClient = getQuicksighClient(awsCreds);
  const quickSightUser = await registerUser(user, quickSightClient);

  if (!quickSightUser?.Arn) {
    return {
      enabled: false,
    };
  }
  const url = await getDashboardUrl(quickSightUser?.Arn, quickSightClient);

  return {
    enabled: true,
    url: url,
  };
};

export const getQuicksightUser: QueryResolvers["quicksightUser"] = async (
  _,
  __,
  context,
): Promise<AwsQuicksightUser> => {
  const user = await requireUserSession(context);

  const awsCreds = await assumeRole();
  const quickSightClient = getQuicksighClient(awsCreds);

  const userArn = await describeUser(user.username, quickSightClient);

  if (!userArn) {
    return {
      enabled: false,
    };
  }

  const url = await getDashboardUrl(userArn, quickSightClient);

  return {
    enabled: true,
    url: url,
  };
};

const dataMonitoringResolvers: Resolvers = {
  Query: {
    embeddedUrl: getEmbeddedUrl,
    quicksightUser: getQuicksightUser,
  },
};

export default dataMonitoringResolvers;
