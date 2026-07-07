import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

/** Generate a stable, URL-safe token to encode in a checkpoint's physical QR. */
function generateQrCode(): string {
  return `cp_${randomBytes(9).toString('base64url')}`;
}
import {
  FullRouteInput,
  RouteListQuery,
  UpdateRouteInput,
} from '../schemas/route.schema';

/** API shape for a per-language text field — mirrors `localizedTextSchema`. */
interface LocalizedText {
  ru: string;
  en: string;
  kk: string;
}

function toLocalized(ru: string, en: string, kk: string): LocalizedText {
  return { ru, en, kk };
}

/**
 * Lightweight list view: omits the heavy pathPoints blob but includes a
 * checkpoint count so the Explore screen can render cards cheaply.
 */
export async function listRoutes(query: RouteListQuery) {
  const where: Prisma.RouteWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.difficulty) where.difficulty = query.difficulty;
  if (query.region) {
    const r = query.region;
    where.OR = [
      { regionRu: { contains: r, mode: 'insensitive' } },
      { regionEn: { contains: r, mode: 'insensitive' } },
      { regionKk: { contains: r, mode: 'insensitive' } },
    ];
  }
  if (query.country) {
    // Match against any language column — the country name shown to a client
    // came from GET /routes/countries in *some* language, so this lets a
    // mobile client filter by whatever string it was given without also
    // having to resend which language it was rendered in.
    const c = query.country;
    where.AND = [
      {
        OR: [
          { countryRu: { equals: c, mode: 'insensitive' } },
          { countryEn: { equals: c, mode: 'insensitive' } },
          { countryKk: { equals: c, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const routes = await prisma.route.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      titleRu: true,
      titleEn: true,
      titleKk: true,
      descriptionRu: true,
      descriptionEn: true,
      descriptionKk: true,
      category: true,
      difficulty: true,
      distanceKm: true,
      estimatedMinutes: true,
      regionRu: true,
      regionEn: true,
      regionKk: true,
      countryRu: true,
      countryEn: true,
      countryKk: true,
      coverImageUrl: true,
      createdAt: true,
      // pathPoints is selected only to derive a map marker coordinate; it is
      // stripped from the response below to keep the list payload small.
      pathPoints: true,
      _count: { select: { checkpoints: true, tips: true, posts: true } },
    },
  });

  return routes.map((r) => {
    const start = firstPoint(r.pathPoints);
    return {
      id: r.id,
      title: toLocalized(r.titleRu, r.titleEn, r.titleKk),
      description: toLocalized(r.descriptionRu, r.descriptionEn, r.descriptionKk),
      category: r.category,
      difficulty: r.difficulty,
      distanceKm: r.distanceKm,
      estimatedMinutes: r.estimatedMinutes,
      region: toLocalized(r.regionRu, r.regionEn, r.regionKk),
      country: toLocalized(r.countryRu, r.countryEn, r.countryKk),
      coverImageUrl: r.coverImageUrl,
      createdAt: r.createdAt,
      _count: r._count,
      startLat: start?.lat ?? null,
      startLng: start?.lng ?? null,
    };
  });
}

type CountryLang = 'ru' | 'en' | 'kk';

/**
 * Distinct list of countries that currently have at least one route, with a
 * route count each, in the requested language. Drives the mobile "browse by
 * country" picker so it only ever shows countries that actually have content.
 */
export async function listCountries(lang: CountryLang = 'ru') {
  // Prisma's groupBy() typing doesn't accept a dynamic field name even when
  // narrowed to a literal union, so this is a switch rather than a column
  // lookup table.
  switch (lang) {
    case 'en': {
      const grouped = await prisma.route.groupBy({
        by: ['countryEn'],
        where: { countryEn: { not: '' } },
        _count: { _all: true },
        orderBy: { countryEn: 'asc' },
      });
      return grouped.map((g) => ({
        country: g.countryEn,
        routeCount: g._count._all,
      }));
    }
    case 'kk': {
      const grouped = await prisma.route.groupBy({
        by: ['countryKk'],
        where: { countryKk: { not: '' } },
        _count: { _all: true },
        orderBy: { countryKk: 'asc' },
      });
      return grouped.map((g) => ({
        country: g.countryKk,
        routeCount: g._count._all,
      }));
    }
    default: {
      const grouped = await prisma.route.groupBy({
        by: ['countryRu'],
        where: { countryRu: { not: '' } },
        _count: { _all: true },
        orderBy: { countryRu: 'asc' },
      });
      return grouped.map((g) => ({
        country: g.countryRu,
        routeCount: g._count._all,
      }));
    }
  }
}

interface MaybePoint {
  lat?: unknown;
  lng?: unknown;
}

/** Safely read the first { lat, lng } from a route's JSON pathPoints. */
function firstPoint(
  pathPoints: Prisma.JsonValue,
): { lat: number; lng: number } | null {
  if (!Array.isArray(pathPoints) || pathPoints.length === 0) return null;
  const p = pathPoints[0] as MaybePoint;
  if (typeof p.lat === 'number' && typeof p.lng === 'number') {
    return { lat: p.lat, lng: p.lng };
  }
  return null;
}

const fullInclude = {
  checkpoints: { orderBy: { orderIndex: 'asc' as const } },
  tips: true,
  _count: { select: { posts: true } },
};

type FullRoute = Prisma.RouteGetPayload<{ include: typeof fullInclude }>;

/** Map a full Prisma route (flat *_Ru/*_En/*_Kk columns) to the nested API
 *  shape ({ ru, en, kk }) clients consume — same transform for the admin
 *  panel (which needs all three) and mobile (which picks one client-side). */
function mapRoute(route: FullRoute) {
  return {
    id: route.id,
    title: toLocalized(route.titleRu, route.titleEn, route.titleKk),
    description: toLocalized(
      route.descriptionRu,
      route.descriptionEn,
      route.descriptionKk,
    ),
    category: route.category,
    difficulty: route.difficulty,
    distanceKm: route.distanceKm,
    estimatedMinutes: route.estimatedMinutes,
    region: toLocalized(route.regionRu, route.regionEn, route.regionKk),
    country: toLocalized(route.countryRu, route.countryEn, route.countryKk),
    pathPoints: route.pathPoints,
    routeGeometry: route.routeGeometry,
    coverImageUrl: route.coverImageUrl,
    createdAt: route.createdAt,
    _count: route._count,
    checkpoints: route.checkpoints.map((cp) => ({
      id: cp.id,
      routeId: cp.routeId,
      name: toLocalized(cp.nameRu, cp.nameEn, cp.nameKk),
      type: cp.type,
      lat: cp.lat,
      lng: cp.lng,
      altitudeM: cp.altitudeM,
      radiusTriggerM: cp.radiusTriggerM,
      description: toLocalized(
        cp.descriptionRu,
        cp.descriptionEn,
        cp.descriptionKk,
      ),
      mediaUrl: cp.mediaUrl,
      qrCode: cp.qrCode,
      orderIndex: cp.orderIndex,
    })),
    tips: route.tips.map((tip) => ({
      id: tip.id,
      routeId: tip.routeId,
      checkpointId: tip.checkpointId,
      type: tip.type,
      text: toLocalized(tip.textRu, tip.textEn, tip.textKk),
    })),
  };
}

/** Full detail incl. polyline, ordered checkpoints and tips. */
export async function getRouteById(id: string) {
  const route = await prisma.route.findUnique({
    where: { id },
    include: fullInclude,
  });
  if (!route) {
    throw AppError.notFound('Route not found');
  }
  return mapRoute(route);
}

/** Scalars + JSON blobs shared by create and replace. */
function routeData(input: FullRouteInput): Prisma.RouteUncheckedCreateInput {
  return {
    titleRu: input.title.ru,
    titleEn: input.title.en,
    titleKk: input.title.kk,
    descriptionRu: input.description.ru,
    descriptionEn: input.description.en,
    descriptionKk: input.description.kk,
    category: input.category,
    difficulty: input.difficulty,
    distanceKm: input.distanceKm,
    estimatedMinutes: input.estimatedMinutes,
    regionRu: input.region.ru,
    regionEn: input.region.en,
    regionKk: input.region.kk,
    countryRu: input.country.ru,
    countryEn: input.country.en,
    countryKk: input.country.kk,
    pathPoints: input.pathPoints as unknown as Prisma.InputJsonValue,
    routeGeometry: (input.routeGeometry ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    coverImageUrl: input.coverImageUrl ?? null,
  };
}

/** Create the nested checkpoints + tips for a route inside a transaction. */
async function createChildren(
  tx: Prisma.TransactionClient,
  routeId: string,
  input: FullRouteInput,
): Promise<void> {
  const createdCheckpoints = [];
  for (const cp of input.checkpoints) {
    // eslint-disable-next-line no-await-in-loop
    const created = await tx.checkpoint.create({
      data: {
        routeId,
        nameRu: cp.name.ru,
        nameEn: cp.name.en,
        nameKk: cp.name.kk,
        type: cp.type,
        lat: cp.lat,
        lng: cp.lng,
        altitudeM: cp.altitudeM ?? null,
        radiusTriggerM: cp.radiusTriggerM,
        descriptionRu: cp.description.ru,
        descriptionEn: cp.description.en,
        descriptionKk: cp.description.kk,
        mediaUrl: cp.mediaUrl ?? null,
        // Preserve the existing QR token across edits (so printed QRs keep
        // working); mint a fresh one only for brand-new checkpoints.
        qrCode: cp.qrCode?.trim() || generateQrCode(),
        orderIndex: cp.orderIndex,
      },
    });
    createdCheckpoints.push(created);
  }

  for (const tip of input.tips) {
    const checkpointId =
      tip.checkpointIndex != null
        ? createdCheckpoints[tip.checkpointIndex]?.id ?? null
        : null;
    // eslint-disable-next-line no-await-in-loop
    await tx.routeTip.create({
      data: {
        routeId,
        checkpointId,
        type: tip.type,
        textRu: tip.text.ru,
        textEn: tip.text.en,
        textKk: tip.text.kk,
      },
    });
  }
}

/** Create a full route (scalars + waypoints + geometry + checkpoints + tips). */
export async function createRoute(input: FullRouteInput) {
  return prisma.$transaction(async (tx) => {
    const route = await tx.route.create({ data: routeData(input) });
    await createChildren(tx, route.id, input);
    const full = await tx.route.findUniqueOrThrow({
      where: { id: route.id },
      include: fullInclude,
    });
    return mapRoute(full);
  });
}

/** Replace a full route and all of its checkpoints/tips. */
export async function replaceRoute(id: string, input: FullRouteInput) {
  await ensureRouteExists(id);
  return prisma.$transaction(async (tx) => {
    // Wipe children first (route-wide tips aren't covered by checkpoint cascade).
    await tx.routeTip.deleteMany({ where: { routeId: id } });
    await tx.checkpoint.deleteMany({ where: { routeId: id } });
    await tx.route.update({ where: { id }, data: routeData(input) });
    await createChildren(tx, id, input);
    const full = await tx.route.findUniqueOrThrow({
      where: { id },
      include: fullInclude,
    });
    return mapRoute(full);
  });
}

/** Partial scalar update (no nested children, no title/description — use
 *  the full create/replace endpoints for those since they're per-language). */
export async function updateRoute(id: string, input: UpdateRouteInput) {
  await ensureRouteExists(id);
  const { title, description, region, country, routeGeometry, ...rest } = input;
  const data: Prisma.RouteUncheckedUpdateInput = { ...rest };
  if (routeGeometry !== undefined) {
    data.routeGeometry = (routeGeometry ?? Prisma.JsonNull) as Prisma.InputJsonValue;
  }
  if (title) {
    data.titleRu = title.ru;
    data.titleEn = title.en;
    data.titleKk = title.kk;
  }
  if (description) {
    data.descriptionRu = description.ru;
    data.descriptionEn = description.en;
    data.descriptionKk = description.kk;
  }
  if (region) {
    data.regionRu = region.ru;
    data.regionEn = region.en;
    data.regionKk = region.kk;
  }
  if (country) {
    data.countryRu = country.ru;
    data.countryEn = country.en;
    data.countryKk = country.kk;
  }
  return prisma.route.update({ where: { id }, data });
}

export async function deleteRoute(id: string): Promise<void> {
  await ensureRouteExists(id);
  // Cascades remove checkpoints, tips, posts and progress (see schema).
  await prisma.route.delete({ where: { id } });
}

async function ensureRouteExists(id: string): Promise<void> {
  const exists = await prisma.route.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    throw AppError.notFound('Route not found');
  }
}
