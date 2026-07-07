import { z } from 'zod';

export const uploadImageSchema = z.object({
  data: z.string().min(1, 'Image data is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const imageIdParamSchema = z.object({
  id: z.string().uuid('Invalid image id'),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
