import { PrismaClient } from '../generated/prisma'

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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma