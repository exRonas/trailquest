import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { sendMail } from '../lib/mailer';
import { env } from '../config/env';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export const BCRYPT_ROUNDS = 12;

/** Public-safe user shape — never leaks the password hash. */
export type SafeUser = Omit<User, 'passwordHash'>;

function toSafeUser(user: User): SafeUser {
  // Destructure the hash out explicitly so it can never be serialised.
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

function issueTokens(user: User): AuthResult {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  const refreshToken = signRefreshToken(user.id);
  return { user: toSafeUser(user), accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
    },
  });

  return issueTokens(user);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Always run a comparison to avoid leaking whether the email exists via timing.
  const fallbackHash =
    '$2a$12$0000000000000000000000000000000000000000000000000000a';
  const ok = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? fallbackHash,
  );
  if (!user || !ok) {
    throw AppError.unauthorized('Invalid email or password');
  }

  return issueTokens(user);
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw AppError.unauthorized('Account no longer exists');
  }
  return issueTokens(user);
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return toSafeUser(user);
}

/**
 * Always resolves without revealing whether the email exists (avoids
 * account enumeration) — if it does, mints a one-time token and emails a
 * reset link; if not, this is a silent no-op.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${env.PASSWORD_RESET_URL_BASE}?token=${rawToken}`;
  // Fire-and-forget: mail delivery speed/reliability is entirely outside
  // our control (seen live — a dead recipient domain hung Gmail's relay
  // well past nodemailer's own timeouts). Awaiting it here would make the
  // response time leak whether the email exists (the not-found branch
  // above returns instantly) and would hang the request on a slow mail
  // server. The token is already committed, so a reset link the user
  // never receives can just be requested again.
  sendMail({
    to: user.email,
    subject: 'Reset your TrailQuest password',
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>Someone requested a password reset for your TrailQuest account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn('[auth] password reset email failed to send:', err);
  });
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashResetToken(rawToken);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    throw AppError.badRequest('This reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
