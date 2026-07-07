import { z } from 'zod';
import { CheckpointType } from '@prisma/client';
import { localizedTextSchema } from './route.schema';

export const createCheckpointSchema = z.object({
  routeId: z.string().uuid(),
  name: localizedTextSchema,
  type: z.nativeEnum(CheckpointType),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  altitudeM: z.number().optional(),
  radiusTriggerM: z.number().int().positive().max(2000).default(30),
  description: localizedTextSchema,
  mediaUrl: z.string().url().optional(),
  qrCode: z.string().trim().optional(),
  orderIndex: z.number().int().nonnegative(),
});

export const updateCheckpointSchema = createCheckpointSchema
  .omit({ routeId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateCheckpointInput = z.infer<typeof createCheckpointSchema>;
export type UpdateCheckpointInput = z.infer<typeof updateCheckpointSchema>;
