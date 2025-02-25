import { STSClient, AssumeRoleCommand, Credentials } from "@aws-sdk/client-sts";
import {
  QuickSightClient,
  GenerateEmbedUrlForAnonymousUserCommand,
  SessionTag,
} from "@aws-sdk/client-quicksight";
import logger from "../logger.js";

const region = "eu-west-2";
const targetRoleArn =
  "arn:aws:iam::228266753808:role/abods-quicksight-assume-role";
const quickSightAccountId = "228266753808";
const dashboardId = "afcf9f5e-ae09-4fda-87dd-7e9dec7943e8";

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

export const getQuicksighClient = (credentials: Credentials) => {
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
  quickSightClient: QuickSightClient,
  session_tags: SessionTag[],
) => {
  try {
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
        Key: "lta",
        Value: "*",
      },
      {
        Key: "org",
        Value: "*",
      },
    ];
  }

  const sessionTags: SessionTag[] = [];
  let ltaUsersString = "";
  let ltaIndexCount = 0;
  ltaUsers.map((lta) => {
    const lta_name = lta + "," + ltaUsersString;
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

  let orgUsersString = "";
  let orgIndexCount = 0;
  orgUsers.map((org) => {
    const org_name = org + "," + orgUsersString;
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

  return sessionTags;
};
