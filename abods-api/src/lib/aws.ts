import { STSClient, AssumeRoleCommand, Credentials } from "@aws-sdk/client-sts";
import {
  QuickSightClient,
  GenerateEmbedUrlForAnonymousUserCommand,
  SessionTag,
} from "@aws-sdk/client-quicksight";
import logger from "../logger.js";

const region = process.env.AWS_REGION;
const targetRoleArn = process.env.QUICKSIGHT_ASSUME_ROLE_ARN;
const quickSightAccountId = process.env.QUICKSIGHT_AWS_ACCOUNT_ID;
const adminDashboardId = process.env.QUICKSIGHT_ADMIN_DASHBOARD_ID;
const ltaDashboardId = process.env.QUICKSIGHT_LTA_DASHBOARD_ID;
const operatorDashboardId = process.env.QUICKSIGHT_OPERATOR_DASHBOARD_ID;

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

export const getDashboardId = (isAdmin: boolean, ltaUsers: string[]) => {
  if (isAdmin) {
    return adminDashboardId;
  }

  if (ltaUsers.length > 0) {
    return ltaDashboardId;
  }

  return operatorDashboardId;
};

export const checkRequiredQuicksightVars = () => {
  if (
    !targetRoleArn ||
    !quickSightAccountId ||
    !adminDashboardId ||
    !ltaDashboardId ||
    !operatorDashboardId
  ) {
    throw Error("Required quicksight environment variables not found");
  }
};
