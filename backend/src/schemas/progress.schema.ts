import { z } from 'zod';
import { pathLogPointSchema } from './common.schema';

/** Append a batch of GPS samples to a session's path log. */
export const logPointsSchema = z.object({
  points: z.array(pathLogPointSchema).min(1, 'At least one point is required'),
});

/** Mark a checkpoint as reached by its index in the route's ordered list. */
export const checkpointReachedSchema = z.object({
  checkpointIndex: z.number().int().nonnegative(),
});

/** Scan a checkpoint's physical QR code to mark it reached + award XP. */
export const scanCheckpointSchema = z.object({
  qrCode: z.string().trim().min(1, 'A QR code value is required'),
});

/** Optionally flush a final batch of points when completing a route. */
export const completeProgressSchema = z.object({
  points: z.array(pathLogPointSchema).optional(),
});

/** Toggle whether an activity is hidden from public/shared views. */
export const visibilitySchema = z.object({
  hidden: z.boolean(),
});

export type LogPointsInput = z.infer<typeof logPointsSchema>;
export type CheckpointReachedInput = z.infer<typeof checkpointReachedSchema>;
export type ScanCheckpointInput = z.infer<typeof scanCheckpointSchema>;
export type CompleteProgressInput = z.infer<typeof completeProgressSchema>;
export type VisibilityInput = z.infer<typeof visibilitySchema>;
