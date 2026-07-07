import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';

// Augment Express's Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

/**
 * Requires a valid access token. Populates req.user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    throw AppError.unauthorized('Missing Bearer token');
  }
  req.user = verifyAccessToken(token);
  next();
}

/**
 * Populates req.user when a valid token is present, but does not fail when it
 * is absent — for endpoints that are public yet personalise when signed in.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (token) {
    req.user = verifyAccessToken(token);
  }
  next();
}

/**
 * Requires the authenticated user to have one of the given roles.
 * Must run after requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('This action requires elevated privileges');
    }
    next();
  };
}

export const requireAdmin = requireRole(Role.ADMIN);
