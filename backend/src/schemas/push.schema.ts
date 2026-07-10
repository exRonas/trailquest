import { z } from 'zod';

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'token is required'),
  platform: z.enum(['android', 'ios']).default('android'),
});

export const unregisterPushTokenSchema = z.object({
  token: z.string().min(1, 'token is required'),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type UnregisterPushTokenInput = z.infer<typeof unregisterPushTokenSchema>;
