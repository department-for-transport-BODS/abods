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

export const getSessionTags = (
  isAdmin: boolean,
  ltaUsers: string[],
  orgUsers: string[],
) => {
  if (isAdmin) {
    return [
      {
        Key: "org0",
        Value: "*",
      },
    ];
  }

  const sessionTags: SessionTag[] = [];
  let ltaUsersString = "";
  let ltaIndexCount = 0;
  ltaUsers.map((lta) => {
    const lta_name = ltaUsersString ? lta + "," + ltaUsersString : lta;
    if (lta_name.length > 256) {
      sessionTags.push({
        Key: `lta${ltaIndexCount}`,
        Value: ltaUsersString,
      });
      ltaUsersString = lta;
      ltaIndexCount = ltaIndexCount + 1;
    } else {
      ltaUsersString = lta_name;
    }
  });
  if (ltaUsersString) {
    sessionTags.push({
      Key: `lta${ltaIndexCount}`,
      Value: ltaUsersString,
    });
  }

  if (ltaIndexCount > 6) {
    throw Error("Too many LTAs mapped to the user");
  }

  let orgUsersString = "";
  let orgIndexCount = 0;
  orgUsers.map((org) => {
    const org_name = orgUsersString ? org + "," + orgUsersString : org;
    if (org_name.length > 256) {
      sessionTags.push({
        Key: `org${orgIndexCount}`,
        Value: orgUsersString,
      });
      orgUsersString = org;
      orgIndexCount = orgIndexCount + 1;
    } else {
      orgUsersString = org_name;
    }
  });
  if (orgUsersString) {
    sessionTags.push({
      Key: `org${orgIndexCount}`,
      Value: orgUsersString,
    });
  }

  if (orgIndexCount > 6) {
    throw Error("Too many orgs mapped to the user");
  }

  return sessionTags;
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
