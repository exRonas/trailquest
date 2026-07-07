import { z } from 'zod';
import { TipType } from '@prisma/client';
import { localizedTextSchema } from './route.schema';

export const createTipSchema = z.object({
  routeId: z.string().uuid(),
  checkpointId: z.string().uuid().optional(),
  type: z.nativeEnum(TipType),
  text: localizedTextSchema,
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
