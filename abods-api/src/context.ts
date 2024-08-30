import { PrismaClient, Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { initialisePrismaClient } from './prismaClient.js';
import logger from './logger.js';

export type Context = {
  prisma: PrismaClient
}

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>
}

export const createContext = async (force?: boolean): Promise<Context> => {
  logger.debug("Creating prisma context for database client")
  let prisma: PrismaClient;

  if (!global.prisma || force) {
    global.prisma = await initialisePrismaClient(force);
  }

  prisma = global.prisma;

  logger.debug("Prisma client created")
  return { prisma: prisma };
};

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  }
}

export const setContext = async (db: Context) => {
  if(db && db.prisma)
    db.prisma.$disconnect

  db = await createContext(true)
}