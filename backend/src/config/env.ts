import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Validate process.env at boot. Failing fast here means the rest of the app can
 * treat configuration as guaranteed-present and correctly typed.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('*'),

  // Email — optional. If unset, requestPasswordReset logs instead of
  // sending (dev-safe no-op rather than a boot-time crash).
  EMAIL_PROVIDER: z.enum(['smtp', 'resend']).default('smtp'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('TrailQuest <no-reply@trailquest.app>'),
  RESEND_API_KEY: z.string().optional(),
  PASSWORD_RESET_URL_BASE: z.string().default('trailquest://reset-password'),

  // Push — optional. If unset, push sends are skipped (logged, not thrown).
  // JSON (raw service-account contents) wins over PATH — set JSON on hosts
  // with no writable/committable filesystem (e.g. Render); PATH is simplest
  // for local dev.
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid environment configuration:\n',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins =
  env.CORS_ORIGIN === '*'
    ? '*'
    : env.CORS_ORIGIN.split(',').map((o) => o.trim());

export const isProd = env.NODE_ENV === 'production';
