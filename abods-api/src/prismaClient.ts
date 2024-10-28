import { PrismaClient } from '@prisma/client'
import { Signer } from '@aws-sdk/rds-signer';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import logger from './logger.js';

const isLocal = (process.env.PROJECT_ENV || 'local') === 'local';
const logQueries = isLocal && process.env.SUPPRESS_QUERY_LOG === "true";

async function generateRdsIamToken(region: string, hostname: string, port: number, username: string): Promise<string> {
  const signer = new Signer({ hostname, port, username, region, credentials: fromNodeProviderChain() });
  return signer.getAuthToken();
}

async function getDatabaseUrl(): Promise<string> {
  const region = process.env.AWS_REGION || 'eu-west-2';
  const hostname = process.env.DB_HOST || 'localhost';
  const port = parseInt((process.env.DB_PORT || '5432'), 10);
  const username = process.env.DB_USER || 'postgres';
  const dbName = process.env.DB_NAME || 'postgres';

  if (isLocal) {
    const password = process.env.DB_PASSWORD;
    return `postgresql://${username}:${password}@${hostname}:${port}/${dbName}?schema=public&connection_limit=50&gssencmode=disable&sslmode=prefer&ssl=true`;
  } else {
    const token = await generateRdsIamToken(region, hostname, port, username);
    const encodedToken = encodeURIComponent(token);
    return `postgresql://${username}:${encodedToken}@${hostname}:${port}/${dbName}?schema=public&connection_limit=50&sslmode=prefer&ssl=true`;
  }
}

let prisma: PrismaClient;

async function initialisePrismaClient(force = false): Promise<PrismaClient> {
  logger.debug("Initialising prisma client")
 
  if (!prisma || force ) {
    logger.debug("Getting database url and prisma client")
    const databaseUrl = await getDatabaseUrl();
    prisma = new PrismaClient({
      log: logQueries ? [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ]: ['info'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    if (logQueries) {
      // @ts-ignore
      prisma.$on('query', (e) => {
      // @ts-ignore
        console.log('\nQuery: ' + e.query)
        if (isLocal) {
          // @ts-ignore
          console.log('Params: ' + e.params);
        }
        // @ts-ignore
        console.log('Duration: ' + e.duration + 'ms\n')
      })
    }
    await Promise.all([prisma.$disconnect(),prisma.$connect()])
    logger.debug("Prisma has connected to the database")
  }
  return prisma;
}

export { initialisePrismaClient };