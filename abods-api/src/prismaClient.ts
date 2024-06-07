import { PrismaClient } from '@prisma/client'
import { Signer } from '@aws-sdk/rds-signer';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

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

  if ((process.env.PROJECT_ENV || 'local') === 'local') {
    const password = process.env.DB_PASSWORD;
    return `postgresql://${username}:${password}@${hostname}:${port}/${dbName}?schema=public&gssencmode=disable`;
  } else {
    const token = await generateRdsIamToken(region, hostname, port, username);
    const encodedToken = encodeURIComponent(token);
    return `postgresql://${username}:${encodedToken}@${hostname}:${port}/${dbName}?schema=public`;
  }
}

let prisma: PrismaClient;

async function initialisePrismaClient(): Promise<PrismaClient> {
  if (!prisma) {
    const databaseUrl = await getDatabaseUrl();
    prisma = new PrismaClient({
      log: ['info'], 
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await prisma.$connect();
  }
  return prisma;
}

export { initialisePrismaClient };