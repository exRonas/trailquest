import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env';

/**
 * Single Prisma instance reused across the process. In dev, ts-node-dev respawns
 * the module; caching on globalThis avoids exhausting the connection pool with a
 * new client on every hot reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error'] : ['error', 'warn'],
  });

if (!isProd) {
  globalForPrisma.prisma = prisma;
}
