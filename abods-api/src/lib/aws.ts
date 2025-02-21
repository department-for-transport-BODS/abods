import { STSClient, AssumeRoleCommand, Credentials } from "@aws-sdk/client-sts";
import {
  QuickSightClient,
  GenerateEmbedUrlForAnonymousUserCommand,
} from "@aws-sdk/client-quicksight";
import logger from "../logger.js";

const region = "eu-west-2";
const targetRoleArn =
  "arn:aws:iam::228266753808:role/abods-quicksight-assume-role";
const quickSightAccountId = "228266753808";
const dashboardId = "21cd0310-6194-4afe-b5e4-62b3843fe363";

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
  operatorRefs: string[],
  quickSightClient: QuickSightClient,
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
      SessionTags: [
        {
          Key: "TXC:NOC",
          Value: operatorRefs.join(","),
        },
      ],
    });

    const response = await quickSightClient.send(command);
    return response.EmbedUrl;
  } catch (error) {
    logger.error({ error }, "Error getting embedded url:");
    return undefined;
  }
};
