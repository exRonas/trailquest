import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';

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
