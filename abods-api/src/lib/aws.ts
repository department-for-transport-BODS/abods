import { STSClient, AssumeRoleCommand, Credentials } from "@aws-sdk/client-sts";
import {
  QuickSightClient,
  DescribeUserCommand,
  GenerateEmbedUrlForRegisteredUserCommand,
  RegisterUserCommand,
} from "@aws-sdk/client-quicksight";
import logger from "../logger";
import { SessionUser } from "../types/extra";

const region = "eu-west-2";
const targetRoleArn =
  "arn:aws:iam::228266753808:role/abods-quicksight-assume-role";
const quickSightAccountId = "228266753808";
const dashboardId = "949f55f3-7ae0-4386-9303-f14bdd54ee45";

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
    logger.error("Error assuming role:", error);
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

export const describeUser = async (
  username: string | undefined,
  quickSightClient: QuickSightClient,
) => {
  if (!username) return undefined;
  try {
    const command = new DescribeUserCommand({
      AwsAccountId: quickSightAccountId,
      Namespace: "default",
      UserName: username,
    });

    const response = await quickSightClient.send(command);
    return response.User?.Arn;
  } catch (error) {
    logger.error(`Error checking for user ${username}:`, error);
    return undefined;
  }
};

export const registerUser = async (
  user: SessionUser,
  quickSightClient: QuickSightClient,
) => {
  const command = new RegisterUserCommand({
    AwsAccountId: quickSightAccountId,
    Namespace: "default",
    IdentityType: "QUICKSIGHT",
    UserName: user.username!,
    Email: user.email!,
    UserRole: "READER",
  });

  const response = await quickSightClient.send(command);
  return response.User;
};

export const getDashboardUrl = async (
  userArn: string,
  quickSightClient: QuickSightClient,
) => {
  try {
    const command = new GenerateEmbedUrlForRegisteredUserCommand({
      AwsAccountId: quickSightAccountId,
      UserArn: userArn,
      ExperienceConfiguration: {
        Dashboard: {
          InitialDashboardId: dashboardId,
        },
      },
      SessionLifetimeInMinutes: 600,
    });

    const response = await quickSightClient.send(command);
    return response.EmbedUrl;
  } catch (error) {
    logger.error("Error getting embedded url:", error);
    return undefined;
  }
};
