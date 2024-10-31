import { PrismaClient, Prisma } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { initialisePrismaClient } from "./prismaClient.js";
import logger from "./logger.js";
import { getAPITokenHash } from "./lib/apiauth.js";

export type AuthContext = {
  allowedTokenHash: string;
  Hmac: string;
};

export type Context = {
  prisma: PrismaClient;
  apiKeyAuth?: AuthContext;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
  apiKeyAuth?: AuthContext;
};

export const createContext = async (force?: boolean): Promise<Context> => {
  logger.debug("Creating prisma context for database client");
  let prisma: PrismaClient;

  if (!global.prisma || force) {
    global.prisma = await initialisePrismaClient(force);
  }

  prisma = global.prisma;

  logger.debug("Prisma client created");
  const apiKeyAuth = await getAPITokenHash();

  return { prisma: prisma, apiKeyAuth: apiKeyAuth };
};

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
    apiKeyAuth: {
      allowedTokenHash: "test",
      Hmac: "Test",
    },
  };
};
