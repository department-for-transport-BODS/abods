import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { initialisePrismaClient } from './prismaClient.js';

export type Context = {
  prisma: PrismaClient
}

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>
}

export const createContext = async (): Promise<Context> => {
  let prisma: PrismaClient;

  if(!global.prisma){
    global.prisma = await initialisePrismaClient();
  }
  
  prisma = global.prisma;

  return { prisma };
}

export const createMockContext = (): MockContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  }
}