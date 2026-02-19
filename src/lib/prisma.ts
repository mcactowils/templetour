import { PrismaClient } from '@prisma/client'

function getDatabaseUrl() {
  // Check Vercel environment
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === 'production') {
    return process.env["DATABASE_URL_MAIN"];
  } else if (vercelEnv === 'preview') {
    return process.env["DATABASE_URL_STAGING"];
  } else {
    // Development - use staging or local
    return process.env["DATABASE_URL_DEV"] || process.env["DATABASE_URL"];
  }
}

// Set the DATABASE_URL environment variable based on deployment environment
const databaseUrl = getDatabaseUrl();
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma