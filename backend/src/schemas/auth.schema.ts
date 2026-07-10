import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
