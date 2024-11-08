import { PrismaClient } from "@prisma/client";
import { initialisePrismaClient } from "./prismaClient.js";
import logger from "./logger.js";

export const createContext = async (force?: boolean): Promise<PrismaClient> => {
  logger.debug("Creating prisma context for database client");

  // @ts-expect-error not worth typing global
  if (!global.prisma || force) {
    // @ts-expect-error as above
    global.prisma = await initialisePrismaClient(force);
  }

  // @ts-expect-error as above
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const prisma: PrismaClient = global.prisma;

  logger.debug("Prisma client created");
  return prisma;
};
