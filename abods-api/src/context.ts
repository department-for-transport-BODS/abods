import { PrismaClient } from '@prisma/client';
import { initialisePrismaClient } from './prismaClient.js';
import logger from './logger.js';

export const createContext = async (force?: boolean): Promise<PrismaClient> => {
  logger.debug("Creating prisma context for database client")
  let prisma: PrismaClient;

  if (!global.prisma || force) {
    global.prisma = await initialisePrismaClient(force);
  }

  prisma = global.prisma;

  logger.debug("Prisma client created")
  return prisma;
};