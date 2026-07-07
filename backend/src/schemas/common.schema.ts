import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const routeIdParamSchema = z.object({
  routeId: z.string().uuid('Invalid routeId'),
});

/** A single ordered polyline vertex of a route. */
export const pathPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  altitudeM: z.number().optional(),
  sequence: z.number().int().nonnegative(),
});

/** A recorded GPS sample during navigation. */
export const pathLogPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speedKmh: z.number().nonnegative().optional(),
  // Accept ISO string or epoch millis.
  timestamp: z.union([z.string().datetime(), z.number().int().nonnegative()]),
});

export type PathPointInput = z.infer<typeof pathPointSchema>;
export type PathLogPointInput = z.infer<typeof pathLogPointSchema>;
