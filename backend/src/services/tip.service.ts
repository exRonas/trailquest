import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { CreateTipInput } from '../schemas/tip.schema';

function mapTip<T extends { textRu: string; textEn: string; textKk: string }>(
  tip: T,
) {
  const { textRu, textEn, textKk, ...rest } = tip;
  return { ...rest, text: { ru: textRu, en: textEn, kk: textKk } };
}

export async function listTipsByRoute(routeId: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.notFound('Route not found');
  }
  const tips = await prisma.routeTip.findMany({
    where: { routeId },
    orderBy: { type: 'asc' },
  });
  return tips.map(mapTip);
}

export async function createTip(input: CreateTipInput) {
  const route = await prisma.route.findUnique({
    where: { id: input.routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.badRequest('Cannot create tip: route does not exist');
  }

  if (input.checkpointId) {
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: input.checkpointId },
      select: { id: true, routeId: true },
    });
    if (!checkpoint) {
      throw AppError.badRequest('Cannot create tip: checkpoint does not exist');
    }
    if (checkpoint.routeId !== input.routeId) {
      throw AppError.badRequest('Checkpoint does not belong to the given route');
    }
  }

  const created = await prisma.routeTip.create({
    data: {
      routeId: input.routeId,
      checkpointId: input.checkpointId ?? null,
      type: input.type,
      textRu: input.text.ru,
      textEn: input.text.en,
      textKk: input.text.kk,
    },
  });
  return mapTip(created);
}
