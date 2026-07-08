import { z } from 'zod';

export const updateMeSchema = z
  .object({
    // Preset avatar id ("<icon>-<colorIndex>", e.g. "panda-0"); null clears it
    // back to the initials fallback. Omit to leave unchanged.
    avatar: z
      .string()
      .trim()
      .max(40)
      .regex(/^[a-z-]+-\d+$/, 'Invalid avatar id')
      .nullable()
      .optional(),
    // Display name — also drives the initials fallback avatar. Omit to leave
    // unchanged.
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80)
      .optional(),
  })
  .refine((v) => v.avatar !== undefined || v.name !== undefined, {
    message: 'No fields to update',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
