/**
 * One-off: copy the legacy single-language `region`/`country` columns into the
 * new `regionEn`/`countryEn` columns (all existing content was authored in
 * English). `ru`/`kk` stay empty — to be filled in via the admin panel's
 * language tabs. Run once, then the follow-up migration drops the legacy
 * columns. Usage: npm run backfill:i18n-region-country
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const routes = await prisma.route.findMany({
    select: { id: true, region: true, country: true },
  });
  for (const r of routes) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.route.update({
      where: { id: r.id },
      data: { regionEn: r.region ?? '', countryEn: r.country ?? '' },
    });
  }
  console.log(`Routes backfilled: ${routes.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
