import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function main(): Promise<void> {
  // Verify the DB connection up front so a misconfigured DATABASE_URL fails
  // loudly at boot instead of on the first request.
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(
      `🚀 TrailQuest API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', err);
  await prisma.$disconnect();
  process.exit(1);
});
