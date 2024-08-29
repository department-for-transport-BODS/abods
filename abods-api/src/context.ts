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


const wrapPrismaClient = (prisma: PrismaClient, maxRetries = 3) => {
  return new Proxy(prisma, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        return async function (...args) {
          let retries = 0;
          while (retries <= maxRetries) {
            try {
              return await target[prop](...args);
            } catch (error) {
              logger.error(error);

              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1010') {
                if (retries === maxRetries) {
                  throw new Error(`Authentication error persists after ${maxRetries} retries.`);
                }

                // Authentication error occurred, force token refresh
                global.prisma = await initialisePrismaClient(true);
                retries++;
              } else {
                throw error;
              }
            }
          }
        };
      }
      return target[prop];
    },
  });
};

export const createContext = async (force?: boolean): Promise<Context> => {
  logger.debug("Creating prisma context for database client")
  let prisma: PrismaClient;

  if (!global.prisma || force) {
    global.prisma = await initialisePrismaClient(force);
  }

  prisma = global.prisma;

  const wrappedPrisma = wrapPrismaClient(prisma);
  return { prisma: wrappedPrisma };
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