import crypto from "crypto";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import logger from "../logger.js";
import { AuthContext, RequestContext } from "../types/extra.js";
import { GraphQLResolveInfo } from "graphql";
import { getHeader, throwUnauthenticatedError } from "../resolvers/helpers.js";

export const hashApiKey = (key: string, hmacSecret: string): string => {
  if (!key || !hmacSecret) {
    throw new Error("Key and HMAC secret are required");
  }

  return crypto
    .createHmac("sha256", Buffer.from(hmacSecret, "utf-8"))
    .update(Buffer.from(key, "utf-8"))
    .digest("base64");
};

interface AuthResult {
  isAuthenticated: boolean;
  message?: string;
}

export const requireApiToken = (context: RequestContext): AuthResult => {
  if (!context.apiKeyAuth) {
    logger.error("API authentication is disabled due to missing config");
    return {
      isAuthenticated: false,
      message: "Authentication required for endpoint but not configured",
    };
  }

  const authHeaderData = getHeader(context.headers, "Authorization");

  if (!authHeaderData) {
    return {
      isAuthenticated: false,
      message: "Authorization Header is missing is missing",
    };
  }

  const providedToken: string = (
    typeof authHeaderData === "string"
      ? authHeaderData
      : authHeaderData.join("")
  ).replace("Bearer ", "");

  if (!providedToken) {
    return {
      isAuthenticated: false,
      message: "API token is required in format Bearer <api-key>",
    };
  }

  try {
    const hashedToken = hashApiKey(providedToken, context.apiKeyAuth.Hmac);
    const isValid = hashedToken === context.apiKeyAuth.allowedTokenHash;

    return {
      isAuthenticated: isValid,
      message: isValid ? undefined : "Invalid API token",
    };
  } catch (error) {
    logger.error("Error validating API token:", error);
    return {
      isAuthenticated: false,
      message: "Error validating API token",
    };
  }
};

const getClientHashFromAWS = async (): Promise<AuthContext> => {
  if (!process.env.AWS_REGION || !process.env.M2M_API_SECRET_NAME) {
    throw new Error(
      "API Token Auth Hash: AWS region and secret name are required",
    );
  }

  const secretsManager = new SecretsManager({
    region: process.env.AWS_REGION,
  });

  const response = await secretsManager.getSecretValue({
    SecretId: process.env.M2M_API_SECRET_NAME,
  });

  if (!response.SecretString) {
    throw new Error("Token Hash Secret not found in AWS Secrets Manager");
  }

  const secret: AuthContext = JSON.parse(response.SecretString);
  if (!secret.allowedTokenHash || !secret.Hmac) {
    const missingFields = {
      allowedTokenHash: !secret.allowedTokenHash,
      Hmac: !secret.Hmac,
    };
    logger.error(
      "Invalid secret format - missing required fields",
      missingFields,
    );
    throw new Error("Invalid Secret Format in AWS Secrets Manager for Tokens");
  }
  logger.info(
    "Sucessfully retrived API Token Hash and Hmac from Secrets Manager",
  );
  return {
    allowedTokenHash: secret.allowedTokenHash,
    Hmac: secret.Hmac,
  };
};

export const getAPITokenHash = async (): Promise<AuthContext | undefined> => {
  if (process.env.M2M_API_KEY_HASH && process.env.M2M_API_KEY_HMAC) {
    logger.warn(
      "Using Client Token Hash and HMAC from M2M_API_KEY_HASH env var",
    );
    return {
      allowedTokenHash: process.env.M2M_API_KEY_HASH,
      Hmac: process.env.M2M_API_KEY_HMAC,
    };
  }

  try {
    return await getClientHashFromAWS();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.warn(
      `API Token authentication is disabled: Failed to get API key hash - Error: ${errorMessage}`,
    );
    return undefined;
  }
};

type ResolverFunction<TResult, TParent, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: RequestContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export const tokenAuthRequiredResolver = <TResult, TParent, TArgs>(
  resolver: ResolverFunction<TResult, TParent, TArgs>,
): ResolverFunction<TResult, TParent, TArgs> => {
  return async (parent, args, context, info) => {
    const authResult = requireApiToken(context);

    if (!authResult.isAuthenticated) {
      throwUnauthenticatedError(authResult.message, info.path.key);
    }

    return resolver(parent, args, context, info);
  };
};
