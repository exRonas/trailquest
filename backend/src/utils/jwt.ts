import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './AppError';

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenType: 'refresh';
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, tokenType: 'refresh' };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw AppError.unauthorized('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      env.JWT_REFRESH_SECRET,
    ) as RefreshTokenPayload;
    if (decoded.tokenType !== 'refresh') {
      throw new Error('wrong token type');
    }
    return decoded;
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
}
