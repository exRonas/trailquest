import { z } from 'zod';

export const upsertReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string().trim().max(2000).optional().default(''),
});

export type UpsertReviewInput = z.infer<typeof upsertReviewSchema>;
