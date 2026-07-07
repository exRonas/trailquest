/**
 * One-off: copy the legacy single-language `title`/`description`/`name`/`text`
 * columns into the new `*En` columns (all existing content was authored in
 * English). `ru`/`kk` stay empty — to be filled in via the admin panel's new
 * language tabs. Run once, then the follow-up migration drops the legacy
 * columns. Usage: npm run backfill:i18n
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const routes = await prisma.route.findMany({
    select: { id: true, title: true, description: true },
  });
  for (const r of routes) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.route.update({
      where: { id: r.id },
      data: { titleEn: r.title, descriptionEn: r.description },
    });
  }
  console.log(`Routes backfilled: ${routes.length}`);

  const checkpoints = await prisma.checkpoint.findMany({
    select: { id: true, name: true, description: true },
  });
  for (const c of checkpoints) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.checkpoint.update({
      where: { id: c.id },
      data: { nameEn: c.name, descriptionEn: c.description },
    });
  }
  console.log(`Checkpoints backfilled: ${checkpoints.length}`);

  const tips = await prisma.routeTip.findMany({ select: { id: true, text: true } });
  for (const t of tips) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.routeTip.update({ where: { id: t.id }, data: { textEn: t.text } });
  }
  console.log(`Tips backfilled: ${tips.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
