import { STSClient, AssumeRoleCommand, Credentials } from "@aws-sdk/client-sts";
import {
  QuickSightClient,
  GenerateEmbedUrlForAnonymousUserCommand,
  SessionTag,
} from "@aws-sdk/client-quicksight";
import logger from "../logger.js";
import { getUserTypeDetails } from "./operators.js";
import { accountTypes } from "../resolvers/userFunctions.js";

const region = process.env.AWS_REGION;
const targetRoleArn = process.env.QUICKSIGHT_ASSUME_ROLE_ARN;
const quickSightAccountId = process.env.QUICKSIGHT_AWS_ACCOUNT_ID;

export enum DataDashboardUserType {
  SuperAdmin = "SuperAdmin",
  Admin = "Admin",
  LTA = "LTA",
  Operator = "Operator",
}

export const userDashboardMap: Record<
  DataDashboardUserType,
  string | undefined
> = {
  SuperAdmin: process.env.QUICKSIGHT_SUPER_ADMIN_DASHBOARD_ID,
  Admin: process.env.QUICKSIGHT_ADMIN_DASHBOARD_ID,
  LTA: process.env.QUICKSIGHT_LTA_DASHBOARD_ID,
  Operator: process.env.QUICKSIGHT_OPERATOR_DASHBOARD_ID,
};

export const assumeRole = async (): Promise<Credentials> => {
  try {
    const stsClient = new STSClient({
      region,
    });

    const command = new AssumeRoleCommand({
      RoleArn: targetRoleArn,
      RoleSessionName: "MySession",
      DurationSeconds: 3600,
    });

    const response = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error("Failed to assume role");
    }

    logger.info(`Assumed role successfully: ${targetRoleArn}`);

    return response.Credentials;
  } catch (error) {
    logger.error({ error }, "Error assuming role:");
    throw error;
  }
};

export const getQuicksightClient = (credentials: Credentials) => {
  return new QuickSightClient({
    region,
    credentials: {
      accessKeyId: credentials.AccessKeyId!,
      secretAccessKey: credentials.SecretAccessKey!,
      sessionToken: credentials.SessionToken,
    },
  });
};

export const getDashboardUrl = async (
  session_tags: SessionTag[],
  dashboardId: string,
) => {
  try {
    const awsCreds = await assumeRole();
    const quickSightClient = getQuicksightClient(awsCreds);

    const command = new GenerateEmbedUrlForAnonymousUserCommand({
      AwsAccountId: quickSightAccountId,
      Namespace: "default",
      ExperienceConfiguration: {
        Dashboard: {
          InitialDashboardId: dashboardId,
        },
      },
      SessionLifetimeInMinutes: 600,
      AuthorizedResourceArns: [
        `arn:aws:quicksight:${region}:${quickSightAccountId}:dashboard/${dashboardId}`,
      ],
      SessionTags: session_tags,
    });

    const response = await quickSightClient.send(command);
    return response.EmbedUrl;
  } catch (error) {
    logger.error({ error }, "Error getting embedded url:");
    return undefined;
  }
};

const groupStrings = (
  values: string[],
  maxStringLength = 256,
  delimiter = ",",
) => {
  if (values.some((str) => str.length > maxStringLength)) {
    throw new Error(
      "A single string length is greater than the max group length",
    );
  }
  const result: string[][] = [];
  let currentGroup: string[] = [];
  let currentLength = 0;
  for (const str of values) {
    if (currentGroup.length === 0) {
      currentGroup = [str];
      currentLength = str.length;
      continue;
    }
    const newLength = currentLength + delimiter.length + str.length;
    if (newLength > maxStringLength) {
      result.push(currentGroup);
      currentGroup = [str];
      currentLength = str.length;
      continue;
    }
    currentGroup.push(str);
    currentLength = newLength;
  }
  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }
  return result.map((n) => n.join(delimiter));
};

export const getSessionTags = (
  isAdmin: boolean,
  ltaNames: string[],
  orgNames: string[],
) => {
  if (isAdmin) {
    return [{ Key: "org0", Value: "*" }];
  }
  const ltaTags = groupStrings(ltaNames).map((str, index) => ({
    Key: "lta" + index,
    Value: str,
  }));
  if (ltaTags.length > 7) {
    throw Error("Too many LTAs mapped to the user");
  }
  const orgTags = groupStrings(orgNames).map((str, index) => ({
    Key: "org" + index,
    Value: str,
  }));
  if (orgTags.length > 7) {
    throw Error("Too many orgs mapped to the user");
  }
  return [...ltaTags, ...orgTags];
};

export const getDashboardUserType = (
  userDetails: Awaited<ReturnType<typeof getUserTypeDetails>>,
) => {
  const isSuperAdmin = userDetails.some(
    (user) =>
      user.is_superuser === true && user.account_type === accountTypes.admin,
  );

  if (isSuperAdmin) return DataDashboardUserType.SuperAdmin;

  const isAdmin = userDetails.some((user) => user.is_superuser === true);
  if (!isSuperAdmin && isAdmin) return DataDashboardUserType.Admin;

  const isLta = userDetails.some((user) => user.lta_name !== null);
  if (isLta) return DataDashboardUserType.LTA;

  return DataDashboardUserType.Operator;
};

export const getDashboardId = (userType: DataDashboardUserType) => {
  return userDashboardMap[userType];
};

export const checkRequiredQuicksightVars = () => {
  if (!targetRoleArn || !quickSightAccountId) {
    throw Error("Required quicksight environment variables not found");
  }

  for (const dashboardUserType of Object.values(DataDashboardUserType)) {
    const dashboardId = DataDashboardUserType[dashboardUserType];
    if (!dashboardId) {
      throw new Error(
        `Required quicksight dashboard id is undefined for: ${dashboardUserType}`,
      );
    }
  }
};
