import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
  body: z.string().trim().min(1, 'Post body cannot be empty').max(5000),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});

export const postIdParamSchema = z.object({
  id: z.string().uuid('Invalid post id'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
