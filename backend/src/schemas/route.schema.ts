import { z } from 'zod';
import { RouteCategory, Difficulty, CheckpointType, TipType } from '@prisma/client';
import { pathPointSchema } from './common.schema';

export const routeListQuerySchema = z.object({
  category: z.nativeEnum(RouteCategory).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  region: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
});

export const countriesQuerySchema = z.object({
  lang: z.enum(['ru', 'en', 'kk']).default('ru'),
});

/** Per-language text — ru/en/kk. Only `ru` is required; en/kk may be filled
 *  in later via the admin panel's language tabs (clients fall back to ru). */
export const localizedTextSchema = z.object({
  ru: z.string().trim().min(1),
  en: z.string().trim().default(''),
  kk: z.string().trim().default(''),
});

/** A single { lat, lng } vertex of the road-snapped geometry. */
export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** A checkpoint as authored in the admin panel (no routeId/id — set on save). */
export const adminCheckpointSchema = z.object({
  name: localizedTextSchema,
  type: z.nativeEnum(CheckpointType),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  altitudeM: z.number().nullable().optional(),
  radiusTriggerM: z.number().int().positive().max(2000).default(30),
  description: localizedTextSchema,
  mediaUrl: z.string().url().nullable().optional(),
  // Existing checkpoints round-trip their QR token so it stays stable across
  // edits; new checkpoints omit it and the server mints one.
  qrCode: z.string().trim().min(1).optional(),
  orderIndex: z.number().int().nonnegative(),
});

/** A tip as authored in the admin panel; checkpointIndex refers to the
 *  position in the checkpoints[] array (null/undefined = route-wide). */
export const adminTipSchema = z.object({
  type: z.nativeEnum(TipType),
  text: localizedTextSchema,
  checkpointIndex: z.number().int().nonnegative().nullable().optional(),
});

const routeScalars = {
  title: localizedTextSchema,
  description: localizedTextSchema,
  category: z.nativeEnum(RouteCategory),
  difficulty: z.nativeEnum(Difficulty),
  distanceKm: z.number().positive(),
  estimatedMinutes: z.number().int().positive(),
  region: localizedTextSchema,
  country: localizedTextSchema,
  coverImageUrl: z.string().url().nullable().optional(),
};

/**
 * Full route payload used by the admin panel for both create (POST /routes) and
 * replace (PUT /routes/:id): scalars + waypoints + optional snapped geometry +
 * nested checkpoints and tips.
 */
export const fullRouteSchema = z.object({
  ...routeScalars,
  pathPoints: z.array(pathPointSchema).min(2, 'A route needs at least 2 points'),
  routeGeometry: z.array(geoPointSchema).nullable().optional(),
  checkpoints: z.array(adminCheckpointSchema).default([]),
  tips: z.array(adminTipSchema).default([]),
});

// Back-compat: a minimal create (scalars + pathPoints), still accepted.
export const createRouteSchema = z.object({
  ...routeScalars,
  pathPoints: z.array(pathPointSchema).min(2, 'A route needs at least 2 points'),
  routeGeometry: z.array(geoPointSchema).nullable().optional(),
});

// PATCH — every scalar optional, but reject an empty body.
export const updateRouteSchema = createRouteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' },
);

export type RouteListQuery = z.infer<typeof routeListQuerySchema>;
export type CountriesQuery = z.infer<typeof countriesQuerySchema>;
export type FullRouteInput = z.infer<typeof fullRouteSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
