import { z } from 'zod';

export const updateMeSchema = z.object({
  // Preset avatar id ("<icon>-<colorIndex>", e.g. "panda-0"); null clears it
  // back to the initials fallback.
  avatar: z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-z-]+-\d+$/, 'Invalid avatar id')
    .nullable(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
