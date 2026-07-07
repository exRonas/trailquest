import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { cleanupOrphanedImages } from './image.service';
import {
  CreateCheckpointInput,
  UpdateCheckpointInput,
} from '../schemas/checkpoint.schema';

function mapCheckpoint<
  T extends {
    nameRu: string;
    nameEn: string;
    nameKk: string;
    descriptionRu: string;
    descriptionEn: string;
    descriptionKk: string;
  },
>(cp: T) {
  const { nameRu, nameEn, nameKk, descriptionRu, descriptionEn, descriptionKk, ...rest } =
    cp;
  return {
    ...rest,
    name: { ru: nameRu, en: nameEn, kk: nameKk },
    description: { ru: descriptionRu, en: descriptionEn, kk: descriptionKk },
  };
}

export async function listCheckpointsByRoute(routeId: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.notFound('Route not found');
  }
  const checkpoints = await prisma.checkpoint.findMany({
    where: { routeId },
    orderBy: { orderIndex: 'asc' },
  });
  return checkpoints.map(mapCheckpoint);
}

export async function createCheckpoint(input: CreateCheckpointInput) {
  const route = await prisma.route.findUnique({
    where: { id: input.routeId },
    select: { id: true },
  });
  if (!route) {
    throw AppError.badRequest('Cannot create checkpoint: route does not exist');
  }
  const { name, description, ...rest } = input;
  const created = await prisma.checkpoint.create({
    data: {
      ...rest,
      nameRu: name.ru,
      nameEn: name.en,
      nameKk: name.kk,
      descriptionRu: description.ru,
      descriptionEn: description.en,
      descriptionKk: description.kk,
    },
  });
  return mapCheckpoint(created);
}

export async function updateCheckpoint(id: string, input: UpdateCheckpointInput) {
  const exists = await prisma.checkpoint.findUnique({
    where: { id },
    select: { mediaUrl: true },
  });
  if (!exists) {
    throw AppError.notFound('Checkpoint not found');
  }
  const { name, description, ...rest } = input;
  const data: Prisma.CheckpointUncheckedUpdateInput = { ...rest };
  if (name) {
    data.nameRu = name.ru;
    data.nameEn = name.en;
    data.nameKk = name.kk;
  }
  if (description) {
    data.descriptionRu = description.ru;
    data.descriptionEn = description.en;
    data.descriptionKk = description.kk;
  }
  const updated = await prisma.checkpoint.update({ where: { id }, data });
  if ('mediaUrl' in rest) {
    await cleanupOrphanedImages([exists.mediaUrl], [rest.mediaUrl]);
  }
  return mapCheckpoint(updated);
}
